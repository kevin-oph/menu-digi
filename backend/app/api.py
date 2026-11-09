import asyncio
from collections import Counter
import hmac
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import event, select, update
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from .domain import access_token, digest, order_message, quote, request_hash
from .models import AuditEvent, Base, Order, Product, SchemaRevision, Shop
from .schemas import BusinessConfig, CategoryChange, ConfigUpdate, ConfirmInput, OrderInput, ProductCreate, ProductUpdate, SettleInput, StatusInput, VersionInput
from .media import MAX_BYTES, create_photo, remove_created


def create_app(database_url=None, secret=None, admin_token=None, seed_path=None, media_root=None):
    database_url = database_url or os.environ.get('DATABASE_URL', 'sqlite+aiosqlite:///./pizzetas-local.db')
    secret = secret or os.environ.get('APP_SECRET', '')
    admin_token = admin_token or os.environ.get('ADMIN_TOKEN', '')
    seed_path = Path(seed_path or Path(__file__).parent.parent / 'seed.json')
    media_root = Path(media_root or os.environ.get('MEDIA_ROOT', str(Path(__file__).parent.parent / '.local' / 'media'))).resolve()
    engine = create_async_engine(database_url, pool_pre_ping=True)
    sessions = async_sessionmaker(engine, expire_on_commit=False)

    if database_url.startswith('sqlite'):
        @event.listens_for(engine.sync_engine, 'connect')
        def sqlite_pragmas(connection, _):
            cursor = connection.cursor()
            cursor.execute('PRAGMA foreign_keys=ON')
            cursor.execute('PRAGMA busy_timeout=15000')
            cursor.close()

    @asynccontextmanager
    async def lifespan(app):
        if len(secret) < 32 or len(admin_token) < 32:
            raise RuntimeError('Configura APP_SECRET y ADMIN_TOKEN de al menos 32 caracteres. No hay claves por defecto.')
        media_root.mkdir(parents=True, exist_ok=True)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        async with sessions.begin() as db:
            revision = await db.scalar(select(SchemaRevision.id))
            if revision is None:
                db.add(SchemaRevision(id=1))
            elif revision != 1:
                raise RuntimeError('Versión de esquema no compatible. Aplicar la migración correspondiente.')
            shop = await db.scalar(select(Shop).where(Shop.slug == 'pizzetas'))
            if shop is None:
                seed = json.loads(seed_path.read_text(encoding='utf-8'))
                shop = Shop(id=str(uuid4()), slug='pizzetas', config=BusinessConfig(name='Pizzetas Artesanales').model_dump(), categories=seed['categories'], extras=seed['extras'], admin_hash=digest(admin_token), version=1)
                db.add(shop)
                await db.flush()
                for p in seed['products']:
                    db.add(Product(shop_id=shop.id, id=p['id'], data=p, version=1))
        yield
        await engine.dispose()

    app = FastAPI(title='Pizzetas · API local V1', lifespan=lifespan, docs_url='/api/docs', openapi_url='/api/openapi.json', redoc_url=None)
    app.state.engine, app.state.sessions = engine, sessions
    app.state.media_root = media_root
    photo_gate = asyncio.Semaphore(1)
    app.mount('/media', StaticFiles(directory=media_root, check_dir=False), name='media')

    @app.exception_handler(OperationalError)
    async def database_failure(request, exc):
        return JSONResponse(status_code=503, content={'detail': 'No se pudo completar la operación. Conserva el pedido y reintenta con la misma referencia.'}, headers={'Retry-After': '2'})

    async def session():
        async with sessions() as db:
            yield db

    async def shop_by_slug(db, slug, lock=False):
        query = select(Shop).where(Shop.slug == slug)
        shop = await db.scalar(query.with_for_update() if lock else query)
        if not shop:
            raise HTTPException(404, 'Negocio no encontrado.')
        return shop

    async def authorized(db, slug, authorization, lock=False):
        shop = await shop_by_slug(db, slug, lock)
        token = authorization[7:] if authorization and authorization.startswith('Bearer ') else ''
        if not token or not hmac.compare_digest(digest(token), shop.admin_hash):
            raise HTTPException(401, 'Acceso no autorizado para este negocio.')
        return shop

    def audit(db, shop, resource_id, kind, details):
        db.add(AuditEvent(id=str(uuid4()), shop_id=shop.id, resource_id=resource_id, kind=kind, details=details))

    def receipt(order, include_token=False):
        body = {'id': order.id, 'folio': order.folio, 'version': order.version, 'status': order.status, 'createdAt': order.created_at.isoformat(), 'total': order.total, 'minimumDeposit': order.minimum_deposit, 'paid': order.paid, 'balance': order.total-order.paid, 'pickupConfirmed': order.pickup_confirmed, 'snapshot': order.snapshot, 'message': order_message(order)}
        if include_token:
            body['accessToken'] = access_token(secret, order.id)
        if order.status != 'pending_validation':
            body['confirmationMessage'] = order_message(order, confirmed=True)
        return body

    @app.get('/api/health')
    async def health(db=Depends(session)):
        await db.execute(select(SchemaRevision.id))
        return {'status': 'ok', 'schema': 1}

    @app.get('/api/shops/{slug}/menu')
    async def menu(slug: str, db=Depends(session)):
        shop = await shop_by_slug(db, slug)
        products = (await db.scalars(select(Product).where(Product.shop_id == shop.id).order_by(Product.id))).all()
        return {'config': BusinessConfig.model_validate(shop.config).model_dump(), 'version': shop.version, 'categories': shop.categories, 'extras': shop.extras, 'products': [{**p.data,'version':p.version} for p in products if not p.data.get('deleted')]}

    @app.get('/api/admin/{slug}/config')
    async def admin_config(slug: str, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization)
        return {'config': BusinessConfig.model_validate(shop.config).model_dump(), 'version': shop.version}

    @app.put('/api/admin/{slug}/config')
    async def change_config(slug: str, body: ConfigUpdate, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        config = body.config.model_dump()
        bank_changed = config['bankDestination'] != shop.config.get('bankDestination')
        if bank_changed and not body.bankChangeAcknowledged:
            raise HTTPException(422, 'Confirma que revisaste el banco, el titular y el número antes de guardar.')
        changed = await db.execute(update(Shop).where(Shop.id == shop.id, Shop.version == body.expectedVersion).values(config=config, version=Shop.version+1))
        if changed.rowcount != 1:
            raise HTTPException(409, 'La configuración cambió en otra pestaña. Recarga y revisa antes de guardar.')
        bank = config.get('bankDestination')
        audit(db, shop, shop.id, 'config_updated', {'version': body.expectedVersion+1, 'bankChanged': bank_changed, 'destinationLast4': bank['number'][-4:] if bank else None})
        await db.commit()
        return {'config': config, 'version': body.expectedVersion+1}

    @app.get('/api/admin/{slug}/products')
    async def admin_products(slug: str, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization)
        products = (await db.scalars(select(Product).where(Product.shop_id == shop.id).order_by(Product.id))).all()
        return [{'data': p.data, 'version': p.version} for p in products if not p.data.get('deleted')]

    @app.get('/api/admin/{slug}/categories')
    async def admin_categories(slug: str, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization)
        return {'categories': shop.categories, 'version': shop.version}

    async def save_categories(db, shop, categories, version):
        changed = await db.execute(update(Shop).where(Shop.id == shop.id, Shop.version == version).values(categories=categories, version=Shop.version+1))
        if changed.rowcount != 1:
            raise HTTPException(409, 'Las categorías cambiaron. Recarga antes de guardar.')
        audit(db, shop, shop.id, 'categories_updated', {'version': version+1})
        await db.commit()
        return {'categories': categories, 'version': version+1}

    @app.post('/api/admin/{slug}/categories', status_code=201)
    async def create_category(slug: str, body: CategoryChange, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        item = {'id':'cat-'+uuid4().hex, **body.model_dump(exclude={'expectedVersion'})}
        return await save_categories(db, shop, [*shop.categories,item], body.expectedVersion)

    @app.put('/api/admin/{slug}/categories/{category_id}')
    async def edit_category(slug: str, category_id: str, body: CategoryChange, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        if not any(c['id']==category_id for c in shop.categories):
            raise HTTPException(404, 'Categoría no encontrada.')
        items = [{**c,**body.model_dump(exclude={'expectedVersion'})} if c['id']==category_id else c for c in shop.categories]
        return await save_categories(db, shop, items, body.expectedVersion)

    @app.delete('/api/admin/{slug}/categories/{category_id}')
    async def delete_category(slug: str, category_id: str, body: VersionInput, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        if category_id=='pizzas':
            raise HTTPException(422, 'Puedes renombrar Pizzas, pero se conserva su categoría base para la regla de mitades.')
        if not any(c['id']==category_id for c in shop.categories):
            raise HTTPException(404, 'Categoría no encontrada.')
        products = (await db.scalars(select(Product).where(Product.shop_id==shop.id))).all()
        if any(p.data['category']==category_id and not p.data.get('deleted') for p in products):
            raise HTTPException(409, 'La categoría tiene productos. Retíralos antes de eliminarla.')
        return await save_categories(db, shop, [c for c in shop.categories if c['id']!=category_id], body.expectedVersion)

    @app.post('/api/admin/{slug}/products', status_code=201)
    async def create_product(slug: str, body: ProductCreate, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        if body.category not in {c['id'] for c in shop.categories}:
            raise HTTPException(422, 'Elige una categoría existente.')
        if body.category=='pizzas' and [v.name for v in body.variants]!=['Personal','Grande']:
            raise HTTPException(422, 'Las pizzas usan presentaciones Personal y Grande.')
        changed=await db.execute(update(Shop).where(Shop.id==shop.id,Shop.version==body.expectedCatalogVersion).values(version=Shop.version+1))
        if changed.rowcount!=1:
            raise HTTPException(409, 'La carta cambió. Recarga sus categorías antes de agregar un producto.')
        data={'id':'p-'+uuid4().hex,**body.model_dump(exclude={'expectedCatalogVersion'})}
        db.add(Product(shop_id=shop.id,id=data['id'],data=data,version=1))
        audit(db,shop,data['id'],'product_created',{'catalogVersion':body.expectedCatalogVersion+1})
        await db.commit()
        return {'data':data,'version':1,'catalogVersion':body.expectedCatalogVersion+1}

    @app.delete('/api/admin/{slug}/products/{product_id}')
    async def delete_product(slug: str, product_id: str, body: VersionInput, authorization: str | None = Header(default=None), db=Depends(session)):
        shop=await authorized(db,slug,authorization,lock=True)
        product=await db.get(Product,(shop.id,product_id))
        if not product or product.data.get('deleted'):
            raise HTTPException(404,'Producto no encontrado.')
        data={**product.data,'available':False,'deleted':True}
        changed=await db.execute(update(Product).where(Product.shop_id==shop.id,Product.id==product_id,Product.version==body.expectedVersion).values(data=data,version=Product.version+1))
        if changed.rowcount!=1:
            raise HTTPException(409,'El producto cambió. Recarga antes de retirarlo.')
        audit(db,shop,product_id,'product_removed',{'version':body.expectedVersion+1})
        await db.commit()
        return {'removed':True}

    @app.put('/api/admin/{slug}/products/{product_id}')
    async def edit_product(slug: str, product_id: str, body: ProductUpdate, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        product = await db.get(Product, (shop.id, product_id))
        if not product or product.data.get('deleted'):
            raise HTTPException(404, 'Producto no encontrado.')
        data = {**product.data, **body.model_dump(exclude={'expectedVersion'})}
        if data['category'] == 'pizzas' and [v['name'] for v in data['variants']] != ['Personal', 'Grande']:
            raise HTTPException(422, 'Conserva Personal y Grande para las pizzas de dos mitades.')
        result = await db.execute(update(Product).where(Product.shop_id == shop.id, Product.id == product_id, Product.version == body.expectedVersion).values(data=data, version=Product.version+1))
        if result.rowcount != 1:
            raise HTTPException(409, 'El producto cambió. Recarga antes de guardar.')
        audit(db, shop, product_id, 'product_updated', {'version': body.expectedVersion+1})
        await db.commit()
        return {'data': data, 'version': body.expectedVersion+1}

    @app.post('/api/admin/{slug}/products/{product_id}/photo')
    async def upload_photo(slug: str, product_id: str, expectedVersion: int, request: Request, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        product = await db.get(Product, (shop.id, product_id))
        if not product or product.data.get('deleted'):
            raise HTTPException(404, 'Producto no encontrado.')
        if product.version != expectedVersion:
            raise HTTPException(409, 'El producto cambió. Recarga antes de subir la foto.')
        content = bytearray()
        async for chunk in request.stream():
            content.extend(chunk)
            if len(content) > MAX_BYTES:
                raise HTTPException(413, 'La foto supera 10 MB. Elige una versión más ligera.')
        paths = []
        try:
            async with photo_gate:
                photo, paths = await asyncio.to_thread(create_photo, bytes(content), media_root, shop.id)
            data = {**product.data, **photo}
            changed = await db.execute(update(Product).where(Product.shop_id == shop.id, Product.id == product_id, Product.version == expectedVersion).values(data=data, version=Product.version+1))
            if changed.rowcount != 1:
                raise HTTPException(409, 'Otra edición cambió el producto. Recarga para revisar su foto.')
            audit(db, shop, product_id, 'photo_updated', {'version': expectedVersion+1})
            await db.commit()
            return {'data': data, 'version': expectedVersion+1}
        except ValueError as exc:
            raise HTTPException(422, str(exc))
        except Exception:
            await db.rollback()
            await asyncio.to_thread(remove_created, paths, media_root)
            raise

    @app.delete('/api/admin/{slug}/products/{product_id}/photo')
    async def remove_photo(slug: str, product_id: str, body: VersionInput, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization, lock=True)
        product = await db.get(Product, (shop.id, product_id))
        if not product or product.data.get('deleted'):
            raise HTTPException(404, 'Producto no encontrado.')
        data = {k:v for k,v in product.data.items() if k not in {'photoUrl', 'thumbnailUrl', 'image'}}
        changed = await db.execute(update(Product).where(Product.shop_id == shop.id, Product.id == product_id, Product.version == body.expectedVersion).values(data=data, version=Product.version+1))
        if changed.rowcount != 1:
            raise HTTPException(409, 'El producto cambió. Recarga antes de retirar su foto.')
        audit(db, shop, product_id, 'photo_removed', {'version': body.expectedVersion+1})
        await db.commit()
        return {'data': data, 'version': body.expectedVersion+1}

    @app.post('/api/shops/{slug}/orders', status_code=201)
    async def create_order(slug: str, body: OrderInput, idempotency_key: str = Header(alias='Idempotency-Key'), db=Depends(session)):
        try:
            attempt = str(UUID(idempotency_key))
        except ValueError:
            raise HTTPException(422, 'Referencia de intento inválida.')
        fingerprint = request_hash(body)
        shop = await shop_by_slug(db, slug, lock=True)
        shop_id = shop.id  # Rollback expira las entidades ORM; conservar el identificador escalar.
        existing = await db.scalar(select(Order).where(Order.shop_id == shop_id, Order.idempotency_key == attempt))
        if existing:
            if existing.request_hash != fingerprint:
                raise HTTPException(409, 'Esta referencia ya corresponde a otro contenido. No se modificó el pedido original.')
            return receipt(existing, True)
        config = BusinessConfig.model_validate(shop.config)
        if not config.acceptingOrders:
            raise HTTPException(409, {'code':'orders_paused','message':'El negocio no está recibiendo pedidos. Conserva tu carrito y consulta por WhatsApp.'})
        ids = sorted({line.productId for line in body.items} | {line.halfId for line in body.items if line.halfId})
        products = (await db.scalars(select(Product).where(Product.shop_id == shop.id, Product.id.in_(ids)).order_by(Product.id).with_for_update())).all()
        lines, total = quote(body.items, {p.id: {**p.data,'version':p.version} for p in products}, shop.extras)
        if total != body.expectedTotal:
            raise HTTPException(409, {'code': 'price_changed', 'message': 'El total cambió. Revisa el menú antes de transferir.', 'total': total})
        order_id = str(uuid4())
        order = Order(id=order_id, folio='PZ-'+order_id.replace('-', '').upper(), shop_id=shop.id, idempotency_key=attempt, request_hash=fingerprint, snapshot={'business': {'name': config.name, 'whatsapp': config.whatsapp, 'address': config.address, 'hours': config.hours, 'bankDestination': config.bankDestination.model_dump(), 'testMode': config.testMode}, 'customer': body.customer.model_dump(), 'items': lines, 'payFull': body.payFull}, total=total, minimum_deposit=(total+1)//2, paid=0, status='pending_validation', pickup_confirmed='', version=1)
        db.add(order)
        audit(db, shop, order_id, 'order_registered', {'total': total})
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            existing = await db.scalar(select(Order).where(Order.shop_id == shop_id, Order.idempotency_key == attempt))
            if not existing:
                raise HTTPException(409, 'No se pudo asignar el folio. Reintenta con la misma referencia.')
            if existing.request_hash != fingerprint:
                raise HTTPException(409, 'La referencia ya se utilizó para otro contenido.')
            return receipt(existing, True)
        return receipt(order, True)

    @app.get('/api/orders/{order_id}')
    async def customer_order(order_id: str, authorization: str | None = Header(default=None), db=Depends(session)):
        token = authorization[7:] if authorization and authorization.startswith('Bearer ') else ''
        if not token or not hmac.compare_digest(token, access_token(secret, order_id)):
            raise HTTPException(404, 'Pedido no encontrado.')
        order = await db.get(Order, order_id)
        if not order:
            raise HTTPException(404, 'Pedido no encontrado.')
        return receipt(order)

    @app.get('/api/admin/{slug}/orders')
    async def admin_orders(slug: str, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization)
        orders = (await db.scalars(select(Order).where(Order.shop_id == shop.id).order_by(Order.created_at.desc(), Order.id).limit(100))).all()
        return [receipt(order) for order in orders]

    @app.get('/api/admin/{slug}/stats')
    async def admin_stats(slug: str, authorization: str | None = Header(default=None), db=Depends(session)):
        shop=await authorized(db,slug,authorization)
        orders=(await db.scalars(select(Order).where(Order.shop_id==shop.id))).all()
        real=[o for o in orders if not o.snapshot['business'].get('testMode',False)]
        confirmed=[o for o in real if o.status!='pending_validation']
        products=Counter()
        for order in confirmed:
            for line in order.snapshot['items']:
                products[line['title']]+=line['quantity']
        return {'registered':len(real),'pending':sum(o.status=='pending_validation' for o in real),'confirmed':len(confirmed),'receivedCents':sum(o.paid for o in confirmed),'outstandingCents':sum(o.total-o.paid for o in confirmed),'completedTotalCents':sum(o.total for o in real if o.status=='completed'),'topProducts':[{'name':name,'quantity':quantity} for name,quantity in products.most_common(5)],'excludesTests':True}

    @app.post('/api/admin/{slug}/orders/{order_id}/confirm')
    async def confirm_order(slug: str, order_id: str, body: ConfirmInput, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization)
        order = await db.scalar(select(Order).where(Order.id == order_id, Order.shop_id == shop.id))
        if not order:
            raise HTTPException(404, 'Pedido no encontrado.')
        if order.status != 'pending_validation':
            raise HTTPException(409, 'El pedido ya fue atendido. Recarga su estado.')
        if not body.customerAgreed:
            raise HTTPException(422, 'Confirma que acordaste el tiempo de recolección con el cliente.')
        if not order.minimum_deposit <= body.receivedCents <= order.total:
            raise HTTPException(422, 'El abono debe cubrir al menos el 50% y no superar el total.')
        changed = await db.execute(update(Order).where(Order.id == order.id, Order.shop_id == shop.id, Order.version == body.expectedVersion, Order.status == 'pending_validation').values(paid=body.receivedCents, pickup_confirmed=body.pickupConfirmed.strip(), status='confirmed', version=Order.version+1))
        if changed.rowcount != 1:
            raise HTTPException(409, 'El pedido cambió en otra pestaña. Recarga y revisa.')
        audit(db, shop, order.id, 'payment_confirmed', {'receivedCents': body.receivedCents, 'version': body.expectedVersion+1})
        await db.commit()
        await db.refresh(order)
        return receipt(order)

    @app.post('/api/admin/{slug}/orders/{order_id}/status')
    async def change_status(slug: str, order_id: str, body: StatusInput, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization)
        order = await db.scalar(select(Order).where(Order.id == order_id, Order.shop_id == shop.id))
        if not order:
            raise HTTPException(404, 'Pedido no encontrado.')
        previous = {'preparing': 'confirmed', 'ready': 'preparing', 'completed': 'ready'}[body.status]
        if body.status == 'completed' and order.paid < order.total:
            raise HTTPException(422, 'Registra primero la liquidación del saldo antes de entregar.')
        result = await db.execute(update(Order).where(Order.id == order.id, Order.shop_id == shop.id, Order.status == previous, Order.version == body.expectedVersion).values(status=body.status, version=Order.version+1))
        if result.rowcount != 1:
            raise HTTPException(409, 'Transición inválida o pedido actualizado. Recarga su estado.')
        audit(db, shop, order.id, 'status_changed', {'status': body.status, 'version': body.expectedVersion+1})
        await db.commit()
        await db.refresh(order)
        return receipt(order)

    @app.post('/api/admin/{slug}/orders/{order_id}/settle')
    async def settle_order(slug: str, order_id: str, body: SettleInput, authorization: str | None = Header(default=None), db=Depends(session)):
        shop = await authorized(db, slug, authorization)
        order = await db.scalar(select(Order).where(Order.id == order_id, Order.shop_id == shop.id))
        if not order:
            raise HTTPException(404, 'Pedido no encontrado.')
        balance = order.total-order.paid
        if balance <= 0:
            raise HTTPException(409, 'El saldo ya fue liquidado. Recarga el pedido.')
        if order.status not in {'confirmed','preparing','ready'} or body.receivedCents != balance:
            raise HTTPException(422, 'Registra exactamente el saldo pendiente de un pedido confirmado.')
        changed = await db.execute(update(Order).where(Order.id == order.id, Order.shop_id == shop.id, Order.version == body.expectedVersion, Order.paid == order.paid, Order.status.in_(['confirmed','preparing','ready'])).values(paid=Order.total, version=Order.version+1))
        if changed.rowcount != 1:
            raise HTTPException(409, 'El pedido o su saldo cambió. Recarga antes de cobrar nuevamente.')
        audit(db, shop, order.id, 'balance_settled', {'receivedCents': body.receivedCents, 'method': body.method, 'version': body.expectedVersion+1})
        await db.commit()
        await db.refresh(order)
        return receipt(order)

    return app


app = create_app()

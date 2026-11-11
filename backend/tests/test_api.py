import asyncio
import copy
import io
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

import httpx
from PIL import Image
from sqlalchemy import select

from app.api import create_app
from app.domain import digest
from app.models import AuditEvent, Order, Shop


class ApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='pizzetas-test-')
        db_url = 'sqlite+aiosqlite:///' + (Path(self.tmp.name) / 'test.db').as_posix()
        self.token = 'local-test-token-' + 'x' * 40
        self.app = create_app(database_url=db_url, secret='local-test-secret-'+'s'*40, admin_token=self.token, media_root=Path(self.tmp.name)/'media')
        self.lifespan = self.app.router.lifespan_context(self.app)
        await self.lifespan.__aenter__()
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app), base_url='http://testserver')
        self.auth = {'Authorization': 'Bearer ' + self.token}
        response = await self.client.get('/api/admin/pizzetas/config', headers=self.auth)
        self.base = response.json()
        config = {**self.base['config'], 'whatsapp': '527770000000', 'address': 'Domicilio de prueba', 'hours': 'Horario de prueba', 'bankDestination': {'bank': 'Banco de prueba', 'holder': 'Titular de prueba', 'type': 'clabe', 'number': '0'*18}, 'acceptingOrders': True}
        response = await self.client.put('/api/admin/pizzetas/config', headers=self.auth, json={'expectedVersion': 1, 'config': config, 'bankChangeAcknowledged': True})
        self.assertEqual(response.status_code, 200, response.text)
        self.config = response.json()
        self.payload = {'customer': {'name': 'Cliente de prueba', 'phone': '7770000000', 'pickup': 'asap'}, 'items': [{'productId': 'peperoni', 'productVersion': 1, 'variantIndex': 0, 'quantity': 1, 'halfId': '', 'extras': [], 'selections': {}, 'notes': ''}], 'expectedTotal': 15000, 'payFull': False}

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.lifespan.__aexit__(None, None, None)
        self.tmp.cleanup()

    async def create(self, key=None, payload=None):
        return await self.client.post('/api/shops/pizzetas/orders', headers={'Idempotency-Key': key or str(uuid4())}, json=payload or self.payload)

    async def test_public_menu_has_bank_details_but_no_admin_secret(self):
        r = await self.client.get('/api/shops/pizzetas/menu')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()['products']), 119)
        self.assertNotIn(self.token, r.text)
        self.assertNotIn('admin_hash', r.text)

    async def test_config_requires_authorization(self):
        self.assertEqual((await self.client.get('/api/admin/pizzetas/config')).status_code, 401)
        r = await self.client.put('/api/admin/pizzetas/config', json={'expectedVersion': 2, 'config': self.config['config']})
        self.assertEqual(r.status_code, 401)

    async def test_bank_requires_acknowledgment_and_rejects_cvv(self):
        config = copy.deepcopy(self.config['config'])
        config['bankDestination']['number'] = '1'*18
        r = await self.client.put('/api/admin/pizzetas/config', headers=self.auth, json={'expectedVersion': 2, 'config': config})
        self.assertEqual(r.status_code, 422)
        config['bankDestination']['cvv'] = '123'
        r = await self.client.put('/api/admin/pizzetas/config', headers=self.auth, json={'expectedVersion': 2, 'config': config, 'bankChangeAcknowledged': True})
        self.assertEqual(r.status_code, 422)

    async def test_card_and_account_are_supported_as_receiving_destinations(self):
        version = 2
        for kind, number in [('card', '0'*16), ('account', '1'*10), ('clabe', '2'*18)]:
            config = copy.deepcopy(self.config['config'])
            config['bankDestination'].update(type=kind, number=number)
            r = await self.client.put('/api/admin/pizzetas/config', headers=self.auth, json={'expectedVersion': version, 'config': config, 'bankChangeAcknowledged': True})
            self.assertEqual(r.status_code, 200, r.text)
            version += 1

    async def test_wrong_number_format_is_rejected(self):
        config = copy.deepcopy(self.config['config'])
        config['bankDestination']['number'] = '123'
        r = await self.client.put('/api/admin/pizzetas/config', headers=self.auth, json={'expectedVersion': 2, 'config': config, 'bankChangeAcknowledged': True})
        self.assertEqual(r.status_code, 422)

    async def test_invalid_bank_text_does_not_raise_internal_error(self):
        for bad in [123, '  ']:
            config = copy.deepcopy(self.config['config'])
            config['bankDestination']['bank'] = bad
            r = await self.client.put('/api/admin/pizzetas/config', headers=self.auth, json={'expectedVersion': 2, 'config': config, 'bankChangeAcknowledged': True})
            self.assertEqual(r.status_code, 422)

    async def test_two_tabs_cannot_silently_overwrite_config(self):
        payload = {'expectedVersion': 2, 'config': self.config['config']}
        results = await asyncio.gather(*[self.client.put('/api/admin/pizzetas/config', headers=self.auth, json=payload) for _ in range(2)])
        self.assertEqual(sorted(r.status_code for r in results), [200, 409])

    async def test_bank_change_does_not_change_registered_order(self):
        original = (await self.create()).json()
        config = copy.deepcopy(self.config['config'])
        config['bankDestination']['number'] = '3'*18
        await self.client.put('/api/admin/pizzetas/config', headers=self.auth, json={'expectedVersion': 2, 'config': config, 'bankChangeAcknowledged': True})
        r = await self.client.get('/api/orders/'+original['id'], headers={'Authorization': 'Bearer '+original['accessToken']})
        self.assertEqual(r.json()['snapshot']['business']['bankDestination']['number'], '0'*18)

    async def test_distinct_concurrent_customers_receive_distinct_folios(self):
        requests = []
        for i in range(12):
            payload = copy.deepcopy(self.payload)
            payload['customer']['name'] = f'Cliente de prueba {i}'
            requests.append(self.create(payload=payload))
        responses = await asyncio.gather(*requests)
        self.assertEqual([r.status_code for r in responses], [201]*12)
        self.assertEqual(len({r.json()['folio'] for r in responses}), 12)
        self.assertEqual(len({r.json()['snapshot']['customer']['name'] for r in responses}), 12)

    async def test_concurrent_retries_create_one_order_and_one_audit_event(self):
        key = str(uuid4())
        responses = await asyncio.gather(*[self.create(key=key) for _ in range(12)])
        self.assertEqual([r.status_code for r in responses], [201]*12)
        self.assertEqual(len({r.json()['id'] for r in responses}), 1)
        self.assertEqual(len({r.json()['accessToken'] for r in responses}), 1)
        async with self.app.state.sessions() as db:
            self.assertEqual(len((await db.scalars(select(Order))).all()), 1)
            self.assertEqual(len((await db.scalars(select(AuditEvent).where(AuditEvent.kind == 'order_registered'))).all()), 1)

    async def test_same_key_with_different_contents_is_conflict(self):
        key = str(uuid4())
        await self.create(key=key)
        modified = copy.deepcopy(self.payload)
        modified['items'][0]['quantity'] = 2
        modified['expectedTotal'] = 30000
        self.assertEqual((await self.create(key=key, payload=modified)).status_code, 409)

    async def test_retry_after_lost_response_recovers_original(self):
        key = str(uuid4())
        first = (await self.create(key=key)).json()  # El cliente pudo perder esta respuesta.
        second = (await self.create(key=key)).json()
        self.assertEqual(first['id'], second['id'])
        self.assertEqual(second['status'], 'pending_validation')
        self.assertEqual(second['paid'], 0)

    async def test_customer_cannot_read_another_order(self):
        a, b = (await self.create()).json(), (await self.create()).json()
        r = await self.client.get('/api/orders/'+b['id'], headers={'Authorization': 'Bearer '+a['accessToken']})
        self.assertEqual(r.status_code, 404)
        self.assertEqual((await self.client.get('/api/orders/'+a['id'])).status_code, 404)

    async def test_recalculates_prices_and_rejects_customer_price(self):
        payload = copy.deepcopy(self.payload)
        payload['expectedTotal'] = 1_000
        self.assertEqual((await self.create(payload=payload)).status_code, 409)
        payload['items'][0]['unit'] = 1
        self.assertEqual((await self.create(payload=payload)).status_code, 422)

    async def test_pizza_halves_extras_and_quantities_are_recalculated(self):
        payload = copy.deepcopy(self.payload)
        payload['items'][0].update(variantIndex=1, halfId='capricciosa', halfVersion=1, extras=['Tocino'], quantity=2)
        payload['expectedTotal'] = 70000
        r = await self.create(payload=payload)
        self.assertEqual(r.status_code, 201, r.text)
        self.assertEqual(r.json()['minimumDeposit'], 35000)

    async def test_paused_product_cannot_be_ordered(self):
        products = (await self.client.get('/api/admin/pizzetas/products', headers=self.auth)).json()
        product = next(p for p in products if p['data']['id'] == 'peperoni')
        data = product['data']
        update = {k:data[k] for k in ['name','description','variants']}
        update.update(expectedVersion=1, available=False)
        r = await self.client.put('/api/admin/pizzetas/products/peperoni', headers=self.auth, json=update)
        self.assertEqual(r.status_code, 200)
        self.assertEqual((await self.create()).status_code, 409)

    async def test_confirmation_requires_real_minimum_and_customer_agreement(self):
        order = (await self.create()).json()
        path = f'/api/admin/pizzetas/orders/{order["id"]}/confirm'
        body = {'expectedVersion': 1, 'receivedCents': 7499, 'pickupConfirmed': 'En 35 minutos', 'customerAgreed': True}
        self.assertEqual((await self.client.post(path, headers=self.auth, json=body)).status_code, 422)
        body.update(receivedCents=7500, customerAgreed=False)
        self.assertEqual((await self.client.post(path, headers=self.auth, json=body)).status_code, 422)

    async def test_two_confirmations_apply_payment_once(self):
        order = (await self.create()).json()
        path = f'/api/admin/pizzetas/orders/{order["id"]}/confirm'
        body = {'expectedVersion': 1, 'receivedCents': 7500, 'pickupConfirmed': 'En 35 minutos, acordado', 'customerAgreed': True}
        results = await asyncio.gather(*[self.client.post(path, headers=self.auth, json=body) for _ in range(2)])
        self.assertEqual(sorted(r.status_code for r in results), [200, 409])
        good = next(r for r in results if r.status_code == 200).json()
        self.assertEqual(good['paid'], 7500)
        self.assertEqual(good['balance'], 7500)
        self.assertIn('PEDIDO CONFIRMADO', good['confirmationMessage'])
        async with self.app.state.sessions() as db:
            events = (await db.scalars(select(AuditEvent).where(AuditEvent.kind == 'payment_confirmed'))).all()
            self.assertEqual(len(events), 1)

    async def test_initial_state_cannot_go_directly_to_kitchen(self):
        order = (await self.create()).json()
        path = f'/api/admin/pizzetas/orders/{order["id"]}/status'
        r = await self.client.post(path, headers=self.auth, json={'expectedVersion': 1, 'status': 'preparing'})
        self.assertEqual(r.status_code, 409)

    async def test_admin_key_is_scoped_to_business(self):
        async with self.app.state.sessions.begin() as db:
            db.add(Shop(id=str(uuid4()), slug='otro-negocio', config=self.config['config'], categories=[], extras=[], admin_hash=digest('another-secret-'+'z'*40), version=1))
        r = await self.client.get('/api/admin/otro-negocio/orders', headers=self.auth)
        self.assertEqual(r.status_code, 401)

    async def test_photo_is_optimized_and_visible_in_public_menu(self):
        photo = io.BytesIO()
        Image.new('RGB', (2200, 1000), 'red').save(photo, format='JPEG', exif=b'Exif\x00\x00')
        r = await self.client.post('/api/admin/pizzetas/products/peperoni/photo?expectedVersion=1', headers={**self.auth,'Content-Type':'image/jpeg'}, content=photo.getvalue())
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()['data']
        image_response = await self.client.get(data['photoUrl'])
        self.assertEqual(image_response.status_code, 200)
        with Image.open(io.BytesIO(image_response.content)) as decoded:
            self.assertEqual(decoded.format, 'WEBP')
            self.assertLessEqual(max(decoded.size), 1600)
            self.assertFalse(decoded.getexif())
        menu = (await self.client.get('/api/shops/pizzetas/menu')).json()
        self.assertEqual(next(p for p in menu['products'] if p['id']=='peperoni')['photoUrl'], data['photoUrl'])

    async def test_photo_rejects_svg_corruption_and_unauthorized_upload(self):
        path='/api/admin/pizzetas/products/peperoni/photo?expectedVersion=1'
        self.assertEqual((await self.client.post(path,content=b'fake')).status_code,401)
        for content in [b'<svg><script>alert(1)</script></svg>', b'broken image']:
            self.assertEqual((await self.client.post(path,headers=self.auth,content=content)).status_code,422)
        self.assertEqual(list(self.app.state.media_root.glob('*/*.webp')),[])

    async def test_photo_rejects_excessive_bytes(self):
        r = await self.client.post('/api/admin/pizzetas/products/peperoni/photo?expectedVersion=1',headers=self.auth,content=b'x'*(10*1024*1024+1))
        self.assertEqual(r.status_code,413)

    async def test_photo_conflict_preserves_previous_photo_and_can_remove_association(self):
        photo=io.BytesIO();Image.new('RGB',(100,100),'blue').save(photo,format='PNG')
        path='/api/admin/pizzetas/products/peperoni/photo'
        first=await self.client.post(path+'?expectedVersion=1',headers=self.auth,content=photo.getvalue())
        self.assertEqual(first.status_code,200)
        self.assertEqual((await self.client.post(path+'?expectedVersion=1',headers=self.auth,content=photo.getvalue())).status_code,409)
        self.assertEqual(len(list(self.app.state.media_root.glob('*/*.webp'))),2)
        r=await self.client.request('DELETE',path,headers=self.auth,json={'expectedVersion':2})
        self.assertEqual(r.status_code,200)
        self.assertNotIn('photoUrl',r.json()['data'])

    async def test_complete_order_cycle_and_settlement_once(self):
        order=(await self.create()).json();prefix=f'/api/admin/pizzetas/orders/{order["id"]}'
        confirmed=await self.client.post(prefix+'/confirm',headers=self.auth,json={'expectedVersion':1,'receivedCents':7500,'pickupConfirmed':'En 35 minutos, aceptado','customerAgreed':True})
        self.assertEqual(confirmed.status_code,200)
        for version,status in [(2,'preparing'),(3,'ready')]:
            self.assertEqual((await self.client.post(prefix+'/status',headers=self.auth,json={'expectedVersion':version,'status':status})).status_code,200)
        self.assertEqual((await self.client.post(prefix+'/status',headers=self.auth,json={'expectedVersion':4,'status':'completed'})).status_code,422)
        body={'expectedVersion':4,'receivedCents':7500,'method':'cash'}
        attempts=await asyncio.gather(*[self.client.post(prefix+'/settle',headers=self.auth,json=body) for _ in range(2)])
        self.assertEqual(sorted(r.status_code for r in attempts),[200,409])
        completed=await self.client.post(prefix+'/status',headers=self.auth,json={'expectedVersion':5,'status':'completed'})
        self.assertEqual(completed.status_code,200)
        self.assertEqual(completed.json()['balance'],0)
        async with self.app.state.sessions() as db:
            self.assertEqual(len((await db.scalars(select(AuditEvent).where(AuditEvent.kind=='balance_settled'))).all()),1)

    async def test_settlement_rejects_wrong_amount_and_unconfirmed_order(self):
        order=(await self.create()).json()
        r=await self.client.post(f'/api/admin/pizzetas/orders/{order["id"]}/settle',headers=self.auth,json={'expectedVersion':1,'receivedCents':15000,'method':'card'})
        self.assertEqual(r.status_code,422)

    async def test_product_version_change_rejects_same_price_stale_selection(self):
        rows=(await self.client.get('/api/admin/pizzetas/products',headers=self.auth)).json()
        data=next(p['data'] for p in rows if p['data']['id']=='peperoni')
        r=await self.client.put('/api/admin/pizzetas/products/peperoni',headers=self.auth,json={'expectedVersion':1,'name':'Peperoni actualizado','description':data['description'],'available':True,'variants':data['variants']})
        self.assertEqual(r.status_code,200)
        r=await self.create()
        self.assertEqual(r.status_code,409)
        self.assertEqual(r.json()['detail']['code'],'catalog_changed')

    async def test_create_product_and_category_remove_preserves_old_order(self):
        categories=(await self.client.get('/api/admin/pizzetas/categories',headers=self.auth)).json()
        c=await self.client.post('/api/admin/pizzetas/categories',headers=self.auth,json={'expectedVersion':categories['version'],'name':'Especiales de prueba','subtitle':'Temporal','icon':'sparkles'})
        self.assertEqual(c.status_code,201,c.text)
        category=c.json()['categories'][-1]
        product=await self.client.post('/api/admin/pizzetas/products',headers=self.auth,json={'expectedCatalogVersion':c.json()['version'],'category':category['id'],'name':'Producto de prueba','description':'Prueba','available':True,'variants':[{'name':'Regular','price':10000}]})
        self.assertEqual(product.status_code,201,product.text)
        p=product.json()
        payload=copy.deepcopy(self.payload);payload['items'][0].update(productId=p['data']['id'],productVersion=1);payload['expectedTotal']=10000
        order=(await self.create(payload=payload)).json()
        r=await self.client.request('DELETE',f'/api/admin/pizzetas/categories/{category["id"]}',headers=self.auth,json={'expectedVersion':p['catalogVersion']})
        self.assertEqual(r.status_code,409)
        removed=await self.client.request('DELETE',f'/api/admin/pizzetas/products/{p["data"]["id"]}',headers=self.auth,json={'expectedVersion':1})
        self.assertEqual(removed.status_code,200)
        r=await self.client.request('DELETE',f'/api/admin/pizzetas/categories/{category["id"]}',headers=self.auth,json={'expectedVersion':p['catalogVersion']})
        self.assertEqual(r.status_code,200)
        historical=await self.client.get('/api/orders/'+order['id'],headers={'Authorization':'Bearer '+order['accessToken']})
        self.assertEqual(historical.json()['snapshot']['items'][0]['title'],'Producto de prueba')
        self.assertEqual(historical.json()['total'],10000)

    async def test_category_edit_has_version_and_preserves_identifier(self):
        meta=(await self.client.get('/api/admin/pizzetas/categories',headers=self.auth)).json()
        body={'expectedVersion':meta['version'],'name':'Nuestras pizzas','subtitle':'Dos mitades','icon':'pizza'}
        r=await self.client.put('/api/admin/pizzetas/categories/pizzas',headers=self.auth,json=body)
        self.assertEqual(r.status_code,200)
        self.assertEqual(r.json()['categories'][0]['id'],'pizzas')
        self.assertEqual((await self.client.put('/api/admin/pizzetas/categories/pizzas',headers=self.auth,json=body)).status_code,409)

    async def test_test_mode_stays_on_order_after_business_changes(self):
        order=(await self.create()).json()
        self.assertTrue(order['snapshot']['business']['testMode'])
        self.assertIn('PRUEBA LOCAL',order['message'])

    async def test_metrics_exclude_simulations_and_pending_amounts(self):
        await self.create()
        stats=(await self.client.get('/api/admin/pizzetas/stats',headers=self.auth)).json()
        self.assertEqual(stats['registered'],0)
        config=copy.deepcopy(self.config['config']);config['testMode']=False
        changed=await self.client.put('/api/admin/pizzetas/config',headers=self.auth,json={'expectedVersion':2,'config':config})
        self.assertEqual(changed.status_code,200)
        order=(await self.create()).json()
        stats=(await self.client.get('/api/admin/pizzetas/stats',headers=self.auth)).json()
        self.assertEqual(stats['registered'],1);self.assertEqual(stats['receivedCents'],0)
        await self.client.post(f'/api/admin/pizzetas/orders/{order["id"]}/confirm',headers=self.auth,json={'expectedVersion':1,'receivedCents':7500,'pickupConfirmed':'En 35 minutos','customerAgreed':True})
        stats=(await self.client.get('/api/admin/pizzetas/stats',headers=self.auth)).json()
        self.assertEqual(stats['receivedCents'],7500);self.assertEqual(stats['outstandingCents'],7500);self.assertEqual(stats['completedTotalCents'],0)
        self.assertEqual(stats['topProducts'][0]['name'],'Peperoni')


    async def test_photo_origin_is_public_and_resets_on_manual_replacement(self):
        image = io.BytesIO()
        Image.new('RGB', (120, 120), (180, 90, 50)).save(image, format='PNG')
        path = '/api/admin/pizzetas/products/peperoni/photo'
        headers = {**self.auth, 'Content-Type': 'image/png'}
        response = await self.client.post(path+'?expectedVersion=1&kind=illustrative', headers=headers, content=image.getvalue())
        self.assertEqual(response.status_code, 200, response.text)
        menu = (await self.client.get('/api/shops/pizzetas/menu')).json()
        self.assertEqual(next(p for p in menu['products'] if p['id']=='peperoni')['photoKind'], 'illustrative')
        invalid = await self.client.post(path+'?expectedVersion=2&kind=unknown', headers=headers, content=image.getvalue())
        self.assertEqual(invalid.status_code, 422)
        replaced = await self.client.post(path+'?expectedVersion=2', headers=headers, content=image.getvalue())
        self.assertEqual(replaced.status_code, 200, replaced.text)
        self.assertEqual(replaced.json()['data']['photoKind'], 'uploaded')


if __name__ == '__main__':
    unittest.main()

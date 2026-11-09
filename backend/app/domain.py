import hashlib
import hmac
import json
import re
from fastapi import HTTPException


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def access_token(secret, order_id):
    return hmac.new(secret.encode(), f'order:{order_id}'.encode(), hashlib.sha256).hexdigest()


def request_hash(payload):
    return digest(json.dumps(payload.model_dump(), sort_keys=True, ensure_ascii=False, separators=(',', ':')))


def quote(items, products, allowed_extras):
    lines = []
    for item in items:
        p = products.get(item.productId)
        if not p or not p.get('available'):
            raise HTTPException(409, {'code':'product_unavailable','message':'Un producto dejó de estar disponible. Revisa el menú.'})
        if item.productVersion != p.get('version'):
            raise HTTPException(409, {'code':'catalog_changed','message':'El producto se actualizó. Revisa presentación, opciones y precio.'})
        if item.variantIndex >= len(p['variants']):
            raise HTTPException(409, {'code':'catalog_changed','message':'La presentación cambió. Revisa el producto.'})
        variant = p['variants'][item.variantIndex]
        title, unit = p['name'], variant['price']
        if item.halfId:
            half = products.get(item.halfId)
            if p['category'] != 'pizzas' or not half or not half.get('available') or half['category'] != 'pizzas' or item.variantIndex >= len(half['variants']):
                raise HTTPException(409, {'code':'catalog_changed','message':'Revisa las especialidades de las dos mitades.'})
            if item.halfVersion != half.get('version'):
                raise HTTPException(409, {'code':'catalog_changed','message':'La segunda mitad se actualizó. Revisa la especialidad antes de pedir.'})
            unit = max(unit, half['variants'][item.variantIndex]['price'])
            title += ' / ' + half['name']
        if len(set(item.extras)) != len(item.extras) or any(extra not in allowed_extras for extra in item.extras) or (item.extras and p['category'] != 'pizzas'):
            raise HTTPException(422, 'Ingredientes extra inválidos.')
        unit += len(item.extras) * 3000
        choices = {c['label']: c['values'] for c in p.get('choices', [])}
        if set(item.selections) != set(choices) or any(item.selections[label] not in values for label, values in choices.items()):
            raise HTTPException(422, 'Revisa las opciones del producto.')
        details = ([variant['name']] if variant['name'] != 'Regular' else [])
        details += [f'{label}: {item.selections[label]}' for label in choices]
        if item.extras:
            details.append('Extras en toda la pizza: ' + ', '.join(item.extras))
        if item.notes.strip():
            details.append('Nota: ' + item.notes.strip())
        lines.append({'productId': p['id'], 'title': title, 'details': details, 'quantity': item.quantity, 'unit': unit, 'total': unit * item.quantity})
    return lines, sum(line['total'] for line in lines)


def money(cents):
    return f'${cents / 100:,.2f} MXN'


def safe(value):
    return re.sub(r'[\r\n*_~`]', ' ', str(value)).strip()


def order_message(order, confirmed=False):
    s = order.snapshot
    rows = ['🍕 *PEDIDO CONFIRMADO*' if confirmed else '🍕 *PEDIDO PARA RECOGER*', safe(s['business']['name']), f'*Folio:* {order.folio}', f'*Cliente:* {safe(s["customer"]["name"])}']
    if confirmed:
        rows += [f'*Recolección acordada:* {safe(order.pickup_confirmed)}']
    else:
        pickup = s['customer']['pickup']
        rows += [f'*Teléfono:* {s["customer"]["phone"]}', '*Recolección solicitada:* ' + ('Lo antes posible; tiempo por confirmar' if pickup == 'asap' else pickup)]
    if s['business'].get('testMode'):
        rows.insert(0, '🧪 PRUEBA LOCAL — NO REALIZAR PAGOS NI ENVIAR COMPROBANTES REALES')
    rows += ['*Detalle:*']
    for line in s['items']:
        rows.append(f'• {line["quantity"]}x {safe(line["title"])} — {money(line["total"])}')
        rows += ['  ' + safe(d) for d in line['details']]
    rows += [f'*Total:* {money(order.total)}']
    if confirmed:
        rows += [f'*Abono validado:* {money(order.paid)}', f'*Saldo al recoger:* {money(order.total-order.paid)}']
    else:
        amount = order.total if s['payFull'] else order.minimum_deposit
        rows += [f'*Transferencia prevista:* {money(amount)}', '*Estado:* Pendiente de comprobante y validación humana.', 'Adjunta tu comprobante. Prepararemos cuando el encargado valide al menos el 50% y acuerde contigo la recolección.']
    return '\n'.join(rows)

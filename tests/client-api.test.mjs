import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderClient, orderPayload, registeredText } from '../src/client-api.mjs';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
const payload={customer:{name:'Cliente de prueba',phone:'7770000000',pickup:'asap'},items:[{productId:'peperoni',variantIndex:0,quantity:1,halfId:'',extras:[],selections:{},notes:''}],payFull:false,expectedTotal:15000};
const receipt={id:'order-1',accessToken:'private-test-token',snapshot:{items:[]},status:'pending_validation',message:'Pendiente'};
const response=(body,status=201)=>({ok:status<400,status,json:async()=>body});
test('tras perder una respuesta y recargar reintenta con la misma referencia',async()=>{
  const session=storage(),keys=[];
  const first=createOrderClient({storage:session,uuid:()=> 'same-key',fetcher:async(p,o)=>{keys.push(o.headers['Idempotency-Key']);throw new Error('connection lost');}});
  await assert.rejects(first.submit(payload));
  const resumed=createOrderClient({storage:session,uuid:()=> 'another-key',fetcher:async(p,o)=>{keys.push(o.headers['Idempotency-Key']);return response(receipt);}});
  const result=await resumed.submit(payload);
  assert.equal(result.id,receipt.id);assert.deepEqual(keys,['same-key','same-key']);
});
test('no cambia el contenido de un intento cuyo resultado se desconoce',async()=>{
  const client=createOrderClient({storage:storage(),fetcher:async()=>{throw new Error('offline');}});
  await assert.rejects(client.submit(payload));
  await assert.rejects(client.submit({...payload,expectedTotal:20000}),/otro|otros/);
  assert.throws(()=>client.startNew(),/recupera/);
});
test('no envía si no puede guardar antes la referencia de reintento',async()=>{
  let requests=0;
  const client=createOrderClient({storage:{getItem:()=>null,setItem:()=>{throw new Error('blocked');}},fetcher:async()=>{requests++;return response(receipt);}});
  await assert.rejects(client.submit(payload),/No se envió/);assert.equal(requests,0);
});
test('precios cambiados permiten revisar el carrito y crear otro intento válido',async()=>{
  let calls=0;
  const client=createOrderClient({storage:storage(),fetcher:async()=>++calls===1?response({detail:{code:'price_changed',message:'Precio cambiado'}},409):response(receipt)});
  await assert.rejects(client.submit(payload));
  assert.equal((await client.submit({...payload,expectedTotal:20000})).id,receipt.id);
});
test('el payload no envía precios por línea, firmas ni claves locales de carrito',()=>{
  const body=orderPayload([{...payload.items[0],key:'private',signature:'sig',unit:1,total:1}],payload.customer,false,15000);
  assert.equal(body.items[0].unit,undefined);assert.equal(body.items[0].key,undefined);assert.equal(body.expectedTotal,15000);
});
test('una copia de registro pendiente no anuncia un pago confirmado',()=>assert.match(registeredText(receipt),/PENDIENTE DE VALIDACIÓN/));

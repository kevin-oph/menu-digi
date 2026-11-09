import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, loadDraft, saveDraft, validDraft, downloadText, draftKey, draftLifetime } from '../src/draft.mjs';

const customer = {name:'Cliente de prueba',phone:'7770000000',pickup:'19:30'};
const lines = [{productId:'peperoni',variantIndex:0,quantity:2,extras:[],selections:{}}];
const memory = () => {const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};

test('el resumen separa el anticipo solicitado de un pago confirmado',()=>{
  const d=createDraft(lines,customer,false);
  assert.equal(d.total,30000);assert.equal(d.deposit,15000);assert.equal(d.balance,15000);
  assert.match(downloadText(d),/NO ES CONFIRMACIÓN/);
  assert.match(d.message,/Pendiente de comprobante/);
  assert.equal(d.paymentConfirmed,undefined);
});
test('dos compradores generan referencias locales diferentes sin compartir datos',()=>{
  const a=createDraft(lines,customer,false),b=createDraft(lines,{...customer,name:'Otro cliente'},false);
  assert.notEqual(a.id,b.id);assert.notEqual(a.customer.name,b.customer.name);
});
test('finalizar dos veces el mismo resumen reutiliza su referencia',()=>{
  const a=createDraft(lines,customer,false);
  assert.equal(createDraft(lines,customer,false,a).id,a.id);
  assert.notEqual(createDraft([{...lines[0],quantity:3}],customer,false,a).id,a.id);
});
test('el resumen es una instantánea que no cambia al editar el carrito',()=>{
  const copy=structuredClone(lines),d=createDraft(copy,customer,false);
  copy[0].quantity=5;
  assert.equal(d.items[0].quantity,2);assert.equal(d.total,30000);
});
test('recupera el resumen de la sesión y descarta los datos vencidos',()=>{
  const storage=memory(),now=Date.now(),d=createDraft(lines,customer,false,null,'test',now);
  assert.equal(saveDraft(storage,d),true);assert.deepEqual(loadDraft(storage,now),d);
  assert.equal(loadDraft(storage,now+draftLifetime+1),null);
});
test('almacenamiento corrupto, no disponible o lleno no rompe el flujo',()=>{
  const storage=memory();storage.setItem(draftKey,'mal JSON');assert.equal(loadDraft(storage),null);
  assert.equal(loadDraft(null),null);assert.equal(saveDraft(null,createDraft(lines,customer,false)),false);
  assert.equal(saveDraft({setItem:()=>{throw new Error('quota');}},createDraft(lines,customer,false)),false);
});
test('no recupera un resumen con totales manipulados o cantidades inválidas',()=>{
  const d=createDraft(lines,customer,false);
  for(const patch of [{total:1},{deposit:0},{balance:0},{items:[{...d.items[0],quantity:0}]}]) assert.equal(validDraft({...d,...patch}),false);
});
test('no finaliza carritos vacíos ni datos inválidos',()=>{
  assert.throws(()=>createDraft([],customer,false));
  assert.throws(()=>createDraft(lines,{...customer,pickup:''},false));
});
test('lo antes posible se conserva como solicitud sin prometer una hora',()=>{
  const d=createDraft(lines,{...customer,pickup:'asap'},false);
  assert.equal(validDraft(d),true);
  assert.match(d.message,/Lo antes posible · tiempo por confirmar/);
  assert.match(d.message,/horario de recolección está sujeto a confirmación/);
});

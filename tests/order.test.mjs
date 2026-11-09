import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../src/catalog.mjs';
import { quoteLine, summarize, minimumDeposit, whatsappMessage, normalize, inspectCart } from '../src/order.mjs';

const line = extra => ({ productId:'peperoni',variantIndex:0,quantity:1,extras:[],selections:{},...extra });
test('el catálogo conserva identificadores únicos y precios monetarios exactos',()=>{
  assert.equal(new Set(catalog.map(p=>p.id)).size,catalog.length);
  assert.equal(catalog.filter(p=>p.category==='pizzas').length,15);
  assert.ok(catalog.some(p=>p.category==='bar'));
  for(const product of catalog) for(const v of product.variants) assert.ok(Number.isSafeInteger(v.price)&&v.price>0);
});
test('dos mitades usan el precio mayor del tamaño, sin promediar y sin depender del orden',()=>{
  const quote=quoteLine(line({halfId:'capricciosa',variantIndex:1}));
  assert.equal(quote.unit,32000);
  assert.equal(quoteLine(line({productId:'capricciosa',halfId:'peperoni',variantIndex:1})).unit,32000);
  assert.equal(quoteLine(line({halfId:'boneless-pizza'})).unit,18500);
});
test('extras de toda la pizza suman $30 cada uno y se multiplican con la cantidad',()=>{
  assert.equal(quoteLine(line({halfId:'capricciosa',extras:['Piña','Tocino'],quantity:2})).total,51000);
});
test('el anticipo incluye pizza, postre y alcohol y distingue saldo de pago completo',()=>{
  const lines=[line(),line({productId:'elote'}),line({productId:'modelo'})];
  assert.deepEqual([summarize(lines).total,summarize(lines).deposit,summarize(lines).balance],[28000,14000,14000]);
  assert.equal(summarize(lines,true).balance,0);
  assert.equal(summarize(lines,true).deposit,28000);
  assert.equal(minimumDeposit(14901),7451);
});
test('rechaza cantidades, variantes, extras y mitades inválidos',()=>{
  for(const bad of [{quantity:0},{quantity:31},{quantity:1.5},{variantIndex:3},{extras:['Inventado']},{extras:['Piña','Piña']},{halfId:'elote'},{productId:'elote',extras:['Piña']}]) assert.throws(()=>quoteLine(line(bad)));
});
test('no acepta precios proporcionados por el carrito como fuente de cálculo',()=>{
  assert.equal(quoteLine(line({unit:1,total:1})).total,15000);
});
test('opciones obligatorias como salsa se validan',()=>{
  assert.throws(()=>quoteLine(line({productId:'alitas'})));
  assert.equal(quoteLine(line({productId:'alitas',selections:{Salsa:'BBQ'}})).total,16000);
  assert.throws(()=>quoteLine(line({productId:'alitas',selections:{Salsa:'Inexistente'}})));
});
test('WhatsApp explica anticipo, saldo y validación sin marcar pago recibido',()=>{
  const msg=whatsappMessage([line()],{name:'Ana\n*Pagado*',phone:'7771234567',pickup:'19:00'});
  assert.match(msg,/Total:\* \$150 MXN/);
  assert.match(msg,/\$75 \(anticipo mínimo 50%\)/);
  assert.match(msg,/Pendiente de comprobante y validación humana/);
  assert.match(msg,/efectivo, transferencia o tarjeta/);
  assert.ok(!msg.includes('\n*Pagado*'));
});
test('la búsqueda ignora acentos y mayúsculas',()=>assert.equal(normalize('CAPRICCIOSA y Limón'),'capricciosa y limon'));
test('un producto agotado o actualizado permanece en el carrito para revisar',()=>{
  const p=catalog.find(x=>x.id==='peperoni');const previous={available:p.available,version:p.version};
  try{
    p.available=false;let result=inspectCart([line()]);assert.equal(result.valid,false);assert.equal(result.items.length,1);assert.equal(result.total,null);
    p.available=true;p.version=2;result=inspectCart([line({productVersion:1})]);assert.equal(result.valid,false);assert.match(result.items[0].details[0],/actualizó/);
  }finally{p.available=previous.available;if(previous.version===undefined)delete p.version;else p.version=previous.version;}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { copyText } from '../src/clipboard.mjs';

test('copia el mensaje completo y confirma éxito solo cuando el navegador responde',async()=>{
  const message='Pedido de prueba\nTotal: $450\nAnticipo: $225';
  let stored;
  assert.equal(await copyText(message,{writeText:async text=>{stored=text;}}),true);
  assert.equal(stored,message);
});
test('ofrece copia manual si no existe la API del portapapeles',async()=>{
  assert.equal(await copyText('Pedido',null),false);
});
test('ofrece copia manual si el navegador rechaza el permiso',async()=>{
  assert.equal(await copyText('Pedido',{writeText:async()=>{throw new Error('NotAllowedError');}}),false);
});
test('ofrece copia manual si la llamada falla sincrónicamente',async()=>{
  assert.equal(await copyText('Pedido',{writeText:()=>{throw new Error('No disponible');}}),false);
});
test('no deja el botón bloqueado si el portapapeles nunca responde',async()=>{
  assert.equal(await copyText('Pedido',{writeText:()=>new Promise(()=>{})},20),false);
});

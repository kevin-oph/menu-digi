import { business, catalog, categories, pizzaExtras } from './catalog.mjs';
import { publicDemo, assetUrl } from './environment.mjs';

export const shopSlug = () => {
  const match = globalThis.location?.pathname.match(/^\/b\/([a-z0-9-]{1,80})(?:\/|$)/);
  return match ? match[1] : 'pizzetas';
};
export const bankLabel = type => ({clabe:'CLABE',account:'Cuenta',card:'Tarjeta para recibir'})[type] || 'Cuenta';
export const productPhoto = p => p.thumbnailUrl || p.photoUrl || (p.image ? assetUrl(`images/${p.image}.webp`) : '');

export class ApiError extends Error {
  constructor(message,status=0,detail=null){super(message);this.status=status;this.detail=detail;}
}
export async function apiJSON(path,options={},fetcher=globalThis.fetch){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetcher(path,{...options,headers:{'Content-Type':'application/json',...options.headers},signal:controller.signal});
    const data=await response.json().catch(()=>null);
    if(!response.ok){const detail=data?.detail;throw new ApiError(typeof detail==='string'?detail:detail?.message||'No se pudo completar la operación. Revisa los datos e intenta otra vez.',response.status,detail);}
    if(!data)throw new ApiError('El servidor no devolvió un resultado válido. Conserva tu referencia y reintenta.');
    return data;
  }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('No pudimos confirmar la respuesta del servidor. Conserva tu carrito y reintenta: usaremos la misma referencia.');}
  finally{clearTimeout(timer);}
}

export function hydrateMenu(data){
  if(!data?.config || !Array.isArray(data.products)||!Array.isArray(data.categories)||!Array.isArray(data.extras))throw new ApiError('El menú recibido no es válido.');
  const ids=new Set();
  for(const c of data.categories)if(!/^[a-z0-9-]{1,80}$/.test(c.id)||typeof c.name!=='string')throw new ApiError('Hay una categoría inválida.');
  const categoryIds=new Set(data.categories.map(c=>c.id));
  for(const p of data.products){
    if(!/^[a-z0-9-]{1,80}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!categoryIds.has(p.category)||!Array.isArray(p.variants)||!p.variants.length||p.variants.some(v=>!Number.isSafeInteger(v.price)||v.price<100))throw new ApiError('Hay un producto inválido.');
    ids.add(p.id);
  }
  catalog.splice(0,catalog.length,...data.products);
  categories.splice(0,categories.length,...data.categories);
  pizzaExtras.splice(0,pizzaExtras.length,...data.extras);
  Object.assign(business,data.config,{slug:shopSlug(),apiAvailable:true});
  return data;
}
export async function refreshMenu(fetcher=globalThis.fetch){
  if(publicDemo){
    Object.assign(business,{apiAvailable:false,acceptingOrders:false,testMode:true,publicDemo:true,whatsapp:'',bankDestination:null,tagline:'Explora, combina y arma tu pedido de prueba. Sin pagos ni envíos reales.'});
    return {config:business,products:catalog,categories,extras:pizzaExtras};
  }
  return hydrateMenu(await apiJSON(`/api/shops/${shopSlug()}/menu`,{},fetcher));
}

const canonical = value => JSON.stringify(value);
export function createOrderClient({storage,slug='pizzetas',fetcher=globalThis.fetch,uuid=()=>globalThis.crypto.randomUUID()}={}){
  const key=`pizzetas-order-attempt-v1:${slug}`;
  let current=null;
  try{const data=JSON.parse(storage.getItem(key)||'null');if(data?.version===1&&typeof data.key==='string'&&data.payload)current=data;}catch{}
  const persist = value => {storage.setItem(key,JSON.stringify(value));};
  return {
    stored:()=>current?.receipt || null,
    pending:()=>Boolean(current&&!current.receipt),
    async submit(payload){
      if(publicDemo)throw new ApiError('Esta demostración no registra ni envía pedidos reales.');
      if(current && canonical(current.payload)!==canonical(payload))throw new ApiError('Ya hay un intento de pedido con otros datos. Recupera ese intento antes de crear uno nuevo.');
      if(!current)current={version:1,key:uuid(),payload,receipt:null};
      try{persist(current);}catch{throw new ApiError('El navegador no permite conservar la referencia del pedido. No se envió: habilita el almacenamiento o consulta al negocio.');}
      try{
        const receipt=await apiJSON(`/api/shops/${slug}/orders`,{method:'POST',headers:{'Idempotency-Key':current.key},body:JSON.stringify(current.payload)},fetcher);
        if(!receipt.id||!receipt.accessToken||!receipt.snapshot)throw new ApiError('Respuesta incompleta. Reintenta para recuperar el pedido con la misma referencia.');
        current={...current,receipt};let sessionSaved=true;
        try{persist(current);}catch{sessionSaved=false;}
        return {...receipt,sessionSaved};
      }catch(e){
        // Solo los errores definitivos previos a insertar permiten volver a revisar el carrito.
        if(['price_changed','product_unavailable','catalog_changed','orders_paused'].includes(e.detail?.code)||(e.status===422)){current=null;try{storage.removeItem(key);}catch{}}
        throw e;
      }
    },
    async recover(){
      if(publicDemo)return null;
      if(!current)return null;
      if(!current.receipt)return this.submit(current.payload);
      const updated=await apiJSON(`/api/orders/${current.receipt.id}`,{headers:{Authorization:`Bearer ${current.receipt.accessToken}`}},fetcher);
      current={...current,receipt:{...updated,accessToken:current.receipt.accessToken}};
      try{persist(current);}catch{}
      return current.receipt;
    },
    startNew(){if(current&&!current.receipt)throw new ApiError('Primero recupera el intento pendiente para saber si se registró.');current=null;storage.removeItem(key);},
  };
}

export function orderPayload(lines,customer,payFull,total){
  return {customer,items:lines.map(({productId,productVersion,halfVersion,variantIndex,quantity,halfId='',extras=[],selections={},notes=''})=>({productId,productVersion:productVersion||catalog.find(p=>p.id===productId)?.version||1,halfVersion:halfId?(halfVersion||catalog.find(p=>p.id===halfId)?.version||1):null,variantIndex,quantity,halfId,extras,selections,notes})),payFull:Boolean(payFull),expectedTotal:total};
}
export function registeredText(order){
  return `${order.status==='pending_validation'?'PEDIDO REGISTRADO — PENDIENTE DE VALIDACIÓN':'COPIA DEL PEDIDO'}\n${order.confirmationMessage||order.message}\n\nRegistrado no equivale a mensaje enviado ni a pago validado. Conserva tu folio.\n`;
}

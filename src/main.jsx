import React, { useEffect, useId, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Download, FileText, Flame, Info, Minus, Plus, Search, ShoppingBag, X, Pizza, Utensils, CakeSlice, CupSoda, Wine, Sparkles, Sandwich, Moon, Sun, MessageCircle, ShieldCheck } from 'lucide-react';
import { business, catalog, categories, pizzaExtras } from './catalog.mjs';
import { money, normalize, quoteLine, summarize, whatsappMessage, pickupLabel, inspectCart } from './order.mjs';
import { copyText } from './clipboard.mjs';
import { createDraft, loadDraft, saveDraft, downloadText } from './draft.mjs';
import { bankLabel, createOrderClient, orderPayload, productPhoto, refreshMenu, registeredText, shopSlug } from './client-api.mjs';
import { publicDemo, assetUrl } from './environment.mjs';
import './styles.css';

const icons = { pizza: Pizza, utensils: Utensils, flame: Flame, cake: CakeSlice, cup: CupSoda, wine: Wine, sparkles: Sparkles, burger: Sandwich };
const storageKey = `pizzetas-cart-v2:${shopSlug()}`;
function restoreCart() {
  try {
    const saved=localStorage.getItem(storageKey) || (shopSlug()==='pizzetas'?localStorage.getItem('pizzetas-preview-cart-v1'):null) || '[]';
    const data=JSON.parse(saved);
    return Array.isArray(data)?data.filter(x=>typeof x.key==='string'&&typeof x.productId==='string'&&Number.isInteger(x.variantIndex)&&Number.isInteger(x.quantity)&&x.quantity>=1&&x.quantity<=30&&Array.isArray(x.extras)&&x.selections&&typeof x.selections==='object').slice(0,60):[];
  }catch{return [];}
}
function sessionStore(){try{return sessionStorage;}catch{return null;}}
function draftStore(){const store=sessionStore(),slug=shopSlug();return {getItem:key=>store?.getItem(`${key}:${slug}`),setItem:(key,value)=>{if(!store)throw new Error('Almacenamiento bloqueado');store.setItem(`${key}:${slug}`,value);}};}
function downloadCopy(text,filename){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function Sheet({ title, onClose, children, wide = false }) {
  const titleId = useId();
  const ref = useRef();
  const reduced = useReducedMotion();
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const focusables = [...ref.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')].filter(el => el.getClientRects().length);
        const first = focusables[0], last = focusables.at(-1);
        if (!focusables.length) { e.preventDefault(); return; }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown',keydown); previous?.focus(); };
  }, [onClose]);
  return <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }} onClick={onClose}>
    <motion.section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`sheet ${wide ? 'sheet-wide' : ''}`} initial={{ y: reduced ? 0 : 35 }} animate={{ y: 0 }} exit={{ y: reduced ? 0 : 25 }} onClick={e=>e.stopPropagation()}>
      <div className="sheet-handle" /><header className="sheet-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={21}/></button></header>
      {children}
    </motion.section>
  </motion.div>;
}

function Stepper({ value, onChange, label = 'Cantidad' }) {
  return <div className="stepper" role="group" aria-label={label}><button type="button" aria-label={`Reducir ${label.toLowerCase()}`} disabled={value <= 1} onClick={()=>onChange(value-1)}><Minus size={16}/></button><span aria-live="polite">{value}</span><button type="button" aria-label={`Aumentar ${label.toLowerCase()}`} disabled={value >= 30} onClick={()=>onChange(value+1)}><Plus size={16}/></button></div>;
}

function ProductSheet({ product, onClose, onAdd, onContact }) {
  const [firstId,setFirstId] = useState(product.buildHalves ? '' : product.id);
  const p = catalog.find(x=>x.id===firstId) || product;
  const [variantIndex,setVariant] = useState(0);
  const [halfMode,setHalfMode] = useState(Boolean(product.buildHalves));
  const [halfId,setHalfId] = useState('');
  const [extras,setExtras] = useState([]);
  const [quantity,setQuantity] = useState(1);
  const [selections,setSelections] = useState({});
  const [notes,setNotes] = useState('');
  const [error,setError] = useState('');
  const isPizza = p.category === 'pizzas';
  const config = { productId:p.id, productVersion:p.version||1, halfVersion:halfMode&&halfId?(catalog.find(x=>x.id===halfId)?.version||1):null, variantIndex, halfId:halfMode ? halfId : '', extras, quantity, selections, notes };
  let unit = firstId ? p.variants[variantIndex].price : 0;
  if (halfMode && halfId) unit = Math.max(unit, catalog.find(x=>x.id===halfId).variants[variantIndex].price);
  unit += extras.length * 3000;
  const add = e => { e.preventDefault(); if (!firstId) { setError('Elige la primera mitad.'); return; } if (halfMode && !halfId) { setError('Elige la segunda mitad.'); return; } try { quoteLine(config); onAdd(config); } catch(e) { setError(e.message); } };
  return <Sheet title={product.buildHalves ? 'Arma tu pizza' : p.name} onClose={onClose}>
    <form onSubmit={add} className="product-form">
      <div className="sheet-scroll">
        {firstId&&productPhoto(p)&&<figure className="product-detail-photo"><img src={p.photoUrl||productPhoto(p)} alt={p.name} width="800" height="800"/>{p.photoKind&&p.photoKind!=='uploaded'&&<figcaption>{p.photoKind==='illustrative'?'Imagen ilustrativa generada con IA. Presentación por confirmar.':'Foto real mejorada con IA. Presentación orientativa.'}</figcaption>}</figure>}
        <p className="muted mb-5">{firstId ? <>{p.description} {p.baseDescription}</> : 'Elige tus dos especialidades favoritas. Tú decides ambas mitades.'}</p>
        {p.variants.length > 1 && <fieldset><legend>{isPizza ? '¿De qué tamaño?' : 'Elige tu presentación'}</legend><div className="choice-grid">{p.variants.map((v,i)=><label key={v.name} className={`choice ${variantIndex===i?'selected':''}`}><input type="radio" name="variant" checked={variantIndex===i} onChange={()=>setVariant(i)}/><span>{v.name}{firstId&&<small>{money(halfMode&&halfId?Math.max(v.price,catalog.find(x=>x.id===halfId)?.variants[i]?.price||0):v.price)}</small>}</span>{variantIndex===i && <Check size={18}/>}</label>)}</div></fieldset>}
        {isPizza && <>
          <fieldset><legend>Un sabor o dos favoritos</legend><div className="segmented"><button type="button" aria-pressed={!halfMode} className={!halfMode?'active':''} onClick={()=>{setHalfMode(false);if(!firstId)setFirstId(product.id);}}>Completa</button><button type="button" aria-pressed={halfMode} className={halfMode?'active':''} onClick={()=>setHalfMode(true)}>Mitad y mitad</button></div>
          {halfMode && <div className="mt-3"><label className="field-label" htmlFor="first-half">Primera mitad</label><select id="first-half" value={firstId} onChange={e=>{setFirstId(e.target.value);setSelections({});setError('');if(e.target.value===halfId)setHalfId('');}} required><option value="">Elige la primera mitad</option>{catalog.filter(x=>x.category==='pizzas' && x.available).map(x=><option key={x.id} value={x.id}>{x.name} · {money(x.variants[variantIndex].price)}</option>)}</select><label className="field-label mt-3" htmlFor="second-half">Segunda mitad</label><select id="second-half" value={halfId} onChange={e=>setHalfId(e.target.value)} required><option value="">Elige la segunda mitad</option>{catalog.filter(x=>x.category==='pizzas' && x.id!==firstId && x.available).map(x=><option key={x.id} value={x.id}>{x.name} · {money(x.variants[variantIndex].price)}</option>)}</select><p className="help">Se cobra la especialidad de mayor precio.</p></div>}
          </fieldset>
          <details className="extras"><summary><span>¿Un ingrediente extra?<small>+ $30 cada uno · en toda la pizza</small></span><Plus size={18}/></summary><div className="extras-list">{pizzaExtras.map(extra=><label key={extra}><input type="checkbox" checked={extras.includes(extra)} onChange={()=>setExtras(old=>old.includes(extra)?old.filter(x=>x!==extra):[...old,extra])}/><span>{extra}</span><small>+ $30</small></label>)}</div></details>
        </>}
        {(firstId ? p.choices || [] : []).map(choice=><fieldset key={choice.label}><label className="field-label" htmlFor={`choice-${choice.label}`}>{choice.label}</label><select id={`choice-${choice.label}`} value={selections[choice.label] || ''} required onChange={e=>setSelections({...selections,[choice.label]:e.target.value})}><option value="">Elige una opción</option>{choice.values.map(v=><option key={v}>{v}</option>)}</select></fieldset>)}
        {p.advisory && <p className="notice"><Info size={17}/>{p.advisory}</p>}
        <label className="field-label" htmlFor="notes">¿Algo que debamos saber? <span className="optional">Opcional</span></label><textarea id="notes" maxLength={180} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ej. sin cebolla. Para cambios especiales, consúltanos." rows={2}/>
        {isPizza && <button className="text-link mt-3" type="button" onClick={onContact}><MessageCircle size={16}/> ¿Una pizza muy a tu manera? Platiquemos.</button>}
        <p className="help mt-4">Los cambios escritos en notas están sujetos a confirmación. No sustituyen ingredientes extra.</p>
      </div>
      <footer className="sheet-footer"><div className="w-full">{error && <p role="alert" className="error">{error}</p>}<div className="flex items-center gap-3"><Stepper value={quantity} onChange={setQuantity}/><button className="primary grow" type="submit" disabled={!firstId||(halfMode&&!halfId)}>{!firstId||(halfMode&&!halfId)?'Elige tus especialidades':`Agregar · ${money(unit * quantity)}`}<Plus size={18}/></button></div></div></footer>
    </form>
  </Sheet>;
}

function CartSheet({ cart, onClose, onChange, onCheckout, onRefresh }) {
  const order = inspectCart(cart);
  return <Sheet title="Tu pedido" onClose={onClose}>
    <div className="sheet-scroll cart-scroll">
      <div className="pickup-note"><ShoppingBag size={18}/><span>Para recoger en el negocio</span></div>
      {!cart.length ? <div className="empty-cart"><ShoppingBag size={38}/><h3>Algo rico te espera</h3><p>Agrega tus favoritos para empezar.</p><button className="primary" onClick={onClose}>Explorar el menú</button></div> : order.items.map(item=><article className="cart-item" key={item.key}><div className="cart-item-top"><div><h3>{item.title}</h3>{item.details.map((d,i)=><p key={i}>{d}</p>)}</div><strong>{item.valid?money(item.total):"Por revisar"}</strong></div><div className="cart-item-actions"><Stepper value={item.quantity} label={`Cantidad de ${item.title}`} onChange={value=>onChange(cart.map(x=>x.key===item.key?{...x,quantity:value}:x))}/><button className="text-link muted" onClick={()=>onChange(cart.filter(x=>x.key!==item.key))}>Quitar</button></div></article>)}
      {!order.valid && <div className="notice mt-4"><Info size={18}/><span>Hay productos por revisar. No se han quitado del carrito. Actualiza el menú y retira o vuelve a elegir los que cambiaron.<button type="button" className="text-link" onClick={onRefresh}>Actualizar menú</button></span></div>}{!!cart.length && order.valid && <div className="bill"><div><span>Total del pedido</span><strong>{money(order.total)}</strong></div><div className="deposit-line"><span>Anticipo mínimo · 50%</span><strong>{money(order.deposit)}</strong></div><p>Transferencia con validación del encargado antes de preparar. El saldo se liquida al recoger.</p></div>}
    </div>
    {!!cart.length && <footer className="sheet-footer"><button className="primary w-full" disabled={!order.valid} onClick={onCheckout}>Continuar con mi pedido<ArrowRight size={18}/></button></footer>}
  </Sheet>;
}

function CheckoutSheet({cart,onClose,onBack,onPrepared,orderClient,onRegistered,onRefresh}){
  const [step,setStep]=useState(0);const [customer,setCustomer]=useState({name:publicDemo?'Cliente de prueba':'',phone:publicDemo?'7770000000':'',pickup:''});
  const [pickupMode,setPickupMode]=useState('asap');const [payFull,setPayFull]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [ack,setAck]=useState(false);
  const submitting=useRef(false);const messageRef=useRef();const [copyState,setCopyState]=useState('');
  const ready=business.apiAvailable&&business.acceptingOrders&&business.bankDestination&&business.whatsapp&&business.address;
  const check=inspectCart(cart);
  if(!check.valid)return <Sheet title="Revisa tu carrito" onClose={onClose}><div className="sheet-scroll"><p className="notice">Un producto cambió o dejó de estar disponible. Conservamos tu selección para que puedas revisarla.</p><button className="primary w-full mt-4" onClick={onBack}>Revisar productos</button></div></Sheet>;
  const order=summarize(cart,payFull);const message=whatsappMessage(cart,customer,payFull);
  const next=async e=>{
    e.preventDefault();if(submitting.current)return;setError('');
    const data=new FormData(e.currentTarget);const clean={name:String(data.get('name')||'').trim(),phone:String(data.get('phone')||'').replace(/\D/g,''),pickup:pickupMode==='asap'?'asap':String(data.get('pickup')||'')};
    if(clean.name.length<3||!/^\d{10,15}$/.test(clean.phone)||!(clean.pickup==='asap'||/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clean.pickup))){setError('Revisa tu nombre, teléfono y recolección.');return;}
    setCustomer(clean);
    if(!ready){setStep(1);return;}
    submitting.current=true;setBusy(true);
    try{const result=await orderClient.submit(orderPayload(cart,clean,payFull,order.total));onRegistered(result);}
    catch(e){setError(e.message);}
    finally{submitting.current=false;setBusy(false);}
  };
  const recover=async()=>{setBusy(true);setError('');try{const result=await orderClient.recover();if(result)onRegistered(result);}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <Sheet title={step===0?'Casi está listo':'Tu borrador local'} onClose={busy?()=>{}:onClose}>
    {step===0?<form className="checkout-form" aria-busy={busy} onSubmit={next}><div className="sheet-scroll">
      <button type="button" disabled={busy} className="text-link mb-5" onClick={onBack}><ArrowLeft size={16}/>Volver a mi cuenta</button>
      <p className="muted mb-5">{ready?'Registraremos tu pedido antes de mostrarte los datos para transferir.':publicDemo?'Esta es una demo. Usa datos ficticios: no se envían pedidos ni se realizan pagos.':'Puedes preparar un borrador. El negocio aún no recibe pedidos en esta carta.'}</p>
      <label className="field-label" htmlFor="customer-name">Nombre completo</label><input id="customer-name" name="name" autoComplete="name" required minLength={3} maxLength={80} disabled={busy} value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})} placeholder="Tu nombre y apellido"/>
      <label className="field-label mt-4" htmlFor="customer-phone">Teléfono de contacto</label><input id="customer-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={20} disabled={busy} value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})} placeholder="10 dígitos"/>
      <fieldset className="mt-5" disabled={busy}><legend>¿Cuándo te gustaría recoger?</legend><div className="choice-grid">{[['asap','Lo antes posible','Tiempo por confirmar'],['scheduled','Solicitar una hora','Para recoger hoy']].map(([value,label,help])=><label className={`choice ${pickupMode===value?'selected':''}`} key={value}><input type="radio" name="pickup-mode" checked={pickupMode===value} onChange={()=>setPickupMode(value)}/><span>{label}<small>{help}</small></span></label>)}</div></fieldset>
      {pickupMode==='scheduled'&&<><label className="field-label" htmlFor="pickup-time">Hora que te gustaría recoger</label><input id="pickup-time" name="pickup" type="time" disabled={busy} required value={customer.pickup==='asap'?'':customer.pickup} onChange={e=>setCustomer({...customer,pickup:e.target.value})}/></>}
      <p className="help">Referencia habitual: {business.preparationMin||25}–{business.preparationMax||35} minutos desde la confirmación. Si cocina está ocupada, el encargado te propondrá otro tiempo por WhatsApp para que decidas.</p>
      <fieldset className="mt-5" disabled={busy}><legend>¿Cuánto quieres transferir?</legend><div className="choice-grid">{[false,true].map(full=><label key={String(full)} className={`choice ${payFull===full?'selected':''}`}><input type="radio" name="deposit" checked={payFull===full} onChange={()=>setPayFull(full)}/><span>{full?'Total · 100%':'Anticipo · 50%'}<small>{money(full?order.total:Math.ceil(order.total/2))}</small></span></label>)}</div></fieldset>
      {ready&&<label className="acknowledgment"><input type="checkbox" required disabled={busy} checked={ack} onChange={e=>setAck(e.target.checked)}/><span>Enviaré el pedido y el comprobante por WhatsApp. El encargado debe validar el abono y acordar la recolección.</span></label>}
      {error&&<div role="alert" className="error">{error}<button type="button" className="text-link" disabled={busy} onClick={onRefresh}>Revisar menú actualizado</button>{orderClient.pending()&&<button type="button" className="text-link" disabled={busy} onClick={recover}>Recuperar intento pendiente</button>}</div>}
    </div><footer className="sheet-footer"><button className="primary w-full" disabled={busy}>{busy?'Registrando… conserva esta ventana':ready?'Registrar pedido y ver transferencia':'Ver borrador y anticipo'}<ArrowRight size={17}/></button></footer></form>:<>
      <div className="sheet-scroll"><button type="button" className="text-link mb-5" onClick={()=>setStep(0)}><ArrowLeft size={16}/>Editar mis datos</button><div className="customer-summary"><strong>{customer.name}</strong><span>{customer.phone} · {pickupLabel(customer.pickup)}</span></div><div className="transfer-card mt-5"><span>Anticipo previsto</span><strong>{money(order.deposit)} <small>MXN</small></strong><p>No transfieras todavía. Esta copia es un borrador y no registra un pedido.</p></div><div className="bill"><div><span>Total</span><strong>{money(order.total)}</strong></div><div><span>Saldo tras validar el abono</span><strong>{money(order.balance)}</strong></div></div><details className="message-preview"><summary>Revisar mensaje del pedido<ChevronDown size={16}/></summary><textarea ref={messageRef} readOnly rows={8} aria-label="Texto del pedido para copiar" value={message}/><button type="button" className="text-link" onClick={async()=>{const ok=await copyText(message);setCopyState(ok?'✓ Texto copiado.':'Selecciona el texto para copiarlo.');if(!ok){messageRef.current?.focus();messageRef.current?.select();}}}><Copy size={16}/>Copiar texto</button></details><p role="status" className="copy-feedback">{copyState}</p></div><footer className="sheet-footer"><button className="primary w-full" onClick={()=>onPrepared(customer,payFull,'test')}>Finalizar prueba y ver resumen<ArrowRight size={17}/></button></footer>
    </>}
  </Sheet>;
}

function RegisteredSheet({order,orderClient,onUpdate,onClose,onNew}){
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [copied,setCopied]=useState('');const [showText,setShowText]=useState(false);const textRef=useRef();
  const labels={pending_validation:'Registrado · pendiente de validación',confirmed:'Confirmado por el encargado',preparing:'En preparación',ready:'Listo para recoger',completed:'Entregado'};
  const testMode=Boolean(order.snapshot.business.testMode);
  const bank=order.snapshot.business.bankDestination;const pending=order.status==='pending_validation';const transfer=order.snapshot.payFull?order.total:order.minimumDeposit;
  const refresh=async()=>{setBusy(true);setError('');try{const next=await orderClient.recover();if(next)onUpdate(next);}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <Sheet title="Tu pedido para recoger" onClose={onClose}><div className="sheet-scroll receipt-scroll">
    <div className="receipt-heading"><span className="receipt-icon"><ShoppingBag size={28}/></span><h3>{pending?'Ya tienes un folio.':'Tu pedido, en un vistazo.'}</h3><p>{pending?'Ahora envía el mensaje y tu comprobante en el chat del negocio.':'El estado se actualiza cuando el encargado atiende tu pedido.'}</p></div>
    <div className="receipt-status"><strong>{testMode?'PRUEBA LOCAL · ':''}{labels[order.status]||order.status}</strong><p>{pending?'Registrarlo y abrir WhatsApp no confirman el envío del mensaje ni el pago. Espera la respuesta del encargado.':`Recolección acordada: ${order.pickupConfirmed}`}</p></div><div className="receipt-reference"><span>Folio del pedido</span><code>{order.folio}</code></div>
    <div className="customer-summary"><strong>{order.snapshot.customer.name}</strong><span>{pickupLabel(order.snapshot.customer.pickup)}</span></div>
    {pending&&<div className="transfer-card mt-5"><span>{testMode?'SIMULACIÓN · no transfieras':'Transferencia prevista'} · {order.snapshot.payFull?'100%':'50%'}</span><strong>{money(transfer)} <small>MXN</small></strong><p>{bank.bank} · {bank.holder}</p><span>{bankLabel(bank.type)}</span><button className="clabe" onClick={async()=>setCopied(await copyText(bank.number)?'Datos bancarios copiados.':'Mantén pulsado el número para copiarlo.')}>{bank.number}<Copy size={17}/></button></div>}
    <div className="receipt-items">{order.snapshot.items.map((item,i)=><article key={i}><div><strong>{item.quantity} × {item.title}</strong><b>{money(item.total)}</b></div>{item.details.map((d,j)=><p key={j}>{d}</p>)}</article>)}</div>
    <div className="bill"><div><span>Total</span><strong>{money(order.total)}</strong></div><div><span>Abono validado</span><strong>{money(order.paid)}</strong></div><div><span>Saldo actual</span><strong>{money(order.balance)}</strong></div><p>El saldo se liquida al recoger en efectivo, transferencia o tarjeta.</p></div><p className="notice"><Info size={18}/><span>{order.snapshot.business.address}<br/>{order.snapshot.business.hours}</span></p>
    <div className="receipt-actions"><button className="secondary" onClick={async()=>{const ok=await copyText(registeredText(order));setCopied(ok?'✓ Copia del pedido lista para pegar.':'Selecciona el texto para copiarlo.');if(!ok)setShowText(true);}}><Copy size={16}/>Copiar pedido</button><button className="secondary" onClick={()=>downloadCopy(registeredText(order),`pedido-${order.folio}.txt`)}><Download size={16}/>Guardar copia</button></div><p role="status" className="copy-feedback">{copied}</p>
    <details className="message-preview" open={showText} onToggle={e=>setShowText(e.currentTarget.open)}><summary>Ver copia del pedido<ChevronDown size={16}/></summary><textarea ref={textRef} readOnly aria-label="Copia de mi pedido registrado" rows={8} value={registeredText(order)}/><button className="text-link" onClick={()=>{textRef.current?.focus();textRef.current?.select();}}>Seleccionar todo</button></details>
    <button className="text-link" disabled={busy} onClick={refresh}>{busy?'Actualizando…':'Actualizar estado del pedido'}</button>{error&&<p role="alert" className="error">{error}</p>}{order.sessionSaved===false&&<p className="error">No se pudo conservar la copia en esta sesión. Guárdala antes de cerrar.</p>}
    <button className="text-link" onClick={onClose}>Volver al menú</button><button className="text-link muted" onClick={onNew}>Crear otro pedido con mi carrito</button>
  </div><footer className="sheet-footer">{testMode?<button className="primary w-full" onClick={onClose}>Terminar simulación y volver al menú<ArrowRight size={17}/></button>:<a className="primary whatsapp w-full" target="_blank" rel="noreferrer" href={`https://wa.me/${order.snapshot.business.whatsapp}?text=${encodeURIComponent(pending?order.message:`Hola, consulto mi pedido ${order.folio}.`)}`}><MessageCircle size={18}/>{pending?'Enviar pedido en WhatsApp':'Abrir chat del negocio'}<ArrowRight size={17}/></a>}</footer></Sheet>;
}

function ReceiptSheet({ draft, saved, onClose, onCart }) {
  const [copyState,setCopyState] = useState('idle');
  const [error,setError] = useState('');
  const messageRef = useRef();
  const [textOpen,setTextOpen] = useState(false);
  const isTest = draft.kind === 'test';
  const copy = async () => {
    setCopyState('copying');
    const ok = await copyText(downloadText(draft));
    setCopyState(ok ? 'copied' : 'manual');
    if (!ok) { setTextOpen(true); }
  };
  useEffect(()=>{if(copyState==='manual'&&textOpen){messageRef.current?.focus();messageRef.current?.select();messageRef.current?.scrollIntoView({block:'nearest'});}},[copyState,textOpen]);
  const download = () => {
    try {
      const blob = new Blob([downloadText(draft)],{type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href=url; link.download=`pizzetas-resumen-${draft.id.slice(0,8)}.txt`;
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setError('');
    } catch { setError('No se pudo descargar. Usa «Copiar resumen» para conservarlo.'); }
  };
  return <Sheet title={isTest?'Tu resumen de prueba':'Tu resumen para recoger'} onClose={onClose}>
    <div className="sheet-scroll receipt-scroll">
      <div className="receipt-heading"><span className="receipt-icon"><FileText size={27}/></span><h3>{isTest?'Listo para revisar.':'Continúa en tu chat.'}</h3><p>{isTest?'Esta prueba terminó. Aquí tienes tu copia.':'Envía el mensaje y adjunta el comprobante en WhatsApp.'}</p></div>
      <div className="receipt-status"><span className="status-dot"/><strong>{isTest?'Borrador local · no enviado':'Pendiente de envío y validación'}</strong><p>{isTest?'El restaurante todavía no ha recibido un pedido.':'Abrir el chat no acredita envío ni pago. Espera la confirmación del encargado antes de acudir.'}</p></div>
      <div className="receipt-reference"><span>Referencia local · {new Date(draft.createdAt).toLocaleString('es-MX',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span><code>{draft.id}</code></div>
      <div className="customer-summary"><strong>{draft.customer.name}</strong><span>{draft.customer.phone} · Recolección: {pickupLabel(draft.customer.pickup)}</span></div>
      <div className="receipt-items">{draft.items.map((item,i)=><article key={i}><div><strong>{item.quantity} × {item.title}</strong><b>{money(item.total)}</b></div>{item.details.map((d,index)=><p key={index}>{d}</p>)}</article>)}</div>
      <div className="bill"><div><span>Total</span><strong>{money(draft.total)}</strong></div><div><span>Transferencia prevista · {draft.payFull?'100%':'50%'}</span><strong>{money(draft.deposit)}</strong></div><div><span>Saldo tras validar ese abono</span><strong>{money(draft.balance)}</strong></div><p>Los importes no representan pagos recibidos. El saldo puede liquidarse al recoger en efectivo, transferencia o tarjeta.</p></div>
      <p className="help">{saved?'Puedes recuperar este resumen durante esta sesión desde el menú. Conservamos tu carrito para revisarlo.':'El navegador no permitió guardar el resumen de la sesión. Descárgalo o cópialo antes de cerrar.'}</p>
      <div className="receipt-actions"><button className="secondary" type="button" disabled={copyState==='copying'} onClick={copy}>{copyState==='copied'?<Check size={17}/>:<Copy size={17}/>} {copyState==='copying'?'Copiando…':'Copiar resumen'}</button><button className="secondary" type="button" onClick={download}><Download size={17}/>Guardar copia</button></div>
      <p role="status" className="copy-feedback">{copyState==='copied'?'✓ Resumen copiado.':copyState==='manual'?'Selecciona el texto para copiarlo manualmente.':''}</p>
      <details className="message-preview" open={textOpen} onToggle={e=>setTextOpen(e.currentTarget.open)}><summary>Ver texto de mi copia<ChevronDown size={16}/></summary><textarea ref={messageRef} aria-label="Copia de mi resumen" readOnly value={downloadText(draft)} rows={9}/></details>
      {!isTest && /^\d{10,15}$/.test(business.whatsapp) && <a className="text-link" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(draft.message)}`} target="_blank" rel="noreferrer"><MessageCircle size={16}/>Volver a abrir WhatsApp</a>}
      <button className="text-link" onClick={onCart}>Revisar mi carrito<ArrowRight size={16}/></button>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
    <footer className="sheet-footer"><button className="primary w-full" onClick={onClose}>Volver al menú<ArrowRight size={17}/></button></footer>
  </Sheet>;
}

function App({connectionError=''}) {
  const [cart,setCart] = useState(restoreCart);
  const [orderClient] = useState(()=>createOrderClient({storage:sessionStore(),slug:shopSlug()}));
  const [registered,setRegistered] = useState(()=>orderClient.stored());
  const [connection,setConnection] = useState(connectionError);
  const [menuRevision,setMenuRevision] = useState(0);
  const [query,setQuery] = useState('');
  const [activeCategory,setActiveCategory] = useState(categories[0]?.id||'');
  const [view,setView] = useState(null);
  const [product,setProduct] = useState(null);
  const [toast,setToast] = useState('');
  const [draft,setDraft] = useState(()=>{try{return loadDraft(draftStore()) || (shopSlug()==='pizzetas'?loadDraft(sessionStorage):null);}catch{return null;}});
  const [draftSaved,setDraftSaved] = useState(true);
  const [dark,setDark] = useState(()=>{try{return localStorage.getItem('pizzetas-theme')==='dark';}catch{return false;}});
  const sections = useRef({});
  const categoryNav = useRef();
  const scrollLock = useRef(0);
  const reduced = useReducedMotion();
  const order = inspectCart(cart);
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(cart));}catch{}},[cart]);
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';try{localStorage.setItem('pizzetas-theme',dark?'dark':'light');}catch{}},[dark]);
  useEffect(()=>{if(!/^#[0-9a-fA-F]{6}$/.test(business.primaryColor||''))return;let rgb=[1,3,5].map(i=>parseInt(business.primaryColor.slice(i,i+2),16));const lum=values=>values.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);const bg=lum(dark?[30,32,29]:[248,246,241]);for(let i=0;i<40;i++){const l=lum(rgb);if((Math.max(l,bg)+.05)/(Math.min(l,bg)+.05)>=4.5)break;rgb=rgb.map(v=>Math.round(v*.85+(dark?255:0)*.15));}document.documentElement.style.setProperty('--red','#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''));},[dark,menuRevision]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),2500);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{
    const update=()=>{if(Date.now()<scrollLock.current)return;let current='';for(const category of categories){const el=sections.current[category.id];if(el && el.getBoundingClientRect().top < 205)current=category.id;}if(current)setActiveCategory(current);};
    window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);
  },[query]);
  useEffect(()=>{const nav=categoryNav.current;const tab=nav?.querySelector(`[data-category="${activeCategory}"]`);if(nav&&tab)nav.scrollTo({left:tab.offsetLeft-nav.offsetLeft-nav.clientWidth/2+tab.clientWidth/2,behavior:reduced?'instant':'smooth'});},[activeCategory,reduced]);
  const close = React.useCallback(()=>setView(null),[]);
  const reloadMenu=async()=>{try{await refreshMenu();setConnection('');setMenuRevision(n=>n+1);if(view==='checkout')setView('cart');setToast('Menú actualizado. Revisa el carrito.');}catch(e){business.apiAvailable=false;setConnection(e.message);}};
  const onRegistered=result=>{setRegistered(result);setView('registered');};
  const recoverPending=async()=>{try{const result=await orderClient.recover();if(result)onRegistered(result);}catch(e){setToast(e.message);}};
  const checkout=()=>{if(registered){setView('registered');return;}if(orderClient.pending()){recoverPending();return;}if(order.valid)setView('checkout');};
  const newOrder=()=>{try{orderClient.startNew();setRegistered(null);setView('cart');}catch(e){setToast(e.message);}};
  useEffect(()=>{if(orderClient.stored())orderClient.recover().then(setRegistered).catch(()=>setToast('Mostramos tu última copia. Actualiza el estado cuando vuelva la conexión.'));},[orderClient]);

  const prepared = (customer,payFull,kind) => {
    const snapshot = createDraft(cart,customer,payFull,draft,kind);
    let saved = false;try{saved=saveDraft(draftStore(),snapshot);}catch{}
    setDraft(snapshot);setDraftSaved(saved);setView('receipt');
  };
  const contact = ()=>setView('contact');
  const jump = id => {scrollLock.current=Date.now()+1000;setActiveCategory(id);sections.current[id]?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});};
  const add = config => {
    const signature=JSON.stringify({...config,quantity:0});
    const existing=cart.find(x=>x.signature===signature);
    if(existing&&existing.quantity+config.quantity>30){setToast('Máximo 30 unidades por selección.');return;}
    if(!existing&&cart.length>=60){setToast('Para pedidos grandes, consulta al negocio.');return;}
    setCart(existing?cart.map(x=>x.key===existing.key?{...x,quantity:x.quantity+config.quantity}:x):[...cart,{...config,key:crypto.randomUUID(),signature}]);setView(null);setToast('Agregado a tu pedido');
  };
  const results=catalog.filter(p=>p.available&&normalize(`${p.name} ${p.description} ${p.tags?.join(' ')||''} ${categories.find(c=>c.id===p.category).name}`).includes(normalize(query.trim())));
  return <>
    <div className="preview-banner">{publicDemo?'DEMO INTERACTIVA':business.apiAvailable?(business.acceptingOrders?(business.testMode?'MODO DE PRUEBAS':'PARA RECOGER'):'PEDIDOS PAUSADOS'):'VISTA SIN CONEXIÓN'} <span>·</span> {publicDemo?'Sin pagos ni pedidos reales':business.acceptingOrders&&business.apiAvailable?'Anticipo mínimo del 50%':'Puedes explorar la carta y guardar un borrador'}</div>
    <header className="site-header"><div className="header-inner">
      <a className="wordmark" href="#inicio" aria-label={`${business.name}, inicio`}><span className="brand-symbol"><Flame size={23}/></span><span>{business.name.replace(/ Artesanales$/i,'')}<small>{business.name.endsWith('Artesanales')?'ARTESANALES':'PARA RECOGER'}</small></span></a>
      <div className="header-actions"><span className="pickup-header"><ShoppingBag size={15}/>Para recoger</span><button className="icon-button theme-button" aria-label={dark?'Usar modo claro':'Usar modo oscuro'} onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button><button className="header-cart" onClick={()=>setView('cart')} aria-label={`Ver mi pedido, ${order.count} productos`}><ShoppingBag size={19}/><span>Mi pedido</span><b>{order.count}</b></button></div>
    </div></header>
    <main id="inicio" className="main-shell">
      <section className="hero"><div className="hero-copy"><span className="eyebrow"><span/>HECHAS PARA TU ANTOJO</span><h1>Hoy se antoja<br/>algo <em>artesanal.</em></h1><p>{business.tagline || <>Tu pizza favorita, a tu manera.<br className="mobile-break"/> Tú eliges, nosotros le ponemos el sabor.</>}</p><button className="hero-cta" onClick={()=>jump(categories.find(c=>c.id==='pizzas')?.id||categories[0]?.id)}>Encuentra tu favorita<ArrowRight size={19}/></button><span className="hero-caption"><ShoppingBag size={14}/>Pide aquí. Recoge en el negocio.</span></div><div className="hero-photo"><img src={assetUrl("images/hero.webp")} alt="Pizza y acompañamientos de Pizzetas Artesanales" fetchPriority="high"/><div className="photo-label"><Flame size={18}/><span>El sabor de<br/><strong>hacerlo a mano.</strong></span></div></div></section>
      <div className="how-it-works"><span><span className="number">1</span>Elige tus favoritos</span><i/><span><span className="number">2</span>Anticipa el 50%</span><i/><span><span className="number">3</span>Recoge y disfruta</span></div>
      {connection&&<p className="notice mt-4"><Info size={17}/><span>No pudimos actualizar el menú. No se registrarán pedidos sin conexión.<button className="text-link" onClick={reloadMenu}>Reintentar conexión</button></span></p>}
      {registered&&<button className="saved-summary" onClick={()=>setView('registered')}><ShoppingBag size={20}/><span><strong>Tu pedido registrado</strong><small>{registered.folio.slice(0,15)}… · {money(registered.total)}</small></span><ArrowRight size={18}/></button>}
      {!registered&&orderClient.pending()&&<button className="saved-summary" onClick={recoverPending}><Info size={20}/><span><strong>Recuperar intento pendiente</strong><small>Comprobaremos si se registró sin duplicarlo.</small></span><ArrowRight size={18}/></button>}
      {draft && <button className="saved-summary" onClick={()=>setView('receipt')}><FileText size={20}/><span><strong>Tu último resumen</strong><small>{draft.kind==='test'?'Prueba local · no enviado':'Pendiente de envío y validación'} · {money(draft.total)}</small></span><ArrowRight size={18}/></button>}
      <div className="menu-toolbar"><div><span className="eyebrow">EL MENÚ</span><h2>¿Qué se te antoja?</h2></div><label className="search-box"><Search size={19}/><input aria-label="Buscar en el menú" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca tu antojo…"/>{query&&<button aria-label="Limpiar búsqueda" onClick={()=>setQuery('')}><X size={17}/></button>}</label></div>
      <nav className="category-nav" aria-label="Categorías del menú" ref={categoryNav}>{categories.filter(c=>results.some(p=>p.category===c.id)).map(c=>{const Icon=icons[c.icon]||Utensils;return <button key={c.id} data-category={c.id} aria-current={activeCategory===c.id?'true':undefined} className={activeCategory===c.id?'active':''} onClick={()=>jump(c.id)}><Icon size={17}/>{c.name}</button>;})}</nav>
      {query && <p className="search-count" role="status">{results.length} resultados para “{query}”</p>}
      {!results.length&&<div className="empty-search"><Search size={35}/><h3>Ese antojo no apareció</h3><p>Prueba con “pizza”, “chocolate” o “cerveza”.</p><button className="text-link" onClick={()=>setQuery('')}>Ver todo el menú<ArrowRight size={16}/></button></div>}
      {categories.map(category=>{
        const items=results.filter(p=>p.category===category.id);if(!items.length)return null;
        return <section className="menu-section" id={category.id} key={category.id} ref={el=>sections.current[category.id]=el}>
          <header className="section-heading"><div><h2>{category.name}<span>{items.length.toString().padStart(2,'0')}</span></h2><p>{category.subtitle}</p></div>{category.id==='pizzas'&&<span className="half-pill"><Pizza size={15}/>También mitad y mitad</span>}</header>
          {category.id==='pizzas'&&<div className="pizza-feature"><div><span className="eyebrow">NO TIENES QUE ELEGIR SOLO UNA</span><h3>Dos mitades.<br/><em>Un gran antojo.</em></h3><p>Combina tus especialidades favoritas.<br/>Pagas la de mayor precio.</p><button className="text-link" onClick={()=>{setProduct({...catalog.find(p=>p.category==='pizzas'&&p.available),buildHalves:true});setView('product');}}>Armar mi pizza<ArrowRight size={17}/></button></div><figure className="pizza-feature-photo"><img src={assetUrl("images/pizza-dos-mitades.png")} alt="Pizza artesanal de dos mitades: jamón con piña y quesos" loading="lazy" width="747" height="1087"/></figure><span className="feature-stamp">HECHA<br/><strong>A TU<br/>ANTOJO</strong></span></div>}
          <div className="product-grid">{items.map(p=>{const Icon=icons[category.icon]||Utensils;const min=Math.min(...p.variants.map(v=>v.price));return <button className="product-card" key={p.id} onClick={()=>{setProduct(p);setView('product');}} aria-label={`Elegir ${p.name}, ${p.variants.length>1?'desde ':''}${money(min)}`}>
            <div className={`product-visual ${(p.photoUrl||(p.image&&p.image!=='pizza'))?'with-photo':''}`}>{p.photoUrl||(p.image&&p.image!=='pizza')?<img src={productPhoto(p)} alt="" loading="lazy" width="120" height="120"/>:<Icon strokeWidth={1.4} size={category.id==='pizzas'?30:27}/>}</div>
            <div className="product-copy"><h3>{p.name}</h3>{p.photoKind==='illustrative'&&<span className="illustrative-label">Imagen ilustrativa</span>}<p>{p.description || (p.variants.length>1?'Elige tu presentación.':'Agrégalo a tu pedido.')}</p><div className="product-price">{p.variants.length>1&&<span>Desde </span>}<strong>{money(min)}</strong>{p.category==='pizzas'&&<small>Personal · Grande</small>}</div></div><span className="add-circle"><Plus size={18}/></span>
          </button>;})}</div>
        </section>;
      })}
      <section className="help-card"><div className="help-icon"><MessageCircle size={25}/></div><div><h3>¿Tu antojo es muy especial?</h3><p>Cuéntanos qué tienes en mente. Lo vemos contigo.</p></div><button className="icon-button" onClick={contact} aria-label="Consultar un pedido especial"><ArrowRight size={21}/></button></section>
      <footer className="site-footer"><div className="footer-brand">{business.name}</div><p>Hecho a mano. Disfrutado a tu manera.</p><button className="text-link" onClick={reloadMenu}>Actualizar carta</button><button className="text-link" onClick={()=>setView('info')}><Info size={15}/>Cómo pedir</button><small>Precios en MXN · Fotografías del menú, ilustrativas.</small></footer>
    </main>
    {!!cart.length&&<div className="cart-dock"><button onClick={()=>setView('cart')} className="cart-dock-button"><span className="dock-count">{order.count}</span><span>Ver mi pedido<small>Para recoger</small></span><strong>{order.valid?money(order.total):'Revisar'}</strong><ArrowRight size={19}/></button></div>}
    <AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}><Check size={17}/>{toast}</motion.div>}</AnimatePresence>
    <AnimatePresence mode="wait">{view==='product'&&<ProductSheet key={product.id} product={product} onClose={close} onAdd={add} onContact={contact}/>}{view==='cart'&&<CartSheet key="cart" cart={cart} onClose={close} onChange={setCart} onCheckout={checkout} onRefresh={reloadMenu}/>}{view==='checkout'&&<CheckoutSheet key="checkout" cart={cart} onClose={close} onBack={()=>setView('cart')} onPrepared={prepared} orderClient={orderClient} onRegistered={onRegistered} onRefresh={reloadMenu}/>}{view==='registered'&&registered&&<RegisteredSheet key="registered" order={registered} orderClient={orderClient} onUpdate={setRegistered} onClose={close} onNew={newOrder}/>}{view==='receipt'&&draft&&<ReceiptSheet key="receipt" draft={draft} saved={draftSaved} onClose={close} onCart={()=>setView('cart')}/>}{view==='info'&&<Sheet key="info" title="Así de sencillo" onClose={close}><div className="sheet-scroll info-content"><p><b>1. Arma tu pedido.</b> Elige productos y dinos a qué hora te gustaría recoger.</p><p><b>2. Transfiere al menos el 50%.</b> Envía el comprobante por WhatsApp. El encargado verifica el pago y confirma la preparación y el horario.</p><p><b>3. Recoge y disfruta.</b> Liquida el saldo en efectivo, transferencia o tarjeta en el negocio.</p><div className="notice"><Info size={20}/><span>{publicDemo?'Demostración visual: arma un pedido, revisa su resumen y vuelve al menú. No se envía al restaurante ni se cobra.':business.apiAvailable?(business.acceptingOrders?'Registramos tu pedido antes de abrir WhatsApp. El encargado confirma el pago y el tiempo para recoger.':'El negocio tiene pausada la recepción de pedidos. Puedes guardar un borrador para revisarlo.'):'Sin conexión al servidor no registramos pedidos. Conservamos tu carrito.'}</span></div></div></Sheet>}{view==='contact'&&<Sheet key="contact" title="Un pedido a tu manera" onClose={close}><div className="sheet-scroll info-content"><MessageCircle className="contact-icon" size={38}/><h3>Hay antojos que se platican.</h3><p>Para pizzas fuera de las combinaciones del menú, el equipo confirmará ingredientes, disponibilidad y precio antes de cobrar.</p>{business.whatsapp?<a className="primary" target="_blank" rel="noreferrer" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent('Hola, me gustaría consultar una pizza personalizada.')}`}>Consultar por WhatsApp<ArrowRight size={18}/></a>:<p className="notice"><Info size={18}/>El WhatsApp del negocio estará disponible al configurar el piloto.</p>}</div></Sheet>}</AnimatePresence>
  </>;
}

function CustomerBoot(){
  const [state,setState]=useState(null);
  useEffect(()=>{let active=true;refreshMenu().then(()=>{if(active){document.title=`${business.name} · Para recoger`;setState({error:''});}}).catch(e=>{business.apiAvailable=false;if(active)setState({error:e.message});});return()=>{active=false;};},[]);
  return !state?<div className="boot-screen"><Flame size={30}/><p>Cargando tu próximo antojo…</p></div>:state.error?<div className="boot-screen"><Info size={30}/><h1>No pudimos cargar la carta</h1><p>Tu carrito se conserva. Necesitamos conexión para consultar el menú y registrar pedidos.</p><button className="primary" onClick={()=>location.reload()}>Reintentar conexión</button></div>:<App/>;
}
const AdminApp = React.lazy(()=>import('./admin.jsx'));
createRoot(document.getElementById('root')).render(!publicDemo && location.pathname==='/admin'?<React.Suspense fallback={<p className="admin-stage">Cargando panel…</p>}><AdminApp/></React.Suspense>:<CustomerBoot/>);

if(import.meta.env.PROD && !publicDemo && 'serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

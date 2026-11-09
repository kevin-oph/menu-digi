import { catalog, pizzaExtras } from './catalog.mjs';
export const money = cents => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
export const minimumDeposit = total => Math.ceil(total / 2);
export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const pickupLabel = value => value === 'asap' ? 'Lo antes posible · tiempo por confirmar' : value;

export function inspectCart(lines){
  const items=lines.map(line=>{try{return {...quoteLine(line),valid:true};}catch(e){return {...line,title:catalog.find(p=>p.id===line.productId)?.name||'Producto por revisar',details:[e.message],total:null,valid:false};}});
  const valid=items.every(item=>item.valid);
  return {items,valid,count:items.reduce((sum,item)=>sum+item.quantity,0),total:valid?items.reduce((sum,item)=>sum+item.total,0):null,deposit:valid?minimumDeposit(items.reduce((sum,item)=>sum+item.total,0)):null};
}

export function quoteLine(config) {
  const p = catalog.find(p => p.id === config.productId && p.available);
  if (!p) throw new Error('Este producto ya no está disponible.');
  if(config.productVersion&&p.version&&config.productVersion!==p.version)throw new Error('Este producto se actualizó. Vuelve a elegir su presentación y opciones.');
  const variant = p.variants[config.variantIndex];
  if (!variant) throw new Error('Elige una presentación válida.');
  if (!Number.isInteger(config.quantity) || config.quantity < 1 || config.quantity > 30) throw new Error('La cantidad debe estar entre 1 y 30.');
  let unit = variant.price;
  let title = p.name;
  if (config.halfId) {
    const half = catalog.find(x => x.id === config.halfId && x.available && x.category === 'pizzas');
    if (p.category !== 'pizzas' || !half || !half.variants[config.variantIndex]) throw new Error('Elige dos especialidades de pizza.');
    if(config.halfVersion&&half.version&&config.halfVersion!==half.version)throw new Error('La segunda mitad se actualizó. Vuelve a elegirla.');
    unit = Math.max(unit, half.variants[config.variantIndex].price);
    title = `${p.name} / ${half.name}`;
  }
  const extras = config.extras || [];
  if (new Set(extras).size !== extras.length || extras.some(x => !pizzaExtras.includes(x)) || (extras.length && p.category !== 'pizzas')) throw new Error('Revisa los ingredientes extra.');
  unit += extras.length * 3000;
  const selections = config.selections || {};
  for (const choice of p.choices || []) if (!choice.values.includes(selections[choice.label])) throw new Error(`Elige: ${choice.label}.`);
  const notes = String(config.notes || '').trim();
  if (notes.length > 180) throw new Error('La nota puede tener hasta 180 caracteres.');
  const details = [variant.name !== 'Regular' ? variant.name : '', ...Object.entries(selections).filter(([label]) => p.choices?.some(c => c.label === label)).map(([k,v]) => `${k}: ${v}`), extras.length ? `Extras en toda la pizza: ${extras.join(', ')}` : '', notes ? `Nota: ${notes}` : ''].filter(Boolean);
  return { ...config, title, details, unit, total: unit * config.quantity, image: p.image, category: p.category };
}

export function summarize(lines, payFull = false) {
  const items = lines.map(quoteLine);
  const total = items.reduce((sum,line) => sum + line.total, 0);
  const deposit = payFull ? total : minimumDeposit(total);
  return { items, total, deposit, balance: total - deposit, count: items.reduce((sum,x) => sum+x.quantity,0) };
}

const safe = value => String(value || '').replace(/[\r\n*_~`]/g,' ').trim();
export function whatsappMessage(lines, customer, payFull = false) {
  const order = summarize(lines, payFull);
  return [
    '🍕 *NUEVO PEDIDO PARA RECOGER*', '*Pizzetas Artesanales*', '────────────────────',
    `👤 *Cliente:* ${safe(customer.name)}`, `📞 *Teléfono:* ${safe(customer.phone)}`, `⏰ *Recolección solicitada:* ${safe(pickupLabel(customer.pickup))}`,
    '', '🛍️ *DETALLE DEL PEDIDO*',
    ...order.items.map(item => `• ${item.quantity}x ${item.title} — ${money(item.total)}${item.details.length ? '\n  '+item.details.map(safe).join(' · ') : ''}`),
    '', `💰 *Total:* ${money(order.total)} MXN`, `💳 *Transferencia a realizar:* ${money(order.deposit)} (${payFull ? '100%' : 'anticipo mínimo 50%'})`,
    `*Saldo después de validar ese importe:* ${money(order.balance)}`,
    order.balance ? '*Liquidación al recoger:* efectivo, transferencia o tarjeta.' : '',
    '', '*Estado:* Pendiente de comprobante y validación humana.',
    '📌 Adjunta la foto o captura del comprobante de transferencia. La preparación inicia cuando el encargado confirme haber recibido al menos el 50% del total.',
    'El horario de recolección está sujeto a confirmación del negocio.',
  ].filter(x=>x!=='').join('\n');
}

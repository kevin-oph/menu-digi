import { summarize, whatsappMessage } from './order.mjs';

export const draftKey = 'pizzetas-last-preview-v1';
export const draftLifetime = 24 * 60 * 60 * 1000;
const states = new Set(['test', 'handoff']);
const cents = value => Number.isSafeInteger(value) && value >= 0;

// Referencia privada del navegador, no folio de un pedido recibido por el restaurante.
export function createDraft(lines, customer, payFull, previous = null, kind = 'test', now = Date.now()) {
  if (!lines.length || lines.length > 60) throw new Error('Revisa los productos de tu pedido.');
  if (!states.has(kind)) throw new Error('Tipo de resumen inválido.');
  const cleanCustomer = { name: String(customer.name || '').trim(), phone: String(customer.phone || '').replace(/\D/g,''), pickup: String(customer.pickup || '') };
  if (cleanCustomer.name.length < 3 || cleanCustomer.name.length > 80 || !/^\d{10,15}$/.test(cleanCustomer.phone) || (cleanCustomer.pickup !== 'asap' && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cleanCustomer.pickup))) throw new Error('Revisa tus datos de recolección.');
  const quote = summarize(lines, Boolean(payFull));
  const items = quote.items.map(({ title, details, quantity, unit, total }) => ({ title, details: [...details], quantity, unit, total }));
  const intent = { customer: cleanCustomer, items, total: quote.total, deposit: quote.deposit, balance: quote.balance, payFull: Boolean(payFull), kind };
  const same = previous && validDraft(previous, now) && JSON.stringify(intent) === JSON.stringify({ customer: previous.customer, items: previous.items, total: previous.total, deposit: previous.deposit, balance: previous.balance, payFull: previous.payFull, kind: previous.kind });
  if (same) return previous;
  return { version: 1, id: globalThis.crypto.randomUUID(), createdAt: now, ...intent, message: whatsappMessage(lines, cleanCustomer, Boolean(payFull)) };
}

export function validDraft(draft, now = Date.now()) {
  try {
    if (!draft || draft.version !== 1 || !/^[0-9a-f-]{36}$/i.test(draft.id) || !states.has(draft.kind)) return false;
    if (!Number.isFinite(draft.createdAt) || draft.createdAt > now || now - draft.createdAt > draftLifetime) return false;
    if (!Array.isArray(draft.items) || !draft.items.length || draft.items.length > 60) return false;
    if (!draft.items.every(item => typeof item.title === 'string' && item.title.length <= 160 && Array.isArray(item.details) && item.details.every(d=>typeof d==='string' && d.length<=1000) && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 30 && cents(item.unit) && cents(item.total) && item.total === item.quantity * item.unit)) return false;
    if (![draft.total,draft.deposit,draft.balance].every(cents) || draft.items.reduce((sum,item)=>sum+item.total,0)!==draft.total) return false;
    if (typeof draft.payFull !== 'boolean' || draft.deposit !== (draft.payFull ? draft.total : Math.ceil(draft.total/2)) || draft.balance !== draft.total-draft.deposit) return false;
    const c = draft.customer;
    return typeof c.name === 'string' && c.name.length >= 3 && c.name.length <= 80 && /^\d{10,15}$/.test(c.phone) && (c.pickup === 'asap' || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(c.pickup)) && typeof draft.message === 'string' && draft.message.length < 50000;
  } catch { return false; }
}

export function loadDraft(storage, now = Date.now()) {
  try { const draft = JSON.parse(storage.getItem(draftKey) || 'null'); return validDraft(draft,now) ? draft : null; } catch { return null; }
}

export function saveDraft(storage, draft) {
  try { if (!validDraft(draft)) return false; storage.setItem(draftKey,JSON.stringify(draft)); return true; } catch { return false; }
}

export function downloadText(draft) {
  return `RESUMEN LOCAL — NO ES CONFIRMACIÓN DE PEDIDO NI DE PAGO\nReferencia local: ${draft.id}\n\n${draft.message}\n\nEl restaurante debe recibir tu pedido y validar el abono. Esta copia no acredita envío ni pago.\n`;
}

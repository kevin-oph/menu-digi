// El pedido sigue visible aunque el navegador bloquee o no responda al portapapeles.
export async function copyText(text, clipboard = globalThis.navigator?.clipboard, timeoutMs = 1800) {
  if (!clipboard?.writeText) return false;
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(clipboard.writeText(text)).then(() => true),
      new Promise(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

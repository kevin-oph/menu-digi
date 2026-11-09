const CACHE='pizzetas-shell-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/manifest.webmanifest','/app-icon.svg']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pizzetas-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // Pedidos, datos personales, acceso al panel y fotos siempre van a la red.
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/media/'))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match('/')));
    return;
  }
  if(url.pathname.startsWith('/assets/'))event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(async cache=>{await cache.put(request,copy);const keys=await cache.keys();for(const key of keys.filter(k=>new URL(k.url).pathname.startsWith('/assets/')).slice(0,-40))await cache.delete(key);}));}return response;})));
});

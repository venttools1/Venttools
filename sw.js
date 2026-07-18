const CACHE='venttools-v7-0-engineering-database-beta-3';
const ASSETS=['/index.html','/style.css','/script.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/about.html','/contact.html','/privacy.html','/cookies.html','/terms.html','/disclaimer.html','/engineering.html','/data/manufacturer-registry.json','/data/audit-log.json'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put('/index.html',copy));
      return response;
    }).catch(()=>caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(request,copy));
    return response;
  })));
});

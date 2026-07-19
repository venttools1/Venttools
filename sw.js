const CACHE='venttools-v6-5-rc9-project-pack-live1';
const ASSETS=['/index.html','/style.css?v=6.5-rc9','/script.js?v=6.5-rc9-pack-live1','/manifest.webmanifest','/icon-192.png','/icon-512.png','/about.html','/contact.html','/privacy.html','/cookies.html','/terms.html','/disclaimer.html','/engineering.html','/site-sheet.html','/pack-builder.html','/data/manufacturer-registry.json','/data/audit-log.json','/data/bsb-engineering-database.json'];
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
  event.respondWith(
    fetch(request).then(response=>{
      if(response && response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }).catch(()=>caches.match(request).then(cached=>cached||caches.match('/index.html')))
  );
});

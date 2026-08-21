const CACHE='venttools-v2-0-5-20260821';
const CORE=[
  '/',
  '/ductwork-offset-calculator/',
  '/round-rectangular-duct-converter/',
  '/fire-damper-opening-calculator/',
  '/style.css?v=2.0.5',
  '/v2.css?v=2.0.5',
  '/script.js?v=2.0.5',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/assets/venttools-k-fan-logo.webp',
  '/assets/site-offset.webp',
  '/assets/site-square-to-round.webp',
  '/assets/site-fire-damper.webp'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy));
          return response;
        })
        .catch(()=>caches.match(request).then(cached=>cached||caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>cached||fetch(request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }))
  );
});

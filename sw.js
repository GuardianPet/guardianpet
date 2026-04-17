self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open('guardianpet-v1').then(function(cache){
      return cache.addAll(['/', '/index.html', '/css/styles.css', '/js/app.js']);
    })
  );
});

self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(response){
      return response || fetch(e.request);
    })
  );
});
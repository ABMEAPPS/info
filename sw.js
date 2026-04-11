/**
 * Athena — The Configurator
 * sw.js — Service Worker
 * Version: 0.3.4.0
 * Copyright 2026 by Alan H. Jordan | All Rights Reserved | Digital and Otherwise
 */

var CACHE_NAME = 'athena-v0.3.4.0';
var SHELL_FILES = [
  './',
  'index.html',
  'shared.js',
  'interview-data.js',
  'components.js',
  'tour-view.js',
  'interview-view.js',
  'tier2-view.js',
  'finalize-view.js',
  'settings-view.js',
  'credentials-view.js',
  'dashboard-view.js',
  'profile-view.js',
  'app.js',
  'manifest.json',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  // Skip API calls — always go to network
  if (url.pathname.startsWith('/v1/') || url.hostname !== location.hostname) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).catch(function() {
        return caches.match('index.html');
      });
    })
  );
});

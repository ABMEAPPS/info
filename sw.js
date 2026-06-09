'use strict';
// ═══════════════════════════════════════════════════════════
// sw.js — UUFNN Media Hub Service Worker
//
// Strategy: cache-first for same-origin assets, network-only
// for cross-origin (Cloudflare Worker API calls). Versioned
// cache — bump CACHE_VERSION in lockstep with APP_VERSION in
// index.html whenever files change.
//
// Update flow:
//   1. User reloads → browser fetches sw.js, detects byte change.
//   2. New SW installs, pre-caches assets, enters WAITING state.
//   3. 'updatefound' fires → update banner appears in app.
//   4. User taps "Update now" → SKIP_WAITING → SW activates
//      → 'controllerchange' → page reloads → new version live.
// ═══════════════════════════════════════════════════════════

var CACHE_VERSION = '0.3.3';
var CACHE_NAME    = 'uufnn-media-hub-' + CACHE_VERSION;
var CACHE_PREFIX  = 'uufnn-media-hub-';

var CACHE_URLS = [
  './',
  './index.html?v=0.3.3',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_URLS);
    }).catch(function(err) {
      console.error('[SW] install/precache failed:', err);
      throw err;
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        if (name.indexOf(CACHE_PREFIX) === 0 && name !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        }
        return null;
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); }
  catch (e) { return; }

  // Network-only for cross-origin (Cloudflare Worker, etc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(resp) {
        if (resp && resp.ok && resp.type === 'basic') {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(req, clone).catch(function() {});
          });
        }
        return resp;
      }).catch(function(err) {
        console.error('[SW] fetch failed:', req.url, err);
        throw err;
      });
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

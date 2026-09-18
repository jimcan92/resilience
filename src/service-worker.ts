/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

// Type cast — malikayan ang ServiceWorkerGlobalScope error
const sw = self as unknown as any;

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

// ---------- Install ----------
sw.addEventListener('install', (event: any) => {
	event.waitUntil(caches.open(CACHE).then((cache: any) => cache.addAll(ASSETS)));
	// Force activate immediately
	sw.skipWaiting();
});

// ---------- Activate ----------
sw.addEventListener('activate', (event: any) => {
	event.waitUntil(
		caches.keys().then(async (keys: string[]) => {
			for (const key of keys) {
				if (key !== CACHE) {
					await caches.delete(key);
				}
			}
		})
	);
	// Take control of all clients immediately
	sw.clients.claim();
});

// ---------- Fetch ----------
sw.addEventListener('fetch', (event: any) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Skip non-same-origin requests (Google tiles, etc.)
	if (url.origin !== sw.location.origin) return;

	// Network-first for HTML navigation
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.then((response: any) => {
					const clone = response.clone();
					caches.open(CACHE).then((cache: any) => cache.put(event.request, clone));
					return response;
				})
				.catch(() => caches.match(event.request).then((r: any) => r || caches.match('/')))
		);
		return;
	}

	// Cache-first for assets
	event.respondWith(
		caches.match(event.request).then((cached: any) => {
			if (cached) return cached;
			return fetch(event.request).then((response: any) => {
				if (response.status === 200) {
					const clone = response.clone();
					caches.open(CACHE).then((cache: any) => cache.put(event.request, clone));
				}
				return response;
			});
		})
	);
});

// ---------- Message (for skip-waiting) ----------
sw.addEventListener('message', (event: any) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		sw.skipWaiting();
	}
});

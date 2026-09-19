<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import Header from '$lib/components/Header.svelte';
	import { appStatus } from '$lib/states/status.svelte';
	import { onMount } from 'svelte';
	import './layout.css';

	onMount(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready.then((registration) => {
				// Check for updates every 60 seconds
				setInterval(() => {
					registration.update();
				}, 60000);

				// Listen for new service worker
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing;
					if (!newWorker) return;

					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							// New version available — reload
							if (confirm('New version available. Reload to update?')) {
								newWorker.postMessage({ type: 'SKIP_WAITING' });
								window.location.reload();
							}
						}
					});
				});
			});

			// Listen for controller change (new SW activated)
			let refreshing = false;
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (!refreshing) {
					refreshing = true;
					window.location.reload();
				}
			});
		}
	});

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="bg-blueprint-grid flex min-h-screen flex-col bg-base-200">
	<Header />

	<main class="container mx-auto max-w-5xl flex-1 p-4">
		{@render children()}
	</main>

	<footer
		class="footer footer-center grid-cols-1 border-t border-base-300 bg-base-100 p-4 text-base-content/60"
	>
		<div class="flex flex-col gap-0 text-center">
			<p class="text-xs">
				Preliminary assessment tool only. Not a substitute for professional structural engineering.
			</p>
			<p class="text-xs">
				Fault data from
				<a
					href="https://hazardhunter.georisk.gov.ph/map"
					target="_blank"
					rel="noopener"
					class="link link-primary"
				>
					HazardHunterPH
				</a>
				• Wind data from PAGASA
			</p>
			<p class="mt-2 text-xs">
				&copy; 2026 | Developed by
				<a href="https://jimcan.net" target="_blank" rel="noopener" class="link link-primary">
					jiMcaN
				</a>
				| Hosted in
				<a href="https://vercel.com" target="_blank" rel="noopener" class="link link-primary">
					Vercel
				</a>
			</p>
		</div>
	</footer>
</div>

{#if appStatus.alert}
	<div class="toast toast-end toast-bottom z-50">
		<div
			role="status"
			class="alert shadow-lg"
			class:alert-error={appStatus.alert.type === 'error'}
			class:alert-success={appStatus.alert.type === 'success'}
			class:alert-info={appStatus.alert.type === 'info'}
			class:alert-warning={appStatus.alert.type === 'warning'}
		>
			<span class="text-sm">{appStatus.alert.message}</span>
			<button
				type="button"
				class="btn btn-ghost btn-xs"
				onclick={appStatus.remove}
				aria-label="Dismiss"
			>
				✕
			</button>
		</div>
	</div>
{/if}

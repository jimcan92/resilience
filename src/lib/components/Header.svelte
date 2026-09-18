<script lang="ts">
	import { page } from '$app/state';
	import ThemeController from './ThemeController.svelte';

	let currentPath = $derived(page.url.pathname);
</script>

<header class="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 backdrop-blur">
	<div class="container mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
		<a href="/" class="flex items-center gap-3">
			<img
				src="/android/launchericon-192x192.png"
				alt="R.E.S.I.L.I.E.N.C.E."
				class="h-9 w-9 rounded-md"
			/>
			<div>
				<h1
					class="font-display text-lg leading-tight font-semibold tracking-tight text-base-content"
				>
					R.E.S.I.L.I.E.N.C.E.
				</h1>
				<span class="text-xs text-base-content/60">Building resilience calculator</span>
			</div>
		</a>

		<nav class="flex items-center gap-1">
			<a href="/" class="btn btn-sm {currentPath === '/' ? 'btn-primary' : 'btn-ghost'}">
				Assess
			</a>
			<a
				href="/history"
				class="btn btn-sm {currentPath === '/history' ? 'btn-primary' : 'btn-ghost'}"
			>
				History
			</a>
		</nav>
		<ThemeController />
	</div>
</header>

<script lang="ts">
	import { page } from '$app/state';
	import { ChartCandlestick, RotateCcwClock } from '@lucide/svelte';
	import ThemeController from './ThemeController.svelte';

	let currentPath = $derived(page.url.pathname);
</script>

<header class="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 backdrop-blur">
	<div class="container mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
		<a href="/" class="flex items-center gap-2">
			<img
				src="/android/launchericon-192x192.png"
				alt="R.E.S.I.L.I.E.N.C.E."
				class="h-9 w-9 rounded-md"
			/>
			<div class="flex flex-col">
				<h1 class="font-display text-lg leading-tight font-semibold tracking-tight text-primary">
					R.E.S.I.L.I.E.N.C.E.
				</h1>
				<span class="text-xs text-base-content/60">Building resilience calculator</span>
			</div>
		</a>

		<nav class="ml-auto flex items-center gap-1 md:ml-0">
			<a
				href="/"
				class="btn btn-circle btn-primary md:btn-block {currentPath !== '/' && 'btn-outline'}"
			>
				<span class="hidden md:block">Assess</span>
				<span class="md:hidden">
					<ChartCandlestick
						class="h-5 w-5 {currentPath === '/' ? 'text-primary-content' : 'text-primary'}"
					/>
				</span>
			</a>
			<a
				href="/history"
				class="btn btn-circle btn-primary md:btn-block {currentPath !== '/history' &&
					'btn-outline'}"
			>
				<span class="hidden md:block">History</span>
				<span class="md:hidden">
					<RotateCcwClock
						class="h-5 w-5 {currentPath === '/history' ? 'text-primary-content' : 'text-primary'}"
					/>
				</span>
			</a>
		</nav>
		<ThemeController />
	</div>
</header>

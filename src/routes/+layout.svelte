<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';
	import './layout.css';

	onMount(() => {
		themeChange();
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
		class="footer footer-center border-t border-base-300 bg-base-100 p-4 text-base-content/60"
	>
		<div class="text-center">
			<p class="text-xs">
				Preliminary assessment tool only. Not a substitute for professional structural engineering.
			</p>
			<p class="mt-1 text-xs">
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
		</div>
	</footer>
</div>

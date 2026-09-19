<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import themes from 'daisyui/functions/themeOrder';
	import theme from 'daisyui/theme/object';

	let selectedTheme = $state<string>();

	$effect(() => {
		if (selectedTheme) {
			// I-save sa localStorage
			localStorage.setItem('theme', selectedTheme);
			// I-apply dayon sa HTML element
			document.documentElement.setAttribute('data-theme', selectedTheme);
		}
	});
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn btn-circle btn-outline btn-primary">
		{#if selectedTheme && theme[selectedTheme]['color-scheme'] == 'dark'}
			<Moon class="h-5 w-5" />
		{:else}
			<Sun class="h-5 w-5" />
		{/if}
	</div>
	<ul
		tabindex="-1"
		class="dropdown-content z-1 max-h-80 gap-2 space-y-1 overflow-auto rounded-box bg-base-300 p-2 shadow-2xl"
	>
		{#each themes as theme}
			<button
				data-theme={theme}
				class="w-full rounded hover:bg-base-200"
				onclick={() => {
					selectedTheme = theme;
				}}
			>
				<label class="flex cursor-pointer items-center gap-2 px-3 py-1">
					<input
						data-theme={theme}
						type="radio"
						name="theme-dropdown"
						class="theme-controller radio hidden radio-sm radio-primary"
						data-set-theme={theme}
						value={theme}
					/>
					<span class="w-2 self-stretch rounded bg-primary"></span>
					<span class="w-2 self-stretch rounded bg-secondary"></span>
					<span class="w-2 self-stretch rounded bg-accent"></span>
					<span class="w-2 self-stretch rounded bg-neutral"></span>
					<span class="rounded-box border border-primary px-3">{theme.toUpperCase()}</span>
				</label>
			</button>
		{/each}
	</ul>
</div>

<script lang="ts">
	import themes from 'daisyui/functions/themeOrder';
</script>

<div class="dropdown dropdown-end">
	<div tabindex="0" role="button" class="btn m-1">
		Theme
		<svg
			width="12px"
			height="12px"
			class="inline-block h-2 w-2 fill-current opacity-60"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 2048 2048"
		>
			<path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
		</svg>
	</div>
	<ul
		tabindex="-1"
		class="dropdown-content z-1 max-h-80 gap-2 space-y-1 overflow-auto rounded-box bg-base-300 p-2 shadow-2xl"
	>
		{#each themes as theme}
			<li data-theme={theme} class="rounded hover:bg-base-200">
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
					<span class="rounded-box border border-primary px-3 py-1">{theme.toUpperCase()}</span>
				</label>
			</li>
		{/each}
	</ul>
</div>

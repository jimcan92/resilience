<script lang="ts">
	let {
		options,
		value = $bindable(''),
		columnsClass = 'grid-cols-2'
	}: {
		options: { value: string; label: string }[];
		value: string;
		columnsClass?: string;
	} = $props();
</script>

<div class="grid gap-2 {columnsClass}">
	{#each options as opt}
		<button
			type="button"
			onclick={() => (value = opt.value)}
			aria-pressed={value === opt.value}
			class="rounded-md border px-3 py-2 text-sm font-medium transition-colors
				{value === opt.value
				? 'border-primary bg-primary text-primary-content'
				: 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/50'}"
		>
			{opt.label}
		</button>
	{/each}
</div>

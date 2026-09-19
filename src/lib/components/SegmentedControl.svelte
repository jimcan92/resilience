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
			class="btn btn-primary
				{value !== opt.value && 'btn-outline'}"
		>
			{opt.label}
		</button>
	{/each}
</div>

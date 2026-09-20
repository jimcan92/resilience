<script lang="ts">
	let {
		options,
		value = $bindable('')
	}: {
		options: { value: string; label: string }[];
		value: string;
	} = $props();
</script>

<div class="join w-full">
	{#each options as opt}
		<button
			type="button"
			onclick={() => (value = opt.value)}
			aria-pressed={value === opt.value}
			class="btn join-item flex-1 btn-primary
				{value !== opt.value && 'btn-outline'}"
		>
			{opt.label}
		</button>
	{/each}
</div>

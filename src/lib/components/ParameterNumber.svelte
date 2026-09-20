<script lang="ts">
	let {
		name,
		label,
		hint,
		value = $bindable(0),
		error
	}: {
		name: string;
		label: string;
		hint: string;
		value: number;
		error?: string;
	} = $props();
</script>

<fieldset class="fieldset">
	<label for={'parameter-' + name} class="label">{label}</label>
	<input
		id={'parameter-' + name}
		type="number"
		step="any"
		bind:value
		class="input-bordered input w-full"
		aria-invalid={!!error}
		aria-describedby={'parameter-hint-' + name}
	/>
	<p id={'parameter-hint-' + name} class="text-xs text-base-content/70">{hint}</p>
	{#if error}<p role="alert" class="text-xs text-error">{error}</p>{/if}
</fieldset>

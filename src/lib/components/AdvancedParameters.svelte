<script lang="ts">
	import type { AssessmentInput, ModelParameters } from '$lib/types';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import ParameterNumber from '$lib/components/ParameterNumber.svelte';
	import soilFactors from '$lib/data/soil-factors.json';
	import { getBuildingWindCapacity, getKz } from '$lib/engine/wind';
	let {
		input,
		parameters = $bindable(),
		section,
		errors
	}: {
		input: AssessmentInput;
		parameters: ModelParameters;
		section: 'site' | 'hazard';
		errors: Record<string, string>;
	} = $props();
	const modes = [
		{ value: 'default', label: 'Default' },
		{ value: 'custom', label: 'Custom' }
	];
	let capacity = $derived(getBuildingWindCapacity(input.building));
	let kz = $derived.by(() => {
		try {
			return getKz(input.building.height, input.hazard.exposure ?? 'C').toFixed(3);
		} catch {
			return 'Enter a supported height (greater than 0, up to 150 m)';
		}
	});
	let hasErrors = $derived(
		Object.keys(errors).some((key) =>
			section === 'site'
				? ['soilMultiplier', 'soilMode'].includes(key)
				: [
						'kzt',
						'kd',
						'theta',
						'beta',
						'damageState',
						'reference',
						'pgaMin',
						'pgaMax',
						'earthquakeWeight',
						'fragilityMode'
					].includes(key)
		)
	);
</script>

<details class="rounded-lg border border-base-300 p-4" open={hasErrors}>
	<summary class="cursor-pointer font-medium"
		>Advanced parameters — {section === 'site' ? 'soil' : 'wind, fragility and scoring'}</summary
	>
	<div class="mt-4 space-y-5">
		{#if section === 'site'}
			<fieldset class="space-y-2">
				<legend class="mb-2 text-sm">Soil multiplier mode</legend>
				<SegmentedControl options={modes} bind:value={parameters.soilMode} />
			</fieldset>
			{#if parameters.soilMode === 'custom'}
				<ParameterNumber
					name="soilMultiplier"
					label="Soil multiplier"
					hint="Dimensionless, greater than zero. User supplied; changing soil type will not change this value."
					bind:value={parameters.soilMultiplier}
					error={errors.soilMultiplier}
				/>
			{:else}
				<p class="text-sm">
					Soil multiplier: <strong>{soilFactors[input.site.soilType]}</strong> — illustrative
					default for {input.site.soilType} soil.
				</p>
			{/if}
		{:else}
			<div class="grid gap-4 sm:grid-cols-2">
				<ParameterNumber
					name="kzt"
					label="Topographic factor Kzt"
					hint="At least 1. Default 1 models no topographic amplification; use a site-supported value when applicable."
					bind:value={parameters.kzt}
					error={errors.kzt}
				/>
				<ParameterNumber
					name="kd"
					label="Directionality factor Kd"
					hint="Greater than 0, up to 1. Default 0.85 for the current building procedure."
					bind:value={parameters.kd}
					error={errors.kd}
				/>
			</div>
			<p class="text-sm">
				Computed exposure coefficient Kz: <strong>{kz}</strong> (height and exposure; read-only).
			</p>
			<fieldset class="space-y-2">
				<legend class="mb-2 text-sm">Fragility parameter mode</legend>
				<SegmentedControl options={modes} bind:value={parameters.fragilityMode} />
			</fieldset>
			{#if parameters.fragilityMode === 'custom'}
				<p class="text-sm">
					User-supplied curve for velocity pressure qz in Pa. Material, roof and configuration
					multipliers are not applied to custom θ.
				</p>
				<div class="grid gap-4 sm:grid-cols-2">
					<ParameterNumber
						name="theta"
						label="Median capacity θ (Pa)"
						hint="Positive median for the stated damage state, using velocity pressure as the intensity measure."
						bind:value={parameters.theta}
						error={errors.theta}
					/>
					<ParameterNumber
						name="beta"
						label="Dispersion β"
						hint="Positive, dimensionless lognormal dispersion."
						bind:value={parameters.beta}
						error={errors.beta}
					/>
				</div>
				<label class="block space-y-1"
					><span class="text-sm font-medium">Damage-state description</span>
					<input
						class="input-bordered input w-full"
						bind:value={parameters.damageState}
						aria-invalid={!!errors.damageState}
					/>
				</label>
				{#if errors.damageState}<p role="alert" class="text-xs text-error">
						{errors.damageState}
					</p>{/if}
				<label class="block space-y-1"
					><span class="text-sm font-medium">Curve source / reference</span>
					<textarea
						class="textarea-bordered textarea w-full"
						bind:value={parameters.reference}
						aria-invalid={!!errors.reference}></textarea>
				</label>
				{#if errors.reference}<p role="alert" class="text-xs text-error">{errors.reference}</p>{/if}
				<p class="text-xs text-base-content/70">
					References are recorded as supplied, not independently validated.
				</p>
			{:else}
				<p class="text-sm">
					Illustrative θ = <strong>{capacity.theta} Pa</strong>, β =
					<strong>{capacity.beta}</strong>. Follows material, roof and configuration. Damage state
					unspecified; no calibrated source.
				</p>
			{/if}
			<div class="grid gap-4 sm:grid-cols-2">
				<ParameterNumber
					name="pgaMin"
					label="PGA minimum (g)"
					hint="Lower normalization bound, at least zero. Default 0 g."
					bind:value={parameters.pgaMin}
					error={errors.pgaMin}
				/>
				<ParameterNumber
					name="pgaMax"
					label="PGA maximum (g)"
					hint="Must exceed the minimum. Default 0.8 g is an illustrative scoring bound."
					bind:value={parameters.pgaMax}
					error={errors.pgaMax}
				/>
				<ParameterNumber
					name="earthquakeWeight"
					label="Earthquake weight (%)"
					hint="0–100%. Default 50%; typhoon weight is the remainder."
					bind:value={parameters.earthquakeWeight}
					error={errors.earthquakeWeight}
				/>
				<p class="self-center text-sm">
					Typhoon weight: {Number.isFinite(parameters.earthquakeWeight)
						? 100 - parameters.earthquakeWeight
						: '—'}%
				</p>
			</div>
		{/if}
	</div>
</details>

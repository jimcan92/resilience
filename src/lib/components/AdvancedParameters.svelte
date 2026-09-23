<script lang="ts">
	import ParameterNumber from '$lib/components/ParameterNumber.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import soilFactors from '$lib/data/soil-factors.json';
	import { getKz, referenceWindBounds } from '$lib/engine/wind';
	import type { AssessmentInput, ModelParameters } from '$lib/types';
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
	let bounds = $derived.by(() => {
		try {
			return referenceWindBounds(
				parameters.windSpeedMin,
				parameters.windSpeedMax,
				parameters.windReferenceHeight
			);
		} catch {
			return null;
		}
	});
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
						'windReferenceHeight',
						'windSpeedMin',
						'windSpeedMax',
						'pgaMin',
						'pgaMax',
						'earthquakeWeight'
					].includes(key)
		)
	);
</script>

<details class="rounded-lg border border-base-300 p-4" open={hasErrors}>
	<summary class="cursor-pointer font-medium"
		>Advanced parameters — {section === 'site' ? 'soil' : 'wind and scoring'}</summary
	>
	<div class="mt-4 space-y-5">
		{#if section === 'site'}
			<fieldset class="fieldset">
				<legend class="label">Soil multiplier mode</legend>
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
			<div class="grid gap-4 sm:grid-cols-2">
				<ParameterNumber
					name="windSpeedMin"
					label="Minimum reference wind speed (km/h)"
					hint="At least zero. Researcher-supplied default: 61 km/h."
					bind:value={parameters.windSpeedMin}
					error={errors.windSpeedMin}
				/>
				<ParameterNumber
					name="windSpeedMax"
					label="Maximum reference wind speed (km/h)"
					hint="Must exceed the minimum. Researcher-supplied default: 315 km/h."
					bind:value={parameters.windSpeedMax}
					error={errors.windSpeedMax}
				/>
			</div>
			<ParameterNumber
				name="windReferenceHeight"
				label="Reference height (m)"
				hint="Height used only to convert reference wind-speed bounds to pressure. Default 10 m; this is not the building height."
				bind:value={parameters.windReferenceHeight}
				error={errors.windReferenceHeight}
			/>
			<p class="text-sm">
				Reference pressure uses {parameters.windReferenceHeight ?? 10} m height, Exposure C, Kzt = 1,
				and Kd = 0.85. This reference height is independent of the actual building height above.
			</p>
			{#if bounds}<p class="text-sm">
					Derived reference pressure: {bounds.windPressureMin.toFixed(
						1
					)}–{bounds.windPressureMax.toFixed(1)} Pa ({(bounds.windPressureMin / 1000).toFixed(3)}–{(
						bounds.windPressureMax / 1000
					).toFixed(3)} kPa).
				</p>{/if}
			<p class="text-xs text-base-content/70">
				The scientific source of the default speed bounds has not been verified. Custom bounds are
				user supplied. This normalization measures relative wind pressure, not damage probability.
			</p>

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

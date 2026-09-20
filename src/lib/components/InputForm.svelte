<script lang="ts">
	import AdvancedParameters from '$lib/components/AdvancedParameters.svelte';
	import MapPicker from '$lib/components/MapPicker.svelte';
	import ParameterSummary from '$lib/components/ParameterSummary.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import StepIndicator from '$lib/components/StepIndicator.svelte';
	import {
		defaultModelParameters,
		parameterErrors,
		resolveModelParameters
	} from '$lib/engine/parameters';
	import type { AssessmentInput } from '$lib/types';

	let { onSubmit }: { onSubmit: (input: AssessmentInput) => void } = $props();

	let form = $state<
		AssessmentInput & {
			hazard: AssessmentInput['hazard'] & {
				exposure: NonNullable<AssessmentInput['hazard']['exposure']>;
			};
		}
	>({
		site: {
			latitude: 9.865416,
			longitude: 123.394688,
			faultDistance: 10,
			soilType: 'medium'
		},
		building: {
			height: 12,
			floors: 3,
			length: 20,
			width: 15,
			material: 'concrete',
			roofType: 'gable',
			configuration: 'regular'
		},
		hazard: {
			windSpeed: 250,
			magnitude: 7.0,
			exposure: 'C'
		}
	});

	let parameters = $state(defaultModelParameters());
	let preview = $derived.by(() => {
		try {
			return resolveModelParameters({ ...form, modelParameters: parameters });
		} catch {
			return null;
		}
	});
	const steps = ['Site', 'Building', 'Hazard', 'Review'];

	let currentStep = $state(0);
	let maxReached = $state(0);

	type Errors = Record<string, string>;
	let errors = $state<Errors>({});

	const soilTypeOptions = [
		{ value: 'rock', label: 'Rock' },
		{ value: 'medium', label: 'Medium soil' },
		{ value: 'soft', label: 'Soft soil' }
	];

	const materialOptions = [
		{ value: 'concrete', label: 'Reinforced concrete' },
		{ value: 'steel', label: 'Structural steel' },
		{ value: 'timber', label: 'Timber' },
		{ value: 'masonry', label: 'Masonry' }
	];

	const roofTypeOptions = [
		{ value: 'flat', label: 'Flat' },
		{ value: 'gable', label: 'Gable' },
		{ value: 'hip', label: 'Hip' },
		{ value: 'monoslope', label: 'Monoslope' }
	];

	const configurationOptions = [
		{ value: 'regular', label: 'Regular' },
		{ value: 'irregular', label: 'Irregular' }
	];

	const exposureOptions = [
		{ value: 'B', label: 'Exposure B (Urban/Suburban)' },
		{ value: 'C', label: 'Exposure C (Open terrain)' },
		{ value: 'D', label: 'Exposure D (Coastal/Flat water)' }
	];

	const soilTypeLabels: Record<string, string> = Object.fromEntries(
		soilTypeOptions.map((o) => [o.value, o.label])
	);
	const materialLabels: Record<string, string> = Object.fromEntries(
		materialOptions.map((o) => [o.value, o.label])
	);
	const roofTypeLabels: Record<string, string> = Object.fromEntries(
		roofTypeOptions.map((o) => [o.value, o.label])
	);
	const configurationLabels: Record<string, string> = Object.fromEntries(
		configurationOptions.map((o) => [o.value, o.label])
	);
	const exposureLabels: Record<string, string> = Object.fromEntries(
		exposureOptions.map((o) => [o.value, o.label])
	);

	function validateSite(): Errors {
		const e: Errors = {};
		const fd = form.site.faultDistance;
		if (!Number.isFinite(fd) || fd < 0) {
			e.faultDistance = 'Enter the distance to the nearest active fault (0 or more km).';
		}
		const pe = parameterErrors(parameters);
		if (pe.soilMultiplier) e.soilMultiplier = pe.soilMultiplier;
		return e;
	}

	function validateBuilding(): Errors {
		const e: Errors = {};
		if (
			!Number.isFinite(form.building.height) ||
			form.building.height <= 0 ||
			form.building.height > 150
		) {
			e.height = 'Height must be greater than 0 and no more than 150 m.';
		}
		if (
			!form.building.floors ||
			form.building.floors < 1 ||
			!Number.isInteger(form.building.floors)
		) {
			e.floors = 'Enter a whole number of floors (1 or more).';
		}
		if (!Number.isFinite(form.building.length) || form.building.length <= 0) {
			e.length = 'Length must be greater than 0.';
		}
		if (!Number.isFinite(form.building.width) || form.building.width <= 0) {
			e.width = 'Width must be greater than 0.';
		}
		return e;
	}

	function validateHazard(): Errors {
		const e: Errors = {};
		if (!Number.isFinite(form.hazard.windSpeed) || form.hazard.windSpeed <= 0) {
			e.windSpeed = 'Enter a design wind speed greater than 0.';
		}
		const mag = form.hazard.magnitude;
		if (mag === null || mag === undefined || !Number.isFinite(mag) || mag < 0.1 || mag > 9.5) {
			e.magnitude = 'Enter a magnitude between 0.1 and 9.5.';
		}
		for (const [key, message] of Object.entries(parameterErrors(parameters))) {
			if (key !== 'soilMultiplier' && key !== 'soilMode') e[key] = message;
		}
		return e;
	}

	function validateStep(step: number): Errors {
		if (step === 0) return validateSite();
		if (step === 1) return validateBuilding();
		if (step === 2) return validateHazard();
		return {};
	}

	function goNext() {
		const stepErrors = validateStep(currentStep);
		errors = stepErrors;
		if (Object.keys(stepErrors).length > 0) return;
		if (currentStep < steps.length - 1) {
			currentStep += 1;
			maxReached = Math.max(maxReached, currentStep);
		}
	}

	function goBack() {
		errors = {};
		if (currentStep > 0) currentStep -= 1;
	}

	function goToStep(index: number) {
		if (index > maxReached) return;
		errors = {};
		currentStep = index;
	}

	function handleFinalSubmit(e: SubmitEvent) {
		e.preventDefault();

		const siteErrors = validateSite();
		const buildingErrors = validateBuilding();
		const hazardErrors = validateHazard();
		const allErrors = { ...siteErrors, ...buildingErrors, ...hazardErrors };

		if (Object.keys(allErrors).length > 0) {
			errors = allErrors;
			if (Object.keys(siteErrors).length) currentStep = 0;
			else if (Object.keys(buildingErrors).length) currentStep = 1;
			else currentStep = 2;
			maxReached = Math.max(maxReached, currentStep);
			return;
		}

		onSubmit({ ...form, modelParameters: parameters });
	}

	function openHazardHunter() {
		const url = `https://hazardhunter.georisk.gov.ph/map?lat=${form.site.latitude}&lng=${form.site.longitude}`;
		window.open(url, '_blank', 'noopener');
	}
</script>

<div class="space-y-6 py-6">
	<div class="rounded-lg border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6">
		<StepIndicator {steps} {currentStep} {maxReached} onStepClick={goToStep} />
	</div>

	<form novalidate onsubmit={handleFinalSubmit} class="space-y-6">
		{#if currentStep === 0}
			<div class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-5">
					<div>
						<h2 class="font-display text-lg font-semibold">Site information</h2>
						<p class="text-sm text-base-content/60">Set the location and ground conditions.</p>
					</div>

					<MapPicker bind:latitude={form.site.latitude} bind:longitude={form.site.longitude} />

					<!-- <fieldset>
						<span class="label"> Distance to nearest active fault </span> -->
					<!-- <p class="text-xs text-base-content/60">
							Open HazardHunterPH then in Location Tools open Long-Lat Coordinate. Input copied
							longitude and latitude then click search. When the location is found, the assessment
							panel will show in the right, find the 'Nearest Active Fault' and copy the value in
							km, then paste below.
						</p> -->

					<div class="flex flex-col gap-2 md:flex-row md:items-end">
						<fieldset class="fieldset flex-1">
							<button
								type="button"
								onclick={openHazardHunter}
								class="group btn btn-outline btn-info md:flex-1"
							>
								HazardHunterPH
								<svg
									class="h-4 w-4 transform text-info transition-transform duration-200 group-hover:-translate-y-1 group-hover:text-info-content"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
										id="SVGRepo_tracerCarrier"
										stroke-linecap="round"
										stroke-linejoin="round"
									></g><g id="SVGRepo_iconCarrier">
										<path
											d="M7 17L17 7M17 7H8M17 7V16"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										></path>
									</g></svg
								>
							</button>
						</fieldset>
						<fieldset class="fieldset flex-1">
							<span class="label">Distance to nearest active fault</span>
							<label
								class="input-bordered input flex w-full items-center gap-2 {errors.faultDistance
									? 'input-error'
									: 'input-primary'}"
							>
								<input
									type="number"
									step="0.1"
									aria-label="Distance to nearest active fault in km"
									min="0"
									bind:value={form.site.faultDistance}
									placeholder="e.g., 5.2"
									class="grow"
								/>
								<span class="text-xs text-base-content/50">km</span>
							</label>
						</fieldset>
					</div>
					{#if errors.faultDistance}
						<span class="mt-1 block text-xs text-error">{errors.faultDistance}</span>
					{/if}
					<!-- </fieldset> -->

					<fieldset class="fieldset w-full">
						<span class="label">Soil type</span>
						<SegmentedControl options={soilTypeOptions} bind:value={form.site.soilType} />
					</fieldset>
				</div>
			</div>
			<AdvancedParameters input={form} bind:parameters section="site" {errors} />
		{:else if currentStep === 1}
			<div class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-6">
					<div>
						<h2 class="font-display text-lg font-semibold">Building information</h2>
						<p class="text-sm text-base-content/60">
							Describe the structure being assessed. Floors, length and width are recorded but do
							not affect the current equations.
						</p>
					</div>
					<div>
						<h3 class="mb-3 border-b border-base-300 pb-2 text-sm font-medium text-base-content/70">
							Dimensions
						</h3>
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<fieldset class="fieldset">
								<span class="label">Building height</span>
								<label
									class="input-bordered input flex w-full items-center gap-2 {errors.height
										? 'input-error'
										: ''}"
								>
									<input type="number" step="any" bind:value={form.building.height} class="grow" />
									<span class="text-xs text-base-content/50">m</span>
								</label>
								{#if errors.height}<span class="mt-1 text-xs text-error">{errors.height}</span>{/if}
							</fieldset>

							<fieldset class="fieldset">
								<span class="label">Number of floors</span>
								<label
									class="input-bordered input flex w-full items-center gap-2 {errors.floors
										? 'input-error'
										: ''}"
								>
									<input type="number" step="1" bind:value={form.building.floors} class="grow" />
									<span class="text-xs text-base-content/50">floors</span>
								</label>
								{#if errors.floors}<span class="mt-1 text-xs text-error">{errors.floors}</span>{/if}
							</fieldset>

							<fieldset class="fieldset">
								<span class="label">Length</span>
								<label
									class="input-bordered input flex w-full items-center gap-2 {errors.length
										? 'input-error'
										: ''}"
								>
									<input type="number" step="any" bind:value={form.building.length} class="grow" />
									<span class="text-xs text-base-content/50">m</span>
								</label>
								{#if errors.length}<span class="mt-1 text-xs text-error">{errors.length}</span>{/if}
							</fieldset>

							<fieldset class="fieldset">
								<span class="label">Width</span>
								<label
									class="input-bordered input flex w-full items-center gap-2 {errors.width
										? 'input-error'
										: ''}"
								>
									<input type="number" step="any" bind:value={form.building.width} class="grow" />
									<span class="text-xs text-base-content/50">m</span>
								</label>
								{#if errors.width}<span class="mt-1 text-xs text-error">{errors.width}</span>{/if}
							</fieldset>
						</div>
					</div>

					<div>
						<h3 class="mb-3 border-b border-base-300 pb-2 text-sm font-medium text-base-content/70">
							Construction
						</h3>
						<div class="flex flex-col gap-3">
							<div class="flex flex-col gap-2 md:flex-row">
								<fieldset class="fieldset flex-1">
									<label for="material" class="label">Material</label>
									<select
										id="material"
										aria-label="Material"
										class="select-bordered select w-full"
										bind:value={form.building.material}
									>
										{#each materialOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</fieldset>
								<fieldset class="fieldset flex-1">
									<label for="roof-type" class="label">Roof type</label>
									<select
										id="roof-type"
										aria-label="Roof type"
										class="select-bordered select w-full"
										bind:value={form.building.roofType}
									>
										{#each roofTypeOptions as option}
											<option value={option.value}>{option.label}</option>
										{/each}
									</select>
								</fieldset>
							</div>

							<fieldset class="fieldset">
								<span class="label">Configuration</span>
								<SegmentedControl
									options={configurationOptions}
									bind:value={form.building.configuration}
								/>
							</fieldset>
						</div>
					</div>
				</div>
			</div>
		{:else if currentStep === 2}
			<div class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-5">
					<div>
						<h2 class="font-display text-lg font-semibold">Hazard parameters</h2>
						<p class="text-sm text-base-content/60">
							Set the earthquake and wind scenario. Prefilled values are demonstration defaults.
						</p>
					</div>

					<fieldset class="fieldset">
						<label for="exposure" class="label">Exposure category</label>
						<!-- <SegmentedControl options={exposureOptions} bind:value={form.hazard.exposure} /> -->
						<select
							id="material"
							aria-label="Material"
							class="select-bordered select w-full"
							bind:value={form.hazard.exposure}
						>
							{#each exposureOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</fieldset>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<fieldset class="fieldset">
							<span class="label">Design wind speed</span>
							<label
								class="input-bordered input flex w-full items-center gap-2 {errors.windSpeed
									? 'input-error'
									: ''}"
							>
								<input type="number" step="any" bind:value={form.hazard.windSpeed} class="grow" />
								<span class="text-xs text-base-content/50">kph</span>
							</label>
							<span class="label-text-alt block text-base-content/60"
								>From the applicable NSCP 2015 wind-speed map</span
							>
							{#if errors.windSpeed}<span class="text-xs text-error">{errors.windSpeed}</span>{/if}
						</fieldset>

						<fieldset class="fieldset">
							<span class="label">Earthquake magnitude</span>
							<label
								class="input-bordered input flex w-full items-center gap-2 {errors.magnitude
									? 'input-error'
									: ''}"
							>
								<input type="number" step="0.1" bind:value={form.hazard.magnitude} class="grow" />
								<span class="text-xs text-base-content/50">Mw</span>
							</label>
							<span class="label-text-alt block text-base-content/60"
								>Scenario magnitude (e.g., 7.0)</span
							>
							{#if errors.magnitude}<span class="text-xs text-error">{errors.magnitude}</span>{/if}
						</fieldset>
					</div>
				</div>
			</div>
			<AdvancedParameters input={form} bind:parameters section="hazard" {errors} />
		{:else}
			<div class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<h2 class="font-display text-lg font-semibold">Review</h2>
						<span class="text-xs text-base-content/60">Check the details before calculating</span>
					</div>

					<div class="mt-2 divide-y divide-base-300">
						<div class="py-3">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-sm font-medium text-base-content/70">Site</h3>
								<button type="button" class="link text-xs link-primary" onclick={() => goToStep(0)}
									>Edit</button
								>
							</div>
							<dl class="font-data grid grid-cols-2 gap-y-1 text-sm sm:grid-cols-4">
								<dt class="text-base-content/50">Latitude</dt>
								<dd>{form.site.latitude.toFixed(4)}</dd>
								<dt class="text-base-content/50">Longitude</dt>
								<dd>{form.site.longitude.toFixed(4)}</dd>
								<dt class="text-base-content/50">Fault distance</dt>
								<dd>{form.site.faultDistance} km</dd>
								<dt class="text-base-content/50">Soil type</dt>
								<dd>{soilTypeLabels[form.site.soilType]}</dd>
							</dl>
						</div>

						<div class="py-3">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-sm font-medium text-base-content/70">Building</h3>
								<button type="button" class="link text-xs link-primary" onclick={() => goToStep(1)}
									>Edit</button
								>
							</div>
							<dl class="font-data grid grid-cols-2 gap-y-1 text-sm sm:grid-cols-4">
								<dt class="text-base-content/50">Height</dt>
								<dd>{form.building.height} m</dd>
								<dt class="text-base-content/50">Floors</dt>
								<dd>{form.building.floors}</dd>
								<dt class="text-base-content/50">Length × width</dt>
								<dd>{form.building.length} × {form.building.width} m</dd>
								<dt class="text-base-content/50">Material</dt>
								<dd>{materialLabels[form.building.material]}</dd>
								<dt class="text-base-content/50">Roof type</dt>
								<dd>{roofTypeLabels[form.building.roofType]}</dd>
								<dt class="text-base-content/50">Configuration</dt>
								<dd>{configurationLabels[form.building.configuration]}</dd>
							</dl>
						</div>

						<div class="py-3">
							<div class="mb-2 flex items-center justify-between">
								<h3 class="text-sm font-medium text-base-content/70">Hazard</h3>
								<button type="button" class="link text-xs link-primary" onclick={() => goToStep(2)}
									>Edit</button
								>
							</div>
							<dl class="font-data grid grid-cols-2 gap-y-1 text-sm sm:grid-cols-4">
								<dt class="text-base-content/50">Wind speed</dt>
								<dd>{form.hazard.windSpeed} kph</dd>
								<dt class="text-base-content/50">Magnitude</dt>
								<dd>{form.hazard.magnitude}</dd>
								<dt class="text-base-content/50">Exposure</dt>
								<dd>{exposureLabels[form.hazard.exposure ?? 'C']}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>
			{#if preview}<ParameterSummary parameters={preview} />{/if}
		{/if}

		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
			<button
				type="button"
				onclick={goBack}
				class="btn btn-outline btn-primary {currentStep === 0 ? 'invisible' : ''}"
			>
				Back
			</button>

			{#if currentStep < steps.length - 1}
				<button type="button" onclick={goNext} class="btn btn-primary">
					Next: {steps[currentStep + 1]}
				</button>
			{:else}
				<button type="submit" class="btn btn-primary">Calculate resilience</button>
			{/if}
		</div>
	</form>
</div>

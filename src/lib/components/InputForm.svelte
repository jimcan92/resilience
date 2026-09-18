<script lang="ts">
	import MapPicker from '$lib/components/MapPicker.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import StepIndicator from '$lib/components/StepIndicator.svelte';
	import type { AssessmentInput } from '$lib/types';

	let { onSubmit }: { onSubmit: (input: AssessmentInput) => void } = $props();

	let form = $state<AssessmentInput>({
		site: {
			latitude: 14.5995,
			longitude: 120.9842,
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
			magnitude: 7.0
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

	function validateSite(): Errors {
		const e: Errors = {};
		const fd = form.site.faultDistance;
		if (fd === null || fd === undefined || Number.isNaN(fd) || fd < 0) {
			e.faultDistance = 'Enter the distance to the nearest active fault (0 or more km).';
		}
		return e;
	}

	function validateBuilding(): Errors {
		const e: Errors = {};
		if (!form.building.height || form.building.height <= 0) {
			e.height = 'Height must be greater than 0.';
		}
		if (
			!form.building.floors ||
			form.building.floors < 1 ||
			!Number.isInteger(form.building.floors)
		) {
			e.floors = 'Enter a whole number of floors (1 or more).';
		}
		if (!form.building.length || form.building.length <= 0) {
			e.length = 'Length must be greater than 0.';
		}
		if (!form.building.width || form.building.width <= 0) {
			e.width = 'Width must be greater than 0.';
		}
		return e;
	}

	function validateHazard(): Errors {
		const e: Errors = {};
		if (!form.hazard.windSpeed || form.hazard.windSpeed <= 0) {
			e.windSpeed = 'Enter a design wind speed greater than 0.';
		}
		const mag = form.hazard.magnitude;
		if (mag === null || mag === undefined || Number.isNaN(mag) || mag <= 0 || mag > 9.5) {
			e.magnitude = 'Enter a magnitude between 0.1 and 9.5.';
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

		onSubmit(form);
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

	<form onsubmit={handleFinalSubmit} class="space-y-6">
		{#if currentStep === 0}
			<div class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-5">
					<div>
						<h2 class="font-display text-lg font-semibold">Site information</h2>
						<p class="text-sm text-base-content/60">Set the location and ground conditions.</p>
					</div>

					<MapPicker bind:latitude={form.site.latitude} bind:longitude={form.site.longitude} />

					<div class="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
						<h3 class="text-sm font-semibold text-base-content">
							Distance to nearest active fault
						</h3>
						<p class="text-xs text-base-content/60">
							Open HazardHunterPH then in Location Tools open Long-Lat Coordinate. Input copied
							longitude and latitude then click search. When the location is found, the assessment
							panel will show in the right, find the 'Nearest Active Fault' and copy the value in
							km, then paste below.
						</p>

						<div class="flex flex-col gap-3 lg:flex-row">
							<button
								type="button"
								onclick={openHazardHunter}
								class="btn grow btn-outline btn-info"
							>
								Open HazardHunterPH
							</button>
							<label
								class="input-bordered input flex w-full max-w-full grow items-center gap-2 lg:w-max {errors.faultDistance
									? 'input-error'
									: 'input-primary'}"
							>
								<input
									type="number"
									step="0.1"
									bind:value={form.site.faultDistance}
									placeholder="e.g., 5.2"
									class="grow"
								/>
								<span class="text-xs text-base-content/50">km</span>
							</label>
						</div>
						{#if errors.faultDistance}
							<span class="mt-1 block text-xs text-error">{errors.faultDistance}</span>
						{/if}
					</div>

					<div>
						<span class="mb-2 block text-sm font-medium text-base-content/80">Soil type</span>
						<SegmentedControl
							options={soilTypeOptions}
							bind:value={form.site.soilType}
							columnsClass="grid-cols-3"
						/>
					</div>
				</div>
			</div>
		{:else if currentStep === 1}
			<div class="card border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body gap-6">
					<div>
						<h2 class="font-display text-lg font-semibold">Building information</h2>
						<p class="text-sm text-base-content/60">Describe the structure being assessed.</p>
					</div>

					<div>
						<h3 class="mb-3 border-b border-base-300 pb-2 text-sm font-medium text-base-content/70">
							Dimensions
						</h3>
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<label class="form-control">
								<span class="label-text mb-1">Building height</span>
								<label
									class="input-bordered input flex items-center gap-2 {errors.height
										? 'input-error'
										: ''}"
								>
									<input type="number" bind:value={form.building.height} class="grow" />
									<span class="text-xs text-base-content/50">m</span>
								</label>
								{#if errors.height}<span class="mt-1 text-xs text-error">{errors.height}</span>{/if}
							</label>

							<label class="form-control">
								<span class="label-text mb-1">Number of floors</span>
								<label
									class="input-bordered input flex items-center gap-2 {errors.floors
										? 'input-error'
										: ''}"
								>
									<input type="number" step="1" bind:value={form.building.floors} class="grow" />
									<span class="text-xs text-base-content/50">floors</span>
								</label>
								{#if errors.floors}<span class="mt-1 text-xs text-error">{errors.floors}</span>{/if}
							</label>

							<label class="form-control">
								<span class="label-text mb-1">Length</span>
								<label
									class="input-bordered input flex items-center gap-2 {errors.length
										? 'input-error'
										: ''}"
								>
									<input type="number" bind:value={form.building.length} class="grow" />
									<span class="text-xs text-base-content/50">m</span>
								</label>
								{#if errors.length}<span class="mt-1 text-xs text-error">{errors.length}</span>{/if}
							</label>

							<label class="form-control">
								<span class="label-text mb-1">Width</span>
								<label
									class="input-bordered input flex items-center gap-2 {errors.width
										? 'input-error'
										: ''}"
								>
									<input type="number" bind:value={form.building.width} class="grow" />
									<span class="text-xs text-base-content/50">m</span>
								</label>
								{#if errors.width}<span class="mt-1 text-xs text-error">{errors.width}</span>{/if}
							</label>
						</div>
					</div>

					<div>
						<h3 class="mb-3 border-b border-base-300 pb-2 text-sm font-medium text-base-content/70">
							Construction
						</h3>
						<div class="space-y-4">
							<div>
								<span class="mb-2 block text-sm text-base-content/80">Material</span>
								<SegmentedControl
									options={materialOptions}
									bind:value={form.building.material}
									columnsClass="grid-cols-2 sm:grid-cols-4"
								/>
							</div>

							<div>
								<span class="mb-2 block text-sm text-base-content/80">Roof type</span>
								<SegmentedControl
									options={roofTypeOptions}
									bind:value={form.building.roofType}
									columnsClass="grid-cols-2 sm:grid-cols-4"
								/>
							</div>

							<div>
								<span class="mb-2 block text-sm text-base-content/80">Configuration</span>
								<SegmentedControl
									options={configurationOptions}
									bind:value={form.building.configuration}
									columnsClass="grid-cols-2"
								/>
							</div>
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
							Set the design-level earthquake and wind scenario.
						</p>
					</div>

					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<label class="form-control">
							<span class="label-text mb-1">Design wind speed</span>
							<label
								class="input-bordered input flex items-center gap-2 {errors.windSpeed
									? 'input-error'
									: ''}"
							>
								<input type="number" bind:value={form.hazard.windSpeed} class="grow" />
								<span class="text-xs text-base-content/50">kph</span>
							</label>
							<span class="label-text-alt mt-1 block text-base-content/60"
								>From PAGASA wind map (NSCP 2015)</span
							>
							{#if errors.windSpeed}<span class="mt-1 text-xs text-error">{errors.windSpeed}</span
								>{/if}
						</label>

						<label class="form-control">
							<span class="label-text mb-1">Earthquake magnitude</span>
							<label
								class="input-bordered input flex items-center gap-2 {errors.magnitude
									? 'input-error'
									: ''}"
							>
								<input type="number" step="0.1" bind:value={form.hazard.magnitude} class="grow" />
								<span class="text-xs text-base-content/50">Mw</span>
							</label>
							<span class="label-text-alt mt-1 block text-base-content/60"
								>Scenario magnitude (e.g., 7.0)</span
							>
							{#if errors.magnitude}<span class="mt-1 text-xs text-error">{errors.magnitude}</span
								>{/if}
						</label>
					</div>
				</div>
			</div>
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
							</dl>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
			<button
				type="button"
				onclick={goBack}
				class="btn btn-outline {currentStep === 0 ? 'invisible' : ''}"
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

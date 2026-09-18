<script lang="ts">
	import MapPicker from '$lib/components/MapPicker.svelte';
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

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onSubmit(form);
	}

	// Function to open HazardHunterPH with current coordinates
	function openHazardHunter() {
		const url = `https://hazardhunter.georisk.gov.ph/map?lat=${form.site.latitude}&lng=${form.site.longitude}`;
		window.open(url, '_blank', 'noopener');
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6 py-6">
	<!-- Site Information -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">📍 Site Information</h2>

			<!-- Map Picker -->
			<MapPicker bind:latitude={form.site.latitude} bind:longitude={form.site.longitude} />

			<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
				<label class="form-control">
					<span class="label-text">Latitude</span>
					<input
						type="number"
						step="0.0001"
						bind:value={form.site.latitude}
						class="input-bordered input"
						readonly
					/>
				</label>

				<label class="form-control">
					<span class="label-text">Longitude</span>
					<input
						type="number"
						step="0.0001"
						bind:value={form.site.longitude}
						class="input-bordered input"
						readonly
					/>
				</label>

				<!-- HazardHunterPH Button -->
				<div class="md:col-span-2">
					<button type="button" onclick={openHazardHunter} class="btn btn-block btn-info">
						🌋 Open HazardHunterPH to Check Fault Distance
					</button>
					<p class="mt-2 text-center text-xs text-base-content/70">
						Opens HazardHunterPH with your selected coordinates. Copy the fault distance and paste
						below.
					</p>
				</div>

				<!-- Fault Distance Input -->
				<label class="form-control md:col-span-2">
					<span class="label-text font-semibold"> Distance to Nearest Active Fault (km) </span>
					<input
						type="number"
						step="0.1"
						bind:value={form.site.faultDistance}
						class="input-bordered input input-primary"
						placeholder="e.g., 5.2"
					/>
					<span class="label-text-alt">
						📋 From HazardHunterPH → "Seismic Hazard" → "Ground Shaking" → Distance to nearest fault
					</span>
				</label>

				<label class="form-control md:col-span-2">
					<span class="label-text">Soil Type</span>
					<select bind:value={form.site.soilType} class="select-bordered select">
						<option value="rock">Rock</option>
						<option value="medium">Medium Soil</option>
						<option value="soft">Soft Soil</option>
					</select>
				</label>
			</div>
		</div>
	</div>

	<!-- Building Information -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">🏢 Building Information</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<label class="form-control">
					<span class="label-text">Building Height (m)</span>
					<input type="number" bind:value={form.building.height} class="input-bordered input" />
				</label>

				<label class="form-control">
					<span class="label-text">Number of Floors</span>
					<input type="number" bind:value={form.building.floors} class="input-bordered input" />
				</label>

				<label class="form-control">
					<span class="label-text">Length (m)</span>
					<input type="number" bind:value={form.building.length} class="input-bordered input" />
				</label>

				<label class="form-control">
					<span class="label-text">Width (m)</span>
					<input type="number" bind:value={form.building.width} class="input-bordered input" />
				</label>

				<label class="form-control">
					<span class="label-text">Material</span>
					<select bind:value={form.building.material} class="select-bordered select">
						<option value="concrete">Reinforced Concrete</option>
						<option value="steel">Structural Steel</option>
						<option value="timber">Timber</option>
						<option value="masonry">Masonry</option>
					</select>
				</label>

				<label class="form-control">
					<span class="label-text">Roof Type</span>
					<select bind:value={form.building.roofType} class="select-bordered select">
						<option value="flat">Flat</option>
						<option value="gable">Gable</option>
						<option value="hip">Hip</option>
						<option value="monoslope">Monoslope</option>
					</select>
				</label>

				<label class="form-control md:col-span-2">
					<span class="label-text">Configuration</span>
					<select bind:value={form.building.configuration} class="select-bordered select">
						<option value="regular">Regular</option>
						<option value="irregular">Irregular</option>
					</select>
				</label>
			</div>
		</div>
	</div>

	<!-- Hazard Parameters -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">⚡ Hazard Parameters</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<label class="form-control">
					<span class="label-text">Design Wind Speed (kph)</span>
					<input type="number" bind:value={form.hazard.windSpeed} class="input-bordered input" />
					<span class="label-text-alt">From PAGASA wind map (NSCP 2015)</span>
				</label>

				<label class="form-control">
					<span class="label-text">Earthquake Magnitude</span>
					<input
						type="number"
						step="0.1"
						bind:value={form.hazard.magnitude}
						class="input-bordered input"
					/>
					<span class="label-text-alt">Scenario magnitude (e.g., 7.0)</span>
				</label>
			</div>
		</div>
	</div>

	<button type="submit" class="btn w-full btn-lg btn-primary"> 🧮 Calculate Resilience </button>
</form>

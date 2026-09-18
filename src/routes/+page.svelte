<script lang="ts">
	import InputForm from '$lib/components/InputForm.svelte';
	import ResultDashboard from '$lib/components/ResultDashboard.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { estimatePGA, pgaToScore } from '$lib/engine/pga';
	import { generateRecommendations } from '$lib/engine/recommendations';
	import { calculateRisk } from '$lib/engine/risk';
	import { calculateWindPressure, windToScore } from '$lib/engine/wind';
	import { saveAssessment } from '$lib/storage/localStorage';
	import type { AssessmentInput, AssessmentResult } from '$lib/types';

	let result = $state<AssessmentResult | null>(null);
	let showSavedToast = $state(false);

	function handleSubmit(input: AssessmentInput) {
		const pga = estimatePGA(input.hazard.magnitude, input.site.faultDistance, input.site.soilType);
		const earthquakeScore = pgaToScore(pga);

		const windPressure = calculateWindPressure(input.hazard.windSpeed, input.building.height, 'C');
		const typhoonScore = windToScore(windPressure);

		const { resilienceIndex, dangerLevel } = calculateRisk(earthquakeScore, typhoonScore);

		const recommendations = generateRecommendations(input, earthquakeScore, typhoonScore);

		result = {
			earthquakeScore,
			typhoonScore,
			resilienceIndex,
			dangerLevel,
			recommendations,
			details: { pga, windPressure, haversineDistance: null }
		};

		saveAssessment(input, result);
		showSavedToast = true;
	}

	function handleReset() {
		result = null;
	}
</script>

<div class="bg-blueprint-grid min-h-screen bg-base-200">
	<header class="navbar border-b border-base-300 bg-base-100">
		<div class="container mx-auto flex max-w-4xl justify-between px-4">
			<div>
				<h1 class="font-display text-xl font-semibold tracking-tight text-base-content">
					R.E.S.I.L.I.E.N.C.E.
				</h1>
				<span class="text-xs text-base-content/60">Building resilience calculator</span>
			</div>
			<a href="/history" class="btn btn-ghost btn-sm">History</a>
		</div>
	</header>

	<main class="container mx-auto max-w-4xl p-4">
		{#if !result}
			<InputForm onSubmit={handleSubmit} />
		{:else}
			<ResultDashboard {result} onReset={handleReset} />
		{/if}
	</main>

	<footer class="footer footer-center p-4 text-base-content/60">
		<div class="text-center">
			<p class="text-xs">
				Preliminary assessment tool only. Not a substitute for professional structural engineering.
			</p>
			<p class="mt-1 text-xs">
				Fault data from
				<a
					href="https://hazardhunter.georisk.gov.ph/map"
					target="_blank"
					rel="noopener"
					class="link link-primary"
				>
					HazardHunterPH
				</a>
				• Wind data from PAGASA
			</p>
		</div>
	</footer>
</div>

<Toast message="Assessment saved to history" bind:show={showSavedToast} />

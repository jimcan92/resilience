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

{#if !result}
	<InputForm onSubmit={handleSubmit} />
{:else}
	<ResultDashboard {result} onReset={handleReset} />
{/if}

<Toast message="Assessment saved to history" bind:show={showSavedToast} />

<script lang="ts">
	import type { AssessmentResult } from '$lib/types';
	import { dangerLevelColor, dangerLevelEmoji } from '$lib/types';

	let {
		result,
		onReset
	}: {
		result: AssessmentResult;
		onReset: () => void;
	} = $props();

	let dangerColor = $derived(dangerLevelColor(result.dangerLevel));
	let dangerEmojiChar = $derived(dangerLevelEmoji(result.dangerLevel));
</script>

<div class="space-y-6 py-6">
	<!-- Overall Result -->
	<div class="card bg-{dangerColor} text-{dangerColor}-content shadow-2xl">
		<div class="card-body text-center">
			<h2 class="text-4xl font-bold">
				{dangerEmojiChar}
				{result.dangerLevel}
			</h2>
			<p class="text-lg">Building Resilience Index</p>
			<div
				class="radial-progress mx-auto"
				style="--value:{result.resilienceIndex * 100}; --size:8rem; --thickness:1rem;"
			>
				{(result.resilienceIndex * 100).toFixed(0)}%
			</div>
		</div>
	</div>

	<!-- Hazard Scores -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">🌍 Earthquake Hazard</h3>
				<div
					class="radial-progress mx-auto text-error"
					style="--value:{result.earthquakeScore}; --size:6rem;"
				>
					{result.earthquakeScore}
				</div>
				<p class="text-center text-sm">
					PGA: {result.details.pga.toFixed(3)} g
				</p>
			</div>
		</div>

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h3 class="card-title">🌀 Typhoon Hazard</h3>
				<div
					class="radial-progress mx-auto text-info"
					style="--value:{result.typhoonScore}; --size:6rem;"
				>
					{result.typhoonScore}
				</div>
				<p class="text-center text-sm">
					Pressure: {(result.details.windPressure / 1000).toFixed(2)} kPa
				</p>
			</div>
		</div>
	</div>

	<!-- Recommendations -->
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h3 class="card-title">📋 Recommendations</h3>
			<ul class="space-y-2">
				{#each result.recommendations as rec}
					<li class="flex items-start gap-2">
						<span>{rec}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<button onclick={onReset} class="btn w-full btn-outline"> ← New Assessment </button>
</div>

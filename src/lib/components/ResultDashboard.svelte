<script lang="ts">
	import ParameterSummary from '$lib/components/ParameterSummary.svelte';
	import { recState } from '$lib/states/recommendations.svelte';
	import type { AssessmentResult } from '$lib/types';
	import { dangerLevelColor, dangerLevelEmoji, scoreToDangerLevel } from '$lib/types';

	let {
		result,
		onReset
	}: {
		result: AssessmentResult;
		onReset: () => void;
	} = $props();

	// Written out as literal class names so Tailwind's scanner can generate
	// all of them at build time — string-interpolated class names
	// (`bg-{dangerColor}`) are invisible to the JIT scanner and never render.
	const colorClasses: Record<
		string,
		{ border: string; text: string; softBg: string; fill: string }
	> = {
		success: {
			border: 'border-success',
			text: 'text-success',
			softBg: 'bg-success/10',
			fill: 'bg-success'
		},
		warning: {
			border: 'border-warning',
			text: 'text-warning',
			softBg: 'bg-warning/10',
			fill: 'bg-warning'
		},
		error: { border: 'border-error', text: 'text-error', softBg: 'bg-error/10', fill: 'bg-error' },
		info: { border: 'border-info', text: 'text-info', softBg: 'bg-info/10', fill: 'bg-info' }
	};

	let dangerColorKey = $derived(dangerLevelColor(result.dangerLevel));
	let colors = $derived(colorClasses[dangerColorKey] ?? colorClasses.warning);
	let dangerEmojiChar = $derived(dangerLevelEmoji(result.dangerLevel));
</script>

<div class="space-y-6 py-6">
	<!-- {#if result.details.resolvedParameters}<ParameterSummary
			parameters={result.details.resolvedParameters}
		/>{/if}
	<div class="space-y-2 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
		<p>
			Research prototype: higher BRS means lower combined model scores; it is not a probability of
			building safety.
		</p>
		<p>
			Scoring bounds, weights and soil factors require research justification. Default wind capacity
			and dispersion are illustrative; custom curves are user supplied. Velocity pressure is not a
			complete wall or roof design pressure.
		</p>
		<p>
			Wind exposure: {result.details.parameters?.hazard.exposure ?? 'C'}. Material, roof and
			configuration affect default wind fragility only. Floors, length and width are recorded but do
			not affect these scores. Fault distance is entered manually.
		</p>
		<p class="text-xs">Model: {result.modelVersion}</p>
	</div> -->
	<div class="card border-2 {colors.border} {colors.softBg}">
		<div class="card-body text-center">
			<h2 class="font-display text-3xl font-semibold {colors.text}">
				{dangerEmojiChar}
				{result.dangerLevel}
			</h2>
			<p class="text-sm text-base-content/60">Building Resilience Score (BRS)</p>
			<div
				class="radial-progress mx-auto {colors.text} font-data"
				style="--value:{result.resilienceIndex * 100}; --size:8rem; --thickness:0.75rem;"
			>
				{(result.resilienceIndex * 100).toFixed(0)}%
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="card border border-base-300 bg-base-100 shadow-sm">
			<div class="card-body">
				<h3 class="font-display text-base font-semibold">Earthquake hazard (HE)</h3>
				<div
					class="radial-progress mx-auto text-error"
					style="--value:{result.earthquakeScore}; --size:6rem;"
				>
					<span class="font-data text-sm">{result.earthquakeScore}</span>
				</div>
				<p class="font-data text-center text-xs text-base-content/60">
					PGA: {result.details.pga.toFixed(3)} g ({result.details.pgaGal.toFixed(1)} gal) · {scoreToDangerLevel(
						result.earthquakeScore
					)}
				</p>
			</div>
		</div>

		<div class="card border border-base-300 bg-base-100 shadow-sm">
			<div class="card-body">
				<h3 class="font-display text-base font-semibold">Typhoon hazard (HT)</h3>
				<div
					class="radial-progress mx-auto text-info"
					style="--value:{result.typhoonScore}; --size:6rem;"
				>
					<span class="font-data text-sm">{result.typhoonScore}</span>
				</div>
				<p class="font-data text-center text-xs text-base-content/60">
					Velocity pressure qz: {(result.details.windPressure / 1000).toFixed(2)} kPa
				</p>
				<p class="text-center text-xs">
					Illustrative fragility: {(result.details.fragilityProbability * 100).toFixed(1)}% · {scoreToDangerLevel(
						result.typhoonScore
					)}
				</p>
			</div>
		</div>
	</div>

	<div class="card border border-base-300 bg-base-100 shadow-sm">
		<div class="card-body">
			<h3 class="font-display text-base font-semibold">Hazard comparison</h3>
			<div class="mt-3 space-y-4">
				<div>
					<div class="font-data mb-1 flex justify-between text-xs text-base-content/70">
						<span>Earthquake</span>
						<span>{result.earthquakeScore}/100</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-base-200">
						<div class="h-2 rounded-full bg-error" style="width: {result.earthquakeScore}%"></div>
					</div>
				</div>
				<div>
					<div class="font-data mb-1 flex justify-between text-xs text-base-content/70">
						<span>Typhoon</span>
						<span>{result.typhoonScore}/100</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-base-200">
						<div class="h-2 rounded-full bg-info" style="width: {result.typhoonScore}%"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- How to Interpret & Calculation Parameters (Expandable Sections) -->
	<div class="space-y-3">
		{#if result.details.resolvedParameters}
			<details class="collapse-arrow collapse border border-base-300 bg-base-100 shadow-sm">
				<summary class="font-display collapse-title text-base font-semibold"
					>Calculation parameters</summary
				>
				<div class="collapse-content">
					<ParameterSummary parameters={result.details.resolvedParameters} />
				</div>
			</details>
		{/if}

		<details class="collapse-arrow collapse border border-warning/20 bg-warning/5 shadow-sm">
			<summary class="font-display collapse-title text-base font-semibold">How to interpret</summary
			>
			<div class="collapse-content space-y-2 pt-2 text-sm">
				<p>
					Research prototype: higher BRS means lower combined model scores; it is not a probability
					of building safety.
				</p>
				<p>
					Scoring bounds, weights and soil factors require research justification. Default wind
					capacity and dispersion are illustrative; custom curves are user supplied. Velocity
					pressure is not a complete wall or roof design pressure.
				</p>
				<p>
					Wind exposure: {result.details.parameters?.hazard.exposure ?? 'C'}. Material, roof and
					configuration affect default wind fragility only. Floors, length and width are recorded
					but do not affect these scores. Fault distance is entered manually.
				</p>
				<p class="text-xs">Model: {result.modelVersion}</p>
			</div>
		</details>
	</div>

	<!-- <div class="card border border-base-300 bg-base-100 shadow-sm"> -->
	<div class="flex flex-col gap-2">
		<h3 class="flex flex-col gap-3 text-base font-semibold sm:flex-row sm:justify-between">
			<span class="font-display">Recommendations</span>

			{#if !recState.isLoading}
				<div class="badge badge-soft text-xs font-thin badge-warning">
					{#if recState.recommendationsFrom == 'cache'}
						Recommendations from cache
					{:else if recState.recommendationsFrom == 'ai'}
						Recommendations freshly generated by ai
					{:else}
						AI was not able to generate and no cache is found
					{/if}
				</div>
			{/if}
		</h3>
		{#if recState.isLoading}
			<div
				class="flex h-50 w-full items-center justify-center gap-3 rounded-box border border-warning/50 text-warning"
			>
				<span class="loading loading-md loading-bars"></span>
				AI is generating recommedations...
			</div>
		{:else}
			<ul class="mt-2 space-y-2">
				{#each recState.recommendations as rec}
					<li
						class="flex items-start gap-3 rounded-md border border-l-4 border-warning/50 bg-warning/5 px-3 py-2 text-sm"
					>
						<span>{rec}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	<!-- </div> -->

	<div class="flex flex-col gap-3 sm:flex-row">
		<button onclick={onReset} class="btn grow btn-primary">New assessment</button>
		<a href="/history" class="btn grow btn-outline btn-primary">View history</a>
	</div>
</div>

<script lang="ts">
	import ParameterSummary from '$lib/components/ParameterSummary.svelte';
	import { clearAll, deleteAssessment, getAssessments } from '$lib/storage/localStorage';
	import type { SavedAssessment } from '$lib/types';

	let assessments = $state<SavedAssessment[]>([]);

	$effect(() => {
		assessments = getAssessments();
	});

	function handleDelete(id: number) {
		deleteAssessment(id);
		assessments = getAssessments();
	}

	function handleClear() {
		if (confirm('Delete all saved assessments?')) {
			clearAll();
			assessments = [];
		}
	}
</script>

<svelte:head><title>History | R.E.S.I.L.I.E.N.C.E.</title></svelte:head>
<div class="space-y-4 py-6">
	<div class="flex items-center justify-between">
		<h2 class="font-display text-lg font-semibold">Saved assessments</h2>
		{#if assessments.length > 0}
			<button onclick={handleClear} class="btn btn-outline btn-error btn-sm">Clear all</button>
		{/if}
	</div>

	{#if assessments.length === 0}
		<div class="card border border-base-300 bg-base-100 shadow-sm">
			<div class="card-body items-center text-center">
				<p class="text-base-content/70">No saved assessments yet.</p>
				<a href="/" class="btn mt-2 btn-primary">Create assessment</a>
			</div>
		</div>
	{:else}
		<div class="space-y-3">
			{#each assessments as assessment (assessment.id)}
				<div class="card border border-base-300 bg-base-100 shadow-sm">
					<div class="card-body p-4 sm:p-5">
						{#if assessment.result.details?.resolvedParameters}<details>
								<summary class="cursor-pointer text-sm font-medium"
									>Saved calculation parameters</summary
								><ParameterSummary parameters={assessment.result.details.resolvedParameters} />
							</details>{:else}<p class="text-xs text-base-content/60">
								Legacy assessment — no resolved parameter snapshot; original scores preserved.
							</p>{/if}
						<div class="flex items-start justify-between gap-2">
							<div>
								<h3 class="font-display text-base font-semibold">
									{assessment.result.dangerLevel}
									<span class="font-data font-normal text-base-content/60"
										>(BRS {assessment.result.buildingResilienceScore ??
											(assessment.result.resilienceIndex * 100).toFixed(0)}/100)</span
									>
								</h3>
								<p class="text-xs text-base-content/50">
									{new Date(assessment.date).toLocaleString()} · {assessment.result.modelVersion ??
										'Legacy model — recalculate for comparison'}
								</p>
							</div>
							<button
								onclick={() => handleDelete(assessment.id)}
								class="btn btn-ghost text-error btn-sm"
								aria-label="Delete assessment"
							>
								Delete
							</button>
						</div>

						<div
							class="font-data mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-base-300 pt-3 text-xs text-base-content/70 sm:grid-cols-4"
						>
							<div>Earthquake: {assessment.result.earthquakeScore}</div>
							<div>Typhoon: {assessment.result.typhoonScore}</div>
							<div>
								{assessment.result.windScoringMethod === 'fixed-reference-pressure'
									? 'Normalized wind hazard'
									: 'Legacy wind scoring'}
							</div>
							<div>Fault: {assessment.input.site.faultDistance} km</div>
							<div>Height: {assessment.input.building.height} m</div>
							{#if assessment.result.modelVersion}<div>
									qz: {(assessment.result.details.windPressure / 1000).toFixed(2)} kPa
								</div>
								{#if assessment.result.details.fragilityProbability !== undefined}<div>
										Legacy fragility: {(
											assessment.result.details.fragilityProbability * 100
										).toFixed(1)}%
									</div>{/if}
								<div>Exposure: {assessment.input.hazard.exposure ?? 'C'}</div>{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

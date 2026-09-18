<script lang="ts">
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

<div class="bg-blueprint-grid min-h-screen bg-base-200">
	<header class="navbar border-b border-base-300 bg-base-100">
		<div class="container mx-auto max-w-4xl px-4">
			<a href="/" class="btn btn-ghost btn-sm">← Back</a>
			<h1 class="font-display ml-4 text-xl font-semibold">Assessment history</h1>
		</div>
	</header>

	<main class="container mx-auto max-w-4xl p-4">
		{#if assessments.length === 0}
			<div class="card mt-6 border border-base-300 bg-base-100 shadow-sm">
				<div class="card-body items-center text-center">
					<p class="text-base-content/70">No saved assessments yet.</p>
					<a href="/" class="btn mt-2 btn-primary">Create assessment</a>
				</div>
			</div>
		{:else}
			<div class="my-4 flex justify-end">
				<button onclick={handleClear} class="btn btn-outline btn-error btn-sm">Clear all</button>
			</div>

			<div class="space-y-3">
				{#each assessments as assessment (assessment.id)}
					<div class="card border border-base-300 bg-base-100 shadow-sm">
						<div class="card-body p-4 sm:p-5">
							<div class="flex items-start justify-between gap-2">
								<div>
									<h3 class="font-display text-base font-semibold">
										{assessment.result.dangerLevel}
										<span class="font-data font-normal text-base-content/60"
											>({(assessment.result.resilienceIndex * 100).toFixed(0)}%)</span
										>
									</h3>
									<p class="text-xs text-base-content/50">
										{new Date(assessment.date).toLocaleString()}
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
								<div>Fault: {assessment.input.site.faultDistance} km</div>
								<div>Height: {assessment.input.building.height} m</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

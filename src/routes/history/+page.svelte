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

<div class="min-h-screen bg-base-200">
	<header class="navbar bg-primary text-primary-content shadow-lg">
		<div class="container mx-auto">
			<a href="/" class="btn btn-ghost btn-sm">← Back</a>
			<h1 class="ml-4 text-xl font-bold">📋 Assessment History</h1>
		</div>
	</header>

	<main class="container mx-auto max-w-4xl p-4">
		{#if assessments.length === 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<p class="text-lg">No saved assessments yet.</p>
					<a href="/" class="btn btn-primary">Create Assessment</a>
				</div>
			</div>
		{:else}
			<div class="mb-4 flex justify-end">
				<button onclick={handleClear} class="btn btn-error btn-sm"> 🗑️ Clear All </button>
			</div>

			<div class="space-y-4">
				{#each assessments as assessment (assessment.id)}
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<div class="flex items-start justify-between">
								<div>
									<h3 class="card-title">
										{assessment.result.dangerLevel}
										({assessment.result.resilienceIndex * 100}%)
									</h3>
									<p class="text-sm opacity-70">
										{new Date(assessment.date).toLocaleString()}
									</p>
								</div>
								<button
									onclick={() => handleDelete(assessment.id)}
									class="btn btn-ghost text-error btn-sm"
								>
									🗑️
								</button>
							</div>

							<div class="mt-2 grid grid-cols-2 gap-2 text-sm">
								<div>🌍 Earthquake: {assessment.result.earthquakeScore}</div>
								<div>🌀 Typhoon: {assessment.result.typhoonScore}</div>
								<div>📍 Fault: {assessment.input.site.faultDistance} km</div>
								<div>🏢 Height: {assessment.input.building.height} m</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

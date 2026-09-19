<script lang="ts">
	import { assess } from '$lib/engine/assessment';
	import InputForm from '$lib/components/InputForm.svelte';
	import ResultDashboard from '$lib/components/ResultDashboard.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { saveAssessment } from '$lib/storage/localStorage';
	import type { AssessmentInput, AssessmentResult } from '$lib/types';

	let result = $state<AssessmentResult | null>(null);
	let error = $state('');
	let showSavedToast = $state(false);

	function handleSubmit(input: AssessmentInput) {
		error = '';
		try {
			result = assess($state.snapshot(input));

			showSavedToast = saveAssessment($state.snapshot(input), result);
			if (!showSavedToast) error = 'Calculated, but could not save assessment in this browser.';
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Calculation failed.';
		}
	}

	function handleReset() {
		result = null;
		error = '';
	}
</script>

<svelte:head><title>Assessment | R.E.S.I.L.I.E.N.C.E.</title></svelte:head>
{#if error}<p role="alert" class="alert alert-error">{error}</p>{/if}
{#if !result}
	<InputForm onSubmit={handleSubmit} />
{:else}
	<ResultDashboard {result} onReset={handleReset} />
{/if}

<Toast message="Assessment saved to history" bind:show={showSavedToast} />

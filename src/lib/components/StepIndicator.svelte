<script lang="ts">
	let {
		steps,
		currentStep,
		maxReached,
		onStepClick
	}: {
		steps: string[];
		currentStep: number;
		maxReached: number;
		onStepClick: (index: number) => void;
	} = $props();
</script>

<nav aria-label="Assessment progress">
	<ol class="flex items-start">
		{#each steps as step, i}
			<li class="flex items-center {i === steps.length - 1 ? 'flex-none' : 'flex-1'}">
				<button
					type="button"
					onclick={() => i <= maxReached && onStepClick(i)}
					disabled={i > maxReached}
					class="group flex flex-col items-center gap-1.5 {i > maxReached
						? 'cursor-not-allowed'
						: 'cursor-pointer'}"
					aria-current={i === currentStep ? 'step' : undefined}
				>
					<span
						class="font-data flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors
						{i < currentStep
							? 'border-primary bg-primary text-primary-content'
							: i === currentStep
								? 'border-primary bg-base-100 text-primary'
								: 'border-base-300 bg-base-100 text-base-content/40'}"
					>
						{i < currentStep ? '✓' : i + 1}
					</span>
					<span
						class="hidden text-xs sm:block {i === currentStep
							? 'font-medium text-base-content'
							: 'text-base-content/50'}"
					>
						{step}
					</span>
				</button>
				{#if i < steps.length - 1}
					<div
						class="mx-2 h-0.5 flex-1 {i < currentStep ? 'bg-primary' : 'bg-base-300'}"
						style="margin-bottom: 1.25rem;"
					></div>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

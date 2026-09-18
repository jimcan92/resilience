<script lang="ts">
	let {
		message,
		show = $bindable(false)
	}: {
		message: string;
		show: boolean;
	} = $props();

	$effect(() => {
		if (show) {
			const timer = setTimeout(() => (show = false), 3000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if show}
	<div class="toast toast-end toast-bottom z-50">
		<div class="alert alert-success shadow-lg">
			<span class="text-sm">{message}</span>
			<button
				type="button"
				class="btn btn-ghost btn-xs"
				onclick={() => (show = false)}
				aria-label="Dismiss"
			>
				✕
			</button>
		</div>
	</div>
{/if}

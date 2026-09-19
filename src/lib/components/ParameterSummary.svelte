<script lang="ts">
	import type { ResolvedModelParameters } from '$lib/types';
	let { parameters: p }: { parameters: ResolvedModelParameters } = $props();
</script>

<div class="space-y-3 rounded-lg border border-base-300 p-4 text-sm">
	<h3 class="font-semibold">Calculation parameters</h3>
	<dl class="grid grid-cols-2 gap-2">
		<dt>Soil multiplier</dt>
		<dd>
			{p.soilMultiplier} ({p.soilMode === 'default' ? 'illustrative default' : 'user supplied'})
		</dd>
		<dt>Kz / Kzt / Kd</dt>
		<dd>{p.kz.toFixed(3)} / {p.kzt} / {p.kd}</dd>
		<dt>Median capacity θ</dt>
		<dd>{p.theta} Pa</dd>
		<dt>Dispersion β</dt>
		<dd>{p.beta}</dd>
		<dt>Fragility mode</dt>
		<dd>
			{p.fragilityMode === 'default'
				? 'Illustrative default'
				: 'User supplied — not independently validated'}
		</dd>
		<dt>PGA normalization</dt>
		<dd>{p.pgaMin}–{p.pgaMax} g</dd>
		<dt>Earthquake / typhoon weights</dt>
		<dd>{p.earthquakeWeight}% / {p.typhoonWeight}%</dd>
	</dl>
	<p class="break-words"><strong>Damage state:</strong> {p.damageState}</p>
	<p class="break-words"><strong>Source:</strong> {p.reference}</p>
</div>

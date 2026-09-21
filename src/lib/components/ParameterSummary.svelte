<script lang="ts">
	import type { ResolvedModelParameters } from '$lib/types';
	let { parameters: p }: { parameters: ResolvedModelParameters } = $props();
</script>

<div class="space-y-3 rounded-lg border border-base-300 p-4 text-sm">
	<h3 class="font-semibold">Calculation parameters</h3>
	<dl class="grid grid-cols-1 gap-2 wrap-break-word sm:grid-cols-2">
		<dt>Soil multiplier</dt>
		<dd>
			{p.soilMultiplier} ({p.soilMode === 'default' ? 'illustrative default' : 'user supplied'})
		</dd>
		<dt>Kz / Kzt / Kd</dt>
		<dd>{p.kz.toFixed(3)} / {p.kzt} / {p.kd}</dd>
		{#if p.windScoringMethod === 'fixed-reference-pressure'}
			<dt>Wind scoring method</dt>
			<dd>Fixed-reference pressure normalization</dd>
			<dt>Reference wind speeds</dt>
			<dd>{p.windSpeedMin}–{p.windSpeedMax} km/h</dd>
			<dt>Reference conditions</dt>
			<dd>
				{p.windReference.height} m, Exposure {p.windReference.exposure}; Kz {p.windReference.kz},
				Kzt {p.windReference.kzt}, Kd {p.windReference.kd}
			</dd>
			<dt>Reference pressure range</dt>
			<dd>
				{p.windPressureMin.toFixed(1)}–{p.windPressureMax.toFixed(1)} Pa ({(
					p.windPressureMin / 1000
				).toFixed(3)}–{(p.windPressureMax / 1000).toFixed(3)} kPa)
			</dd>
		{:else}
			<dt>Wind scoring method</dt>
			<dd>Legacy fragility — original snapshot</dd>
			<dt>Median capacity θ / dispersion β</dt>
			<dd>{p.theta} Pa / {p.beta}</dd>
			<dt>Fragility mode</dt>
			<dd>{p.fragilityMode}</dd>
		{/if}
		<dt>PGA normalization</dt>
		<dd>{p.pgaMin}–{p.pgaMax} g</dd>
		<dt>Earthquake / typhoon weights</dt>
		<dd>{p.earthquakeWeight}% / {p.typhoonWeight}%</dd>
	</dl>
	{#if p.windScoringMethod === 'fixed-reference-pressure'}
		<p>
			Default 61–315 km/h bounds were supplied by the researchers; their scientific source is
			unverified. Reference conditions are implementation assumptions. Edited speed bounds are user
			supplied.
		</p>
		<p>Scores describe relative wind pressure, not damage probability.</p>
	{:else}
		<p class="wrap-break-word"><strong>Damage state:</strong> {p.damageState}</p>
		<p class="wrap-break-word"><strong>Source:</strong> {p.reference}</p>
	{/if}
</div>

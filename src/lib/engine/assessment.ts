import { resolveModelParameters } from '$lib/engine/parameters';
import { estimatePGA, pgaToScore } from '$lib/engine/pga';
import { calculateRisk } from '$lib/engine/risk';
import { calculateWindPressure, windToNormalizedScore } from '$lib/engine/wind';
import type { AssessmentInput, AssessmentResult } from '$lib/types';

export function assess(input: AssessmentInput): AssessmentResult {
	const resolvedParameters = resolveModelParameters(input);
	const { pgaG: pga, pgaGal } = estimatePGA(
		input.hazard.magnitude,
		input.site.faultDistance,
		input.site.soilType,
		resolvedParameters.soilMultiplier
	);
	const earthquakeScore = pgaToScore(pga, resolvedParameters.pgaMax, resolvedParameters.pgaMin);

	const windPressure = calculateWindPressure(
		input.hazard.windSpeed,
		input.building.height,
		input.hazard.exposure ?? 'C',
		resolvedParameters.kzt,
		resolvedParameters.kd
	);
	const typhoonScore = windToNormalizedScore(
		windPressure,
		resolvedParameters.windPressureMin,
		resolvedParameters.windPressureMax
	);

	const { buildingResilienceScore, resilienceIndex, dangerLevel } = calculateRisk(
		earthquakeScore,
		typhoonScore,
		{
			earthquake: resolvedParameters.earthquakeWeight / 100,
			typhoon: resolvedParameters.typhoonWeight / 100
		}
	);

	// const recommendations = generateRecommendations(
	// 	input,
	// 	earthquakeScore,
	// 	typhoonScore,
	// 	dangerLevel
	// );

	return {
		modelVersion: 'paper-2026-09-wind-normalization-3',
		windScoringMethod: 'fixed-reference-pressure',
		buildingResilienceScore,
		earthquakeScore,
		typhoonScore,
		resilienceIndex,
		dangerLevel,
		// recommendations,
		details: {
			resolvedParameters,
			pga,
			pgaGal,
			windPressure,
			haversineDistance: null,
			parameters: structuredClone(input)
		}
	};
}

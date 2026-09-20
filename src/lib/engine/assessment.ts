import { resolveModelParameters } from '$lib/engine/parameters';
import { estimatePGA, pgaToScore } from '$lib/engine/pga';
import { calculateRisk } from '$lib/engine/risk';
import { calculateWindPressure, windToFragilityScore } from '$lib/engine/wind';
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
	const { score: typhoonScore, probability: fragilityProbability } = windToFragilityScore(
		windPressure,
		input.building,
		resolvedParameters
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
		modelVersion: 'paper-2026-09-parameters-2',
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
			fragilityProbability,
			haversineDistance: null,
			parameters: structuredClone(input)
		}
	};
}

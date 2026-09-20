import type { AssessmentInput, AssessmentResult } from '$lib/types';

// Bump when the prompt, model, or recommendation contract changes.
export const RECOMMENDATION_VERSION = 'gemini-2.5-flash-v2';
export const CACHE_PREFIX = `brs_cache_${RECOMMENDATION_VERSION}_`;
export const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export function isRecommendationList(value: unknown, ai = false): value is string[] {
	return (
		Array.isArray(value) &&
		value.length >= (ai ? 3 : 1) &&
		value.length <= (ai ? 4 : 30) &&
		value.every((item) => typeof item === 'string' && item.trim().length > 0 && item.length <= 1000)
	);
}

/** Only the context used by the prompt; exact coordinates are not sent to Gemini. */
export function recommendationContext(input: AssessmentInput, result: AssessmentResult) {
	return {
		modelVersion: result.modelVersion,
		site: { soilType: input.site.soilType, faultDistanceKm: input.site.faultDistance },
		building: {
			material: input.building.material,
			roofType: input.building.roofType,
			configuration: input.building.configuration,
			heightM: input.building.height,
			floors: input.building.floors,
			lengthM: input.building.length,
			widthM: input.building.width
		},
		hazard: {
			magnitudeMw: input.hazard.magnitude,
			windSpeedKph: input.hazard.windSpeed,
			exposure: input.hazard.exposure ?? 'C'
		},
		dangerLevel: result.dangerLevel,
		buildingResilienceScore: result.buildingResilienceScore,
		earthquakeScore: result.earthquakeScore,
		typhoonScore: result.typhoonScore,
		pgaG: result.details.pga,
		velocityPressurePa: result.details.windPressure,
		parameters: result.details.resolvedParameters
	};
}

export function recommendationCacheKey(input: AssessmentInput, result: AssessmentResult) {
	return CACHE_PREFIX + JSON.stringify(recommendationContext(input, result));
}

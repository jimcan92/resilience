import type { DangerLevel, HazardWeights, RiskResult } from '$lib/types';
import { scoreToDangerLevel } from '$lib/types';

export const WEIGHTS: HazardWeights = {
	earthquake: 0.5,
	typhoon: 0.5
};

export function calculateRisk(
	earthquakeScore: number,
	typhoonScore: number,
	weights: HazardWeights = WEIGHTS
): RiskResult {
	const risk = weights.earthquake * earthquakeScore + weights.typhoon * typhoonScore;

	const resilienceIndex = 1 - risk / 100;
	const dangerLevel: DangerLevel = scoreToDangerLevel(risk);

	return {
		risk: Math.round(risk),
		resilienceIndex: Math.round(resilienceIndex * 100) / 100,
		dangerLevel
	};
}

// =========================================================================
// Multi-Hazard Risk and Building Resilience Score (BRS) Engine
// Reference: Page 7 of R.E.S.I.L.I.E.N.C.E. Research Paper
// Equation: BRS = 100 * [1 - (wE * HE + wT * HT)]
// =========================================================================

import { requireRange } from '$lib/engine/validation';
import type { DangerLevel, HazardWeights, RiskResult } from '$lib/types';
import { scoreToDangerLevel } from '$lib/types';

export const DEFAULT_WEIGHTS: HazardWeights = {
	earthquake: 0.5,
	typhoon: 0.5
};

/**
 * Calculate multi-hazard risk and overall Building Resilience Score (BRS)
 * @param earthquakeScore HE (0-100)
 * @param typhoonScore HT (0-100)
 * @param weights Relative weights (wE + wT = 1.0, default 0.50 / 0.50)
 */
export function calculateRisk(
	earthquakeScore: number,
	typhoonScore: number,
	weights: HazardWeights = DEFAULT_WEIGHTS
): RiskResult {
	requireRange(earthquakeScore, 0, 100, 'Earthquake score');
	requireRange(typhoonScore, 0, 100, 'Typhoon score');
	requireRange(weights.earthquake, 0, 1, 'Earthquake weight');
	requireRange(weights.typhoon, 0, 1, 'Typhoon weight');
	if (Math.abs(weights.earthquake + weights.typhoon - 1) > 1e-9)
		throw new RangeError('Hazard weights must sum to 1.');
	const he = Math.min(100, Math.max(0, Number.isFinite(earthquakeScore) ? earthquakeScore : 0));
	const ht = Math.min(100, Math.max(0, Number.isFinite(typhoonScore) ? typhoonScore : 0));

	const wE = weights.earthquake;
	const wT = weights.typhoon;

	// Combined multi-hazard risk (0-100)
	const combinedRisk = wE * he + wT * ht;

	// Building Resilience Score (BRS = 100 * [1 - (wE*HE + wT*HT)])
	const brs = Math.max(0, Math.min(100, 100 * (1 - combinedRisk / 100)));

	// Resilience index from 0.0 to 1.0
	const resilienceIndex = Math.round((brs / 100) * 100) / 100;

	// Danger level derived from combined risk
	const dangerLevel: DangerLevel = scoreToDangerLevel(combinedRisk);

	return {
		risk: Math.round(combinedRisk),
		buildingResilienceScore: Math.round(brs),
		resilienceIndex,
		dangerLevel
	};
}

import gmpeParams from '$lib/data/gmpe-coefficients.json';
import soilFactors from '$lib/data/soil-factors.json';
import type { SoilType } from '$lib/types';

interface GmpeParams {
	c1: number;
	c2: number;
	c3: number;
	c4: number;
	c5: number;
	c6: number;
	c7: number;
}

type SoilFactorTable = Record<SoilType, number>;

const gmpe = gmpeParams as GmpeParams;
const soils = soilFactors as SoilFactorTable;

/**
 * Simplified Boore-Atkinson (2008) GMPE
 * Returns PGA in g (gravity)
 *
 * ln(PGA) = c1 + c2*(M-6) + c3*(M-6)^2 + c4*ln(R) + c5*R + c6*V_s30
 */
export function estimatePGA(magnitude: number, distanceKm: number, soilType: SoilType): number {
	const M = magnitude;
	const R = Math.sqrt(distanceKm ** 2 + 6 ** 2); // Distance with depth correction

	// Boore-Atkinson (2008) simplified
	const lnPGA =
		gmpe.c1 +
		gmpe.c2 * (M - 6) +
		gmpe.c3 * (M - 6) ** 2 +
		gmpe.c4 * Math.log(R) +
		gmpe.c5 * R +
		gmpe.c6;

	const pgaRock = Math.exp(lnPGA);
	const soilFactor = soils[soilType] ?? 1.0;

	return pgaRock * soilFactor;
}

export function pgaToScore(pga: number): number {
	// Score based on PGA thresholds (in g)
	// 0.05g = low, 0.20g = moderate, 0.40g = high, 0.60g+ = critical
	const score = Math.min(100, (pga / 0.8) * 100);
	return Math.round(score);
}

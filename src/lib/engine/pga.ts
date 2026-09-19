// =========================================================================
// Fukushima & Tanaka (1990) Ground Motion Attenuation Model
// Reference: Page 5 of R.E.S.I.L.I.E.N.C.E. Research Paper
// log10(PGA) = 0.41M - log10(R + 0.032 * 10^(0.41M)) - 0.0034R + 1.30
// PGA is returned in cm/s² (gal) and converted to g (gravity, 1g = 980.665 gal).
// =========================================================================

import { requireRange, requireChoice, requirePositive } from '$lib/engine/validation';
import soilFactors from '$lib/data/soil-factors.json';
import type { SoilType } from '$lib/types';

const soils = soilFactors as Record<SoilType, number>;

export interface PgaCalculationResult {
	pgaGal: number; // Acceleration in cm/s² (gal)
	pgaG: number; // Acceleration in g
}

/**
 * Estimate Peak Ground Acceleration (PGA) using Fukushima & Tanaka (1990)
 * @param magnitude Earthquake scenario magnitude (Mw)
 * @param faultDistanceKm Distance from fault to site in km (R >= 0)
 * @param soilType Soil condition ('rock' | 'medium' | 'soft')
 */
export function estimatePGA(
	magnitude: number,
	faultDistanceKm: number,
	soilType: SoilType = 'medium',
	soilMultiplier = soils[soilType]
): PgaCalculationResult {
	// Guard inputs
	requireRange(magnitude, 0.1, 9.5, 'Scenario magnitude');
	requireRange(faultDistanceKm, 0, Number.MAX_VALUE, 'Fault distance');
	requireChoice(soilType, ['rock', 'medium', 'soft'], 'soil type');
	const m = magnitude;
	const r = faultDistanceKm;

	// Fukushima & Tanaka (1990) equation
	const logTerm = Math.log10(r + 0.032 * Math.pow(10, 0.41 * m));
	const logPga = 0.41 * m - logTerm - 0.0034 * r + 1.3;

	// PGA in gal (cm/s²)
	const rawGal = Math.pow(10, logPga);
	requirePositive(soilMultiplier, 'Soil multiplier');
	const soilFactor = soilMultiplier;
	const pgaGal = rawGal * soilFactor;

	// Convert to g (1g = 980.665 cm/s²)
	const pgaG = pgaGal / 980.665;

	return {
		pgaGal,
		pgaG
	};
}

/**
 * Convert PGA (in g) to standardized Earthquake Hazard Score (HE, 0-100)
 * Reference: Page 6 of Research Paper (Min-Max normalization)
 * HE = ((PGA - PGAmin) / (PGAmax - PGAmin)) * 100
 * PGAmin = 0.0g, PGAmax = 0.80g (design limit)
 */
export function pgaToScore(pgaG: number, pgaMax = 0.8, pgaMin = 0): number {
	requireRange(pgaG, 0, Number.MAX_VALUE, 'PGA');
	requirePositive(pgaMax, 'PGA normalization maximum');
	requireRange(pgaMin, 0, Number.MAX_VALUE, 'PGA minimum');
	if (pgaMax <= pgaMin) throw new RangeError('PGA maximum must exceed the minimum.');
	const normalized = ((pgaG - pgaMin) / (pgaMax - pgaMin)) * 100;
	return Math.round(Math.min(100, Math.max(0, normalized)));
}

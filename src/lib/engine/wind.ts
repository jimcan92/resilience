// =========================================================================
// NSCP 2015 Wind Velocity Pressure & Fragility Vulnerability Model
// Reference: Pages 6 & 7 of R.E.S.I.L.I.E.N.C.E. Research Paper
// Equation: qz = 0.613 * Kz * Kzt * Kd * V²
// Fragility Equation: P(DS >= ds | IM) = Φ[ (ln(IM / θ)) / β ]
// =========================================================================

import kzTable from '$lib/data/nscp-kz.json';
import { requireChoice, requirePositive, requireRange } from '$lib/engine/validation';
import type { BuildingInput, ExposureCategory } from '$lib/types';

type KzRow = [number, number];
type KzTable = Record<ExposureCategory, KzRow[]>;

const table = kzTable as unknown as KzTable;

// NSCP 2015 Table 207A.6-1 (Directionality Factor for MWFRS / Main Buildings)
export const KD = 0.85;

/**
 * Standard Normal Cumulative Distribution Function Φ(x)
 * Accurate to within 7.5e-8 (Abramowitz & Stegun formula 26.2.17)
 */
export function standardNormalCDF(x: number): number {
	const p = 0.2316419;
	const b1 = 0.31938153;
	const b2 = -0.356563782;
	const b3 = 1.781477937;
	const b4 = -1.821255978;
	const b5 = 1.330274429;

	const t = 1.0 / (1.0 + p * Math.abs(x));
	const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
	const normalDensity = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
	const cdf = 1.0 - normalDensity * poly;

	return x >= 0 ? cdf : 1.0 - cdf;
}

/**
 * Get Kz (velocity pressure exposure coefficient) via linear interpolation
 * per NSCP 2015 Table 207B.3-1
 */
export function getKz(height: number, exposure: ExposureCategory = 'C'): number {
	requirePositive(height, 'Height');
	requireRange(height, 0, 150, 'Height');
	requireChoice(exposure, ['B', 'C', 'D'], 'exposure');
	const rows = table[exposure];
	if (!rows || rows.length === 0) return 1.0;

	const h = Math.max(0, height);

	// Cap at maximum height in table (150m), use linear interpolation within range
	if (h <= rows[0][0]) return rows[0][1];
	if (h >= rows[rows.length - 1][0]) return rows[rows.length - 1][1];

	for (let i = 0; i < rows.length - 1; i++) {
		const [h1, k1] = rows[i];
		const [h2, k2] = rows[i + 1];

		if (h >= h1 && h <= h2) {
			const ratio = (h - h1) / (h2 - h1);
			return k1 + ratio * (k2 - k1);
		}
	}

	return rows[rows.length - 1][1];
}

/**
 * Calculate velocity pressure qz (in Pa or N/m²) per NSCP 2015 Section 207B.3
 * qz = 0.613 * Kz * Kzt * Kd * V²
 * @param windSpeedKph Design wind speed from PAGASA / NSCP 2015 map (in kph)
 * @param height Building height in meters
 * @param exposure Exposure Category ('B' | 'C' | 'D')
 * @param kzt Topographic factor (default 1.0)
 */
export function calculateWindPressure(
	windSpeedKph: number,
	height: number,
	exposure: ExposureCategory = 'C',
	kzt = 1.0,
	kd = KD
): number {
	requireRange(windSpeedKph, 0, Number.MAX_VALUE, 'Wind speed');
	requireRange(kzt, 1, Number.MAX_VALUE, 'Topographic factor');
	const vKph = windSpeedKph;
	const V = vKph / 3.6; // Convert kph to m/s
	const Kz = getKz(height, exposure);
	requirePositive(kd, 'Directionality factor');
	requireRange(kd, 0, 1, 'Directionality factor');
	const Kd = kd;
	const KztVal = Math.max(1.0, Number.isFinite(kzt) ? kzt : 1.0);

	// qz in N/m² (Pa)
	const qz = 0.613 * Kz * KztVal * Kd * Math.pow(V, 2);
	return qz;
}

/**
 * Baseline structural capacity θ (in Pa) and dispersion β
 * based on Building Material, Roof Type, and Configuration.
 * Provisional prototype assumptions; these numeric values have no verified calibration source.
 */
export function getBuildingWindCapacity(building?: BuildingInput): { theta: number; beta: number } {
	if (!building) {
		return { theta: 3500, beta: 0.35 };
	}

	requireChoice(building.material, ['concrete', 'steel', 'masonry', 'timber'], 'material');
	requireChoice(building.roofType, ['hip', 'gable', 'monoslope', 'flat'], 'roof type');
	requireChoice(building.configuration, ['regular', 'irregular'], 'configuration');
	// Illustrative material capacity (Pa), not established resistance
	const materialBase: Record<string, number> = {
		concrete: 4800,
		steel: 4200,
		masonry: 3200,
		timber: 2400
	};

	// Aerodynamic / uplift coefficient based on roof geometry
	const roofMultiplier: Record<string, number> = {
		hip: 1.2, // Superior aerodynamics and 4-way slope uplift resistance
		gable: 1.0, // Standard baseline
		monoslope: 0.9, // Higher uplift on windward overhang
		flat: 0.8 // High negative pressure / suction on edges
	};

	// Structural regularity
	const configMultiplier: Record<string, number> = {
		regular: 1.0,
		irregular: 0.85 // Dynamic amplification and stress concentration
	};

	const baseTheta = materialBase[building.material] ?? 3500;
	const roofFactor = roofMultiplier[building.roofType] ?? 1.0;
	const configFactor = configMultiplier[building.configuration] ?? 1.0;

	const theta = baseTheta * roofFactor * configFactor;
	const beta = 0.35; // Provisional dispersion; requires calibration

	return { theta, beta };
}

/**
 * Convert wind pressure to Typhoon Hazard / Vulnerability Score (HT, 0-100)
 * Reference: Page 7 of R.E.S.I.L.I.E.N.C.E. Research Paper
 * Fragility Equation: P(DS >= ds | IM) = Φ[ (ln(IM / θ)) / β ]
 */
export function windToFragilityScore(
	pressurePa: number,
	building?: BuildingInput,
	parameters?: { theta: number; beta: number }
): { score: number; probability: number } {
	requireRange(pressurePa, 0, Number.MAX_VALUE, 'Wind pressure');
	const { theta, beta } = parameters ?? getBuildingWindCapacity(building);
	requirePositive(theta, 'Median capacity');
	requirePositive(beta, 'Dispersion');
	if (pressurePa === 0) {
		return { score: 0, probability: 0 };
	}

	// Standard lognormal fragility parameter: z = ln(IM / θ) / β
	const z = Math.log(pressurePa / theta) / beta;
	const probability = standardNormalCDF(z);

	// Score is 0 to 100
	const score = Math.round(Math.min(100, Math.max(0, probability * 100)));

	return {
		score,
		probability
	};
}

// Backwards-compatible helper
export function windToScore(pressurePa: number): number {
	return windToFragilityScore(pressurePa).score;
}

/** Fixed implementation reference, independent of the assessed building. */
export const WIND_REFERENCE = Object.freeze({
	height: 10,
	exposure: 'C' as const,
	kzt: 1,
	kd: 0.85
});
export function referenceWindBounds(
	minSpeed: number,
	maxSpeed: number,
	height: number = WIND_REFERENCE.height
) {
	requireRange(minSpeed, 0, Number.MAX_VALUE, 'Minimum reference wind speed');
	requireRange(maxSpeed, 0, Number.MAX_VALUE, 'Maximum reference wind speed');
	requirePositive(height, 'Reference height');
	requireRange(height, 0, 150, 'Reference height');
	if (maxSpeed <= minSpeed) throw new RangeError('Maximum reference speed must exceed minimum.');
	const { exposure, kzt, kd } = WIND_REFERENCE;
	const windPressureMin = calculateWindPressure(minSpeed, height, exposure, kzt, kd);
	const windPressureMax = calculateWindPressure(maxSpeed, height, exposure, kzt, kd);
	if (
		!Number.isFinite(windPressureMin) ||
		!Number.isFinite(windPressureMax) ||
		windPressureMax <= windPressureMin
	)
		throw new RangeError('Reference pressures must be distinct and finite.');
	return {
		windReference: { ...WIND_REFERENCE, height, kz: getKz(height, exposure) },
		windPressureMin,
		windPressureMax
	};
}
export function windToNormalizedScore(pressurePa: number, minPa: number, maxPa: number): number {
	requireRange(pressurePa, 0, Number.MAX_VALUE, 'Wind pressure');
	requireRange(minPa, 0, Number.MAX_VALUE, 'Minimum reference pressure');
	requireRange(maxPa, 0, Number.MAX_VALUE, 'Maximum reference pressure');
	if (maxPa <= minPa) throw new RangeError('Maximum reference pressure must exceed minimum.');
	return Math.round(100 * Math.min(1, Math.max(0, (pressurePa - minPa) / (maxPa - minPa))));
}

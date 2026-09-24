import soilFactors from '$lib/data/soil-factors.json';
import { getKz, referenceWindBounds } from '$lib/engine/wind';
import type {
	AssessmentInput,
	ModelParameters,
	NormalizedModelParameters,
	ResolvedModelParameters
} from '$lib/types';

export function defaultModelParameters(): ModelParameters {
	return {
		soilMode: 'default',
		soilMultiplier: 0.87,
		kzt: 1,
		kd: 0.85,
		windReferenceHeight: 10,
		windSpeedMin: 61,
		windSpeedMax: 315,
		pgaMin: 0,
		pgaMax: 0.8,
		earthquakeWeight: 50
	};
}
export function parameterErrors(p: ModelParameters): Record<string, string> {
	const errors: Record<string, string> = {};
	if (!['default', 'custom'].includes(p.soilMode))
		errors.soilMode = 'Choose a soil parameter mode.';
	if (p.soilMode === 'custom' && (!Number.isFinite(p.soilMultiplier) || p.soilMultiplier <= 0))
		errors.soilMultiplier = 'Soil multiplier must be finite and greater than zero.';
	if (!Number.isFinite(p.kzt) || p.kzt < 1) errors.kzt = 'Kzt must be finite and at least 1.';
	if (!Number.isFinite(p.kd) || p.kd <= 0 || p.kd > 1)
		errors.kd = 'Kd must be greater than 0 and no more than 1.';
	const referenceHeight = p.windReferenceHeight ?? 10;
	if (!Number.isFinite(referenceHeight) || referenceHeight <= 0 || referenceHeight > 150)
		errors.windReferenceHeight = 'Reference height must be greater than 0 and no more than 150 m.';
	if (!Number.isFinite(p.windSpeedMin) || p.windSpeedMin < 0)
		errors.windSpeedMin = 'Minimum reference wind speed must be finite and at least zero.';
	if (!Number.isFinite(p.windSpeedMax) || p.windSpeedMax <= p.windSpeedMin)
		errors.windSpeedMax = 'Maximum reference wind speed must be finite and exceed the minimum.';
	if (!errors.windSpeedMin && !errors.windSpeedMax) {
		try {
			referenceWindBounds(p.windSpeedMin, p.windSpeedMax, referenceHeight);
		} catch {
			errors.windSpeedMax = 'Reference speeds must produce distinct, finite pressure bounds.';
		}
	}
	if (!Number.isFinite(p.pgaMin) || p.pgaMin < 0)
		errors.pgaMin = 'PGA minimum must be finite and at least 0 g.';
	if (!Number.isFinite(p.pgaMax) || p.pgaMax <= p.pgaMin)
		errors.pgaMax = 'PGA maximum must be finite and greater than the minimum.';
	if (!Number.isFinite(p.earthquakeWeight) || p.earthquakeWeight < 0 || p.earthquakeWeight > 100)
		errors.earthquakeWeight = 'Earthquake weight must be between 0 and 100%.';
	return errors;
}
export function resolveModelParameters(input: AssessmentInput): NormalizedModelParameters {
	const p = input.modelParameters ?? defaultModelParameters();
	const errors = parameterErrors(p);
	if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));
	const soilMultiplier =
		p.soilMode === 'default' ? soilFactors[input.site.soilType] : p.soilMultiplier;
	if (!Number.isFinite(soilMultiplier) || soilMultiplier <= 0)
		throw new RangeError('Unsupported soil multiplier.');
	return {
		...p,
		soilMultiplier,
		windScoringMethod: 'fixed-reference-pressure',
		...referenceWindBounds(
			p.windSpeedMin,
			p.windSpeedMax,
			p.windReferenceHeight ?? 10,
			input.hazard.exposure ?? 'C'
		),
		kz: getKz(input.building.height, input.hazard.exposure ?? 'C'),
		typhoonWeight: 100 - p.earthquakeWeight
	};
}
/** Validate saved values without replacing snapshots or recomputing their scores. */
export function isResolvedModelParameters(value: unknown): value is ResolvedModelParameters {
	if (!value || typeof value !== 'object') return false;
	const p = value as ResolvedModelParameters;
	if (
		![p.soilMultiplier, p.kz].every((v) => Number.isFinite(v) && v > 0) ||
		!Number.isFinite(p.typhoonWeight) ||
		Math.abs(p.earthquakeWeight + p.typhoonWeight - 100) >= 1e-8
	)
		return false;
	if (p.windScoringMethod === 'fixed-reference-pressure') {
		const r = p.windReference;
		return (
			Object.keys(parameterErrors(p)).length === 0 &&
			!!r &&
			r.height === (p.windReferenceHeight ?? 10) &&
			['B', 'C', 'D'].includes(r.exposure) &&
			r.kzt === 1 &&
			r.kd === 0.85 &&
			Number.isFinite(r.kz) &&
			Number.isFinite(p.windPressureMin) &&
			p.windPressureMin >= 0 &&
			Number.isFinite(p.windPressureMax) &&
			p.windPressureMax > p.windPressureMin
		);
	}
	if (p.windScoringMethod !== undefined && p.windScoringMethod !== 'fragility') return false;
	return (
		Object.keys(parameterErrors({ ...p, windSpeedMin: 61, windSpeedMax: 315 })).length === 0 &&
		['default', 'custom'].includes(p.fragilityMode) &&
		[p.theta, p.beta].every((v) => Number.isFinite(v) && v > 0) &&
		typeof p.damageState === 'string' &&
		typeof p.reference === 'string' &&
		(p.fragilityMode === 'default' || !!(p.damageState.trim() && p.reference.trim()))
	);
}

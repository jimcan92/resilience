import type { AssessmentInput, ModelParameters, ResolvedModelParameters } from '$lib/types';
import soilFactors from '$lib/data/soil-factors.json';
import { getBuildingWindCapacity, getKz } from '$lib/engine/wind';

export function defaultModelParameters(): ModelParameters {
	return {
		soilMode: 'default',
		soilMultiplier: 0.87,
		kzt: 1,
		kd: 0.85,
		fragilityMode: 'default',
		theta: 4800,
		beta: 0.35,
		damageState: '',
		reference: '',
		pgaMin: 0,
		pgaMax: 0.8,
		earthquakeWeight: 50
	};
}

export function parameterErrors(p: ModelParameters): Record<string, string> {
	const errors: Record<string, string> = {};
	const positive = (key: 'soilMultiplier' | 'theta' | 'beta', label: string) => {
		if (!Number.isFinite(p[key]) || p[key] <= 0)
			errors[key] = `${label} must be finite and greater than zero.`;
	};
	if (!['default', 'custom'].includes(p.soilMode))
		errors.soilMode = 'Choose a soil parameter mode.';
	if (!['default', 'custom'].includes(p.fragilityMode))
		errors.fragilityMode = 'Choose a fragility parameter mode.';
	if (p.soilMode === 'custom') positive('soilMultiplier', 'Soil multiplier');
	if (!Number.isFinite(p.kzt) || p.kzt < 1) errors.kzt = 'Kzt must be finite and at least 1.';
	if (!Number.isFinite(p.kd) || p.kd <= 0 || p.kd > 1)
		errors.kd = 'Kd must be greater than 0 and no more than 1.';
	if (p.fragilityMode === 'custom') {
		positive('theta', 'Median capacity θ');
		positive('beta', 'Dispersion β');
		if (typeof p.damageState !== 'string' || !p.damageState.trim())
			errors.damageState = 'Describe the damage state for this curve.';
		if (typeof p.reference !== 'string' || !p.reference.trim())
			errors.reference = 'Enter the source or reference for this curve.';
	}
	if (!Number.isFinite(p.pgaMin) || p.pgaMin < 0)
		errors.pgaMin = 'PGA minimum must be finite and at least 0 g.';
	if (!Number.isFinite(p.pgaMax) || p.pgaMax <= p.pgaMin)
		errors.pgaMax = 'PGA maximum must be finite and greater than the minimum.';
	if (!Number.isFinite(p.earthquakeWeight) || p.earthquakeWeight < 0 || p.earthquakeWeight > 100)
		errors.earthquakeWeight = 'Earthquake weight must be between 0 and 100%.';
	return errors;
}

export function resolveModelParameters(input: AssessmentInput): ResolvedModelParameters {
	const p = input.modelParameters ?? defaultModelParameters();
	const errors = parameterErrors(p);
	if (Object.keys(errors).length) throw new RangeError(Object.values(errors).join(' '));
	const capacity = p.fragilityMode === 'default' ? getBuildingWindCapacity(input.building) : p;
	const soilMultiplier =
		p.soilMode === 'default' ? soilFactors[input.site.soilType] : p.soilMultiplier;
	if (!Number.isFinite(soilMultiplier) || soilMultiplier <= 0)
		throw new RangeError('Unsupported soil multiplier.');
	return {
		...p,
		soilMultiplier,
		theta: capacity.theta,
		beta: capacity.beta,
		damageState:
			p.fragilityMode === 'default'
				? 'Unspecified damage state — illustrative curve'
				: p.damageState.trim(),
		reference:
			p.fragilityMode === 'default'
				? 'Prototype material/roof/configuration mapping; not calibrated'
				: p.reference.trim(),
		kz: getKz(input.building.height, input.hazard.exposure ?? 'C'),
		typhoonWeight: 100 - p.earthquakeWeight
	};
}

/** Validate persisted snapshots without recalculating them against current defaults. */
export function isResolvedModelParameters(value: unknown): value is ResolvedModelParameters {
	if (!value || typeof value !== 'object') return false;
	const p = value as ResolvedModelParameters;
	return (
		Object.keys(parameterErrors(p)).length === 0 &&
		[p.soilMultiplier, p.theta, p.beta, p.kz].every((v) => Number.isFinite(v) && v > 0) &&
		Number.isFinite(p.typhoonWeight) &&
		Math.abs(p.earthquakeWeight + p.typhoonWeight - 100) < 1e-8 &&
		typeof p.damageState === 'string' &&
		typeof p.reference === 'string'
	);
}

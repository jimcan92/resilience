// ============================================
// R.E.S.I.L.I.E.N.C.E. — Type Definitions
// Risk Evaluation and Spatial Integration for Load-
// and Impact-Enhanced Networked Construction Engineering
// ============================================

// ---------- Hazard Levels ----------
export type DangerLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type SoilType = 'rock' | 'medium' | 'soft';

export type BuildingMaterial = 'concrete' | 'steel' | 'timber' | 'masonry';

export type RoofType = 'flat' | 'gable' | 'hip' | 'monoslope';

export type ConfigurationType = 'regular' | 'irregular';

export type ExposureCategory = 'B' | 'C' | 'D';

// ---------- Site Input ----------
export interface SiteInput {
	latitude: number;
	longitude: number;
	faultDistance: number; // km (from PHIVOLCS FaultFinder / HazardHunterPH)
	soilType: SoilType;
}

// ---------- Building Input ----------
export interface BuildingInput {
	height: number; // meters
	floors: number;
	length: number; // meters
	width: number; // meters
	material: BuildingMaterial;
	roofType: RoofType;
	configuration: ConfigurationType;
}

// ---------- Hazard Input ----------
export interface HazardInput {
	windSpeed: number; // kph (PAGASA / NSCP 2015 wind map)
	magnitude: number; // earthquake magnitude (Mw)
	exposure?: ExposureCategory; // Exposure B (urban/suburban), C (open), D (coastal)
}

// ---------- Combined Input ----------
export interface AssessmentInput {
	modelParameters?: ModelParameters;
	site: SiteInput;
	building: BuildingInput;
	hazard: HazardInput;
}

// ---------- Calculation Details ----------
export interface AssessmentDetails {
	resolvedParameters?: ResolvedModelParameters;
	pga: number; // Peak Ground Acceleration in g (Fukushima & Tanaka 1990)
	pgaGal: number; // Acceleration in cm/s² (gal)
	windPressure: number; // Velocity pressure qz in Pa (NSCP 2015)
	fragilityProbability?: number; // P(DS >= ds | IM) from 0 to 1
	haversineDistance: number | null;
	parameters?: AssessmentInput;
}

// ---------- Assessment Result ----------
export interface AssessmentResult {
	modelVersion?: string;
	windScoringMethod?: 'fixed-reference-pressure' | 'fragility';
	earthquakeScore: number; // HE (0-100)
	typhoonScore: number; // HT (0-100)
	buildingResilienceScore: number; // BRS (0-100)
	resilienceIndex: number; // 0-1 (for UI radial progress display)
	dangerLevel: DangerLevel;
	// recommendations: string[];
	details: AssessmentDetails;
}

// ---------- Saved Assessment ----------
export interface SavedAssessment {
	id: number;
	date: string; // ISO string
	input: AssessmentInput;
	result: AssessmentResult;
}

// ---------- Risk Calculation ----------
export interface RiskResult {
	risk: number; // 0-100
	buildingResilienceScore: number; // BRS (0-100)
	resilienceIndex: number; // 0-1
	dangerLevel: DangerLevel;
}

// ---------- Weights ----------
export interface HazardWeights {
	earthquake: number;
	typhoon: number;
}

// ============================================
// Type Guards (para sa runtime safety)
// ============================================

export function isDangerLevel(value: string): value is DangerLevel {
	return ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(value);
}

export function isSoilType(value: string): value is SoilType {
	return ['rock', 'medium', 'soft'].includes(value);
}

export function isBuildingMaterial(value: string): value is BuildingMaterial {
	return ['concrete', 'steel', 'timber', 'masonry'].includes(value);
}

export function isRoofType(value: string): value is RoofType {
	return ['flat', 'gable', 'hip', 'monoslope'].includes(value);
}

export function isConfigurationType(value: string): value is ConfigurationType {
	return ['regular', 'irregular'].includes(value);
}

export function isExposureCategory(value: string): value is ExposureCategory {
	return ['B', 'C', 'D'].includes(value);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert risk score (0-100) to danger level
 * 0-25: LOW, 26-50: MODERATE, 51-75: HIGH, 76-100: CRITICAL
 */
export function scoreToDangerLevel(score: number): DangerLevel {
	if (!Number.isFinite(score) || score < 0) {
		throw new RangeError('Score must be finite and nonnegative.');
	}
	const clamped = Math.min(100, Math.max(0, score));
	if (clamped <= 25) return 'LOW';
	if (clamped <= 50) return 'MODERATE';
	if (clamped <= 75) return 'HIGH';
	return 'CRITICAL';
}

/**
 * Get color for danger level (DaisyUI)
 */
export function dangerLevelColor(level: DangerLevel): string {
	const colors: Record<DangerLevel, string> = {
		LOW: 'success',
		MODERATE: 'warning',
		HIGH: 'error',
		CRITICAL: 'error'
	};
	return colors[level] ?? 'warning';
}

/**
 * Get emoji for danger level
 */
export function dangerLevelEmoji(level: DangerLevel): string {
	const emojis: Record<DangerLevel, string> = {
		LOW: '🟢',
		MODERATE: '🟡',
		HIGH: '🟠',
		CRITICAL: '🔴'
	};
	return emojis[level] ?? '🟡';
}

/**
 * Get label for danger level
 */
export function dangerLevelLabel(level: DangerLevel): string {
	const labels: Record<DangerLevel, string> = {
		LOW: 'Low Risk',
		MODERATE: 'Moderate Risk',
		HIGH: 'High Risk',
		CRITICAL: 'Critical Risk'
	};
	return labels[level] ?? 'Moderate Risk';
}

export enum AlertType {
	success = 'success',
	error = 'error',
	warning = 'warning',
	info = 'info'
}

export type AppAlert = {
	type: AlertType;
	message: string;
};

export type ParameterMode = 'default' | 'custom';
export interface ModelParameters {
	soilMode: ParameterMode;
	soilMultiplier: number;
	kzt: number;
	kd: number;
	windReferenceHeight: number; // reference height in meters for wind normalization
	windSpeedMin: number; // reference km/h
	windSpeedMax: number; // reference km/h
	pgaMin: number;
	pgaMax: number;
	earthquakeWeight: number; // percent
}
export interface NormalizedModelParameters extends ModelParameters {
	windScoringMethod: 'fixed-reference-pressure';
	kz: number;
	typhoonWeight: number;
	windReference: {
		height: number;
		exposure: ExposureCategory;
		kzt: number;
		kd: number;
		kz: number;
	};
	windPressureMin: number;
	windPressureMax: number;
}
/** Persisted old snapshots only; never used to calculate new assessments. */
export interface LegacyResolvedModelParameters extends Omit<
	ModelParameters,
	'windSpeedMin' | 'windSpeedMax'
> {
	windScoringMethod?: 'fragility';
	fragilityMode: ParameterMode;
	theta: number;
	beta: number;
	damageState: string;
	reference: string;
	kz: number;
	typhoonWeight: number;
}
export type ResolvedModelParameters = NormalizedModelParameters | LegacyResolvedModelParameters;

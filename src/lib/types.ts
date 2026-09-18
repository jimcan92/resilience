// ============================================
// R.E.S.I.L.I.E.N.C.E. — Type Definitions
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
	faultDistance: number; // km (manual input from PHIVOLCS FaultFinder)
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
	windSpeed: number; // kph (from PAGASA map)
	magnitude: number; // earthquake magnitude
}

// ---------- Combined Input ----------
export interface AssessmentInput {
	site: SiteInput;
	building: BuildingInput;
	hazard: HazardInput;
}

// ---------- Calculation Details ----------
export interface AssessmentDetails {
	pga: number; // Peak Ground Acceleration (g)
	windPressure: number; // Wind pressure (N/m²)
	haversineDistance: number | null;
}

// ---------- Assessment Result ----------
export interface AssessmentResult {
	earthquakeScore: number; // 0-100
	typhoonScore: number; // 0-100
	resilienceIndex: number; // 0-1
	dangerLevel: DangerLevel;
	recommendations: string[];
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
// Utility Types
// ============================================

/**
 * Convert risk score to danger level
 */
export function scoreToDangerLevel(score: number): DangerLevel {
	if (score <= 25) return 'LOW';
	if (score <= 50) return 'MODERATE';
	if (score <= 75) return 'HIGH';
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
	return colors[level];
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
	return emojis[level];
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
	return labels[level];
}

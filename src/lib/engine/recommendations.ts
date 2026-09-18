import type { AssessmentInput } from '$lib/types';

export function generateRecommendations(
	input: AssessmentInput,
	earthquakeScore: number,
	typhoonScore: number
): string[] {
	const recs: string[] = [];
	const { site, building } = input;

	// Earthquake recommendations
	if (earthquakeScore >= 75) {
		recs.push('🔴 CRITICAL: Consider base isolation or energy dissipation systems.');
		recs.push('🔴 Engage a licensed structural engineer for seismic detailing.');
	} else if (earthquakeScore >= 50) {
		recs.push('🟠 HIGH: Reinforce ductile detailing of beams and columns.');
	}

	// Fault proximity
	if (site.faultDistance < 5) {
		recs.push(
			'⚠️ Site is within 5 km of an active fault. Consider relocating or using high-ductility design.'
		);
	} else if (site.faultDistance < 10) {
		recs.push('⚠️ Site is within 10 km of an active fault. Apply near-source factors.');
	}

	// Soil type
	if (site.soilType === 'soft') {
		recs.push('⚠️ Soft soil may amplify ground motion. Conduct geotechnical investigation.');
	}

	// Typhoon recommendations
	if (typhoonScore >= 75) {
		recs.push('🔴 CRITICAL: Reinforce roof connections and cladding for high wind uplift.');
		recs.push('🔴 Use impact-resistant glazing in wind-borne debris regions.');
	} else if (typhoonScore >= 50) {
		recs.push('🟠 HIGH: Check roof sheathing and fastener spacing per NSCP 2015.');
	}

	// Roof type
	if (building.roofType === 'flat' && typhoonScore >= 50) {
		recs.push('⚠️ Flat roofs are prone to uplift. Consider gable or hip roof.');
	}

	// Building height
	if (building.height > 30) {
		recs.push('⚠️ Tall building: Consider dynamic wind analysis and vortex shedding.');
	}

	// Configuration
	if (building.configuration === 'irregular') {
		recs.push(
			'⚠️ Irregular configuration may cause stress concentrations. Simplify plan if possible.'
		);
	}

	// Default
	if (recs.length === 0) {
		recs.push('✅ Building appears to have low risk. Maintain regular inspections.');
	}

	recs.push(
		'ℹ️ Fault data from HazardHunterPH. Wind data from PAGASA. These are preliminary recommendations only. Consult a licensed structural engineer.'
	);

	return recs;
}

// =========================================================================
// Preliminary Engineering Design Recommendations Generator
// Reference: Page 10 of R.E.S.I.L.I.E.N.C.E. Research Paper
// =========================================================================

import type { AssessmentInput, DangerLevel } from '$lib/types';

export function generateRecommendations(
	input: AssessmentInput,
	earthquakeScore: number,
	typhoonScore: number,
	dangerLevel?: DangerLevel
): string[] {
	const recs: string[] = [];
	const { site, building } = input;

	// ---------- 1. Earthquake Severity Recommendations ----------
	if (earthquakeScore > 75) {
		recs.push(
			'🔴 CRITICAL SEISMIC: Site experiences severe ground motion demand. Consider base isolation or supplemental damping.'
		);
		recs.push(
			'🔴 Engage a licensed structural engineer for special seismic detailing per NSCP Chapter 2.'
		);
	} else if (earthquakeScore > 50) {
		recs.push(
			'🟠 HIGH SEISMIC: Provide ductile detailing for beam-column joints and adequate confinement reinforcement.'
		);
	} else if (earthquakeScore > 25) {
		recs.push(
			'🟡 MODERATE SEISMIC: Standard ductile detailing required. Ensure anchorages meet code provisions.'
		);
	}

	// ---------- 2. Fault Proximity & Geotechnical ----------
	if (site.faultDistance < 5) {
		recs.push(
			'⚠️ NEAR-FAULT ZONE: Located within 5 km of an active fault. Apply near-source amplification factors (Na, Nv).'
		);
	} else if (site.faultDistance < 10) {
		recs.push(
			'⚠️ FAULT PROXIMITY: Located within 10 km of an active fault. Verify foundation ground-motion response.'
		);
	}

	if (site.soilType === 'soft') {
		recs.push(
			'⚠️ GEOTECHNICAL: Soft soil condition can significantly amplify ground motions. Conduct site-specific borehole and SPT investigation.'
		);
	}

	// ---------- 3. Typhoon & Wind Hazard Recommendations ----------
	if (typhoonScore > 75) {
		recs.push(
			'🔴 CRITICAL WIND: Very high wind vulnerability. Reinforce roof trusses, purlins, and wall cladding connections.'
		);
		recs.push(
			'🔴 Use impact-resistant glazing and install storm shutters against wind-borne debris.'
		);
	} else if (typhoonScore > 50) {
		recs.push(
			'🟠 HIGH WIND: Check roof sheathing fastener spacing and uplift anchorage per NSCP 2015 Table 207B.'
		);
	} else if (typhoonScore > 25) {
		recs.push(
			'🟡 MODERATE WIND: Ensure structural roof clips / hurricane ties are properly installed on all rafter-to-wall joints.'
		);
	}

	// ---------- 4. Building Typology & Material Specifics ----------
	if (building.material === 'timber') {
		recs.push(
			'ℹ️ TIMBER STRUCTURE: Use galvanized steel hurricane straps, preservative-treated framing, and shear wall anchor bolts.'
		);
	} else if (building.material === 'masonry') {
		recs.push(
			'ℹ️ MASONRY STRUCTURE: Provide reinforced concrete tie beams and stiffener columns at all corner intersections.'
		);
	}

	if (building.roofType === 'flat') {
		recs.push(
			'⚠️ FLAT ROOF: Prone to severe wind suction on eaves and ponding water. Ensure reinforced parapets and positive slope drainage.'
		);
	} else if (building.roofType === 'monoslope') {
		recs.push(
			'⚠️ MONOSLOPE ROOF: Asymmetric wind uplift on high eave. Double rafter tie anchors on windward edge.'
		);
	}

	if (building.configuration === 'irregular') {
		recs.push(
			'⚠️ PLAN IRREGULARITY: Asymmetric shape may cause torsional eccentricity during seismic shaking and wind vortices.'
		);
	}

	if (building.height > 30) {
		recs.push(
			'⚠️ TALL STRUCTURE: Building height exceeds 30 m. Evaluate cross-wind vortex shedding and story drift limitations.'
		);
	}

	// ---------- 5. Context-Aware Baseline Fallback ----------
	if (recs.length === 0) {
		if (dangerLevel === 'CRITICAL' || dangerLevel === 'HIGH') {
			recs.push(
				'⚠️ Elevated combined multi-hazard risk. Full structural engineering review recommended.'
			);
		} else if (dangerLevel === 'MODERATE') {
			recs.push(
				'🟡 Moderate multi-hazard exposure: Review the individual hazard scores with a qualified engineer.'
			);
		} else {
			recs.push(
				'No additional scenario-specific rule was triggered. This does not establish building safety.'
			);
		}
	}

	// Standard disclaimer
	recs.push(
		'ℹ️ Fault data referenced from PHIVOLCS / HazardHunterPH; wind parameters per NSCP 2015. Preliminary decision-support evaluation only.'
	);

	return recs;
}

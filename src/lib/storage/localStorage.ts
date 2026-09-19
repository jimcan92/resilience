import { isResolvedModelParameters } from '$lib/engine/parameters';
import type { AssessmentInput, AssessmentResult, SavedAssessment } from '$lib/types';

const KEY = 'resilience-assessments';

export function saveAssessment(input: AssessmentInput, result: AssessmentResult): boolean {
	if (typeof localStorage === 'undefined') return false;

	try {
		const assessments = getAssessments();
		assessments.unshift({
			id: Date.now(),
			date: new Date().toISOString(),
			input,
			result
		});
		// Keep up to 50 assessments
		localStorage.setItem(KEY, JSON.stringify(assessments.slice(0, 50)));
		return true;
	} catch (e) {
		console.warn('Failed to save assessment to localStorage:', e);
		return false;
	}
}

export function getAssessments(): SavedAssessment[] {
	if (typeof localStorage === 'undefined') return [];

	try {
		const data = localStorage.getItem(KEY);
		if (!data) return [];
		const parsed = JSON.parse(data);
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(item) =>
					item &&
					Number.isFinite(item.id) &&
					typeof item.date === 'string' &&
					Number.isFinite(Date.parse(item.date)) &&
					item.input?.site &&
					Number.isFinite(item.input.site.faultDistance) &&
					item.input?.building &&
					Number.isFinite(item.input.building.height) &&
					item.input?.hazard &&
					item.result &&
					['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(item.result.dangerLevel) &&
					(!item.result.details?.resolvedParameters ||
						isResolvedModelParameters(item.result.details.resolvedParameters)) &&
					['earthquakeScore', 'typhoonScore', 'resilienceIndex'].every((key) =>
						Number.isFinite(item.result[key])
					) &&
					(!item.result.modelVersion ||
						(Number.isFinite(item.result.buildingResilienceScore) &&
							Number.isFinite(item.result.details?.windPressure) &&
							Number.isFinite(item.result.details?.fragilityProbability)))
			);
		}
		return [];
	} catch (e) {
		console.warn('Error reading assessments from localStorage:', e);
		return [];
	}
}

export function deleteAssessment(id: number) {
	if (typeof localStorage === 'undefined') return;

	try {
		const assessments = getAssessments().filter((a) => a.id !== id);
		localStorage.setItem(KEY, JSON.stringify(assessments));
	} catch (e) {
		console.warn('Failed to delete assessment from localStorage:', e);
	}
}

export function clearAll() {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.removeItem(KEY);
	} catch (e) {
		console.warn('Failed to clear localStorage:', e);
	}
}

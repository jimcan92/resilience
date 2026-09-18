import type { AssessmentInput, AssessmentResult, SavedAssessment } from '$lib/types';

const KEY = 'resilience-assessments';

export function saveAssessment(input: AssessmentInput, result: AssessmentResult): void {
	if (typeof localStorage === 'undefined') return;

	const assessments = getAssessments();
	assessments.push({
		id: Date.now(),
		date: new Date().toISOString(),
		input,
		result
	});
	localStorage.setItem(KEY, JSON.stringify(assessments));
}

export function getAssessments(): SavedAssessment[] {
	if (typeof localStorage === 'undefined') return [];

	const data = localStorage.getItem(KEY);
	return data ? JSON.parse(data) : [];
}

export function deleteAssessment(id: number): void {
	if (typeof localStorage === 'undefined') return;

	const assessments = getAssessments().filter((a) => a.id !== id);
	localStorage.setItem(KEY, JSON.stringify(assessments));
}

export function clearAll(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(KEY);
}

import { defaultModelParameters, parameterErrors } from '$lib/engine/parameters';
import { requireChoice, requirePositive, requireRange } from '$lib/engine/validation';
import type { AssessmentInput, ModelParameters } from '$lib/types';

function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error('Expected an object.');
	return value as Record<string, unknown>;
}

/** Validate and allowlist fields before recalculating scores or constructing a prompt. */
export function parseAssessmentInput(value: unknown): AssessmentInput {
	const raw = object(value);
	const site = object(raw.site),
		building = object(raw.building),
		hazard = object(raw.hazard);
	const input = {
		site: {
			latitude: site.latitude,
			longitude: site.longitude,
			soilType: site.soilType,
			faultDistance: site.faultDistance
		},
		building: {
			height: building.height,
			floors: building.floors,
			length: building.length,
			width: building.width,
			material: building.material,
			roofType: building.roofType,
			configuration: building.configuration
		},
		hazard: {
			magnitude: hazard.magnitude,
			windSpeed: hazard.windSpeed,
			exposure: hazard.exposure ?? 'C'
		}
	} as AssessmentInput;
	const s = input.site,
		b = input.building,
		h = input.hazard;
	requireRange(s.latitude, -90, 90, 'Latitude');
	requireRange(s.longitude, -180, 180, 'Longitude');
	requireRange(s.faultDistance, 0, Number.MAX_VALUE, 'Fault distance');
	requireChoice(s.soilType, ['rock', 'medium', 'soft'], 'soil type');
	requirePositive(b.height, 'Height');
	requireRange(b.height, 0, 150, 'Height');
	requirePositive(b.floors, 'Floors');
	if (!Number.isInteger(b.floors)) throw new Error('Floors must be an integer.');
	requirePositive(b.length, 'Length');
	requirePositive(b.width, 'Width');
	requireChoice(b.material, ['concrete', 'steel', 'timber', 'masonry'], 'material');
	requireChoice(b.roofType, ['flat', 'gable', 'hip', 'monoslope'], 'roof type');
	requireChoice(b.configuration, ['regular', 'irregular'], 'configuration');
	requireChoice(h.exposure!, ['B', 'C', 'D'], 'exposure');
	requireRange(h.magnitude, 0.1, 9.5, 'Magnitude');
	requireRange(h.windSpeed, 0, Number.MAX_VALUE, 'Wind speed');
	if (raw.modelParameters !== undefined) {
		const supplied = object(raw.modelParameters);
		const parameters = Object.fromEntries(
			Object.keys(defaultModelParameters()).map((key) => [key, supplied[key]])
		) as unknown as ModelParameters;
		for (const [key, defaultValue] of Object.entries(defaultModelParameters())) {
			const value = supplied[key];
			if (
				typeof defaultValue === 'number'
					? typeof value !== 'number' || !Number.isFinite(value)
					: typeof value !== 'string' || value.length > 1000
			) {
				throw new Error(`Invalid model parameter: ${key}.`);
			}
		}
		if (Object.keys(parameterErrors(parameters)).length)
			throw new Error('Invalid model parameters.');
		input.modelParameters = parameters;
	}
	return input;
}

// Best-effort per-process limit. Production must also use a shared/edge limiter
// because serverless instances do not share memory and can be restarted.
export function createRecommendationLimiter() {
	const clients = new Map<string, { count: number; resetAt: number }>();
	return (client: string, now = Date.now()): number => {
		for (const [key, entry] of clients) if (entry.resetAt <= now) clients.delete(key);
		const entry = clients.get(client);
		if (entry && entry.count >= 10) return Math.ceil((entry.resetAt - now) / 1000);
		if (!entry && clients.size >= 10_000) return 60;
		clients.set(client, {
			count: (entry?.count ?? 0) + 1,
			resetAt: entry?.resetAt ?? now + 60_000
		});
		return 0;
	};
}

export async function readRecommendationBody(request: Request): Promise<unknown> {
	const reader = request.body?.getReader();
	if (!reader) throw new Error('Missing request body.');
	const decoder = new TextDecoder();
	let size = 0,
		text = '';
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > 16_384) {
				await reader.cancel();
				throw new Error('Request exceeds 16 KB.');
			}
			text += decoder.decode(value, { stream: true });
		}
		return JSON.parse(text + decoder.decode());
	} finally {
		reader.releaseLock();
	}
}

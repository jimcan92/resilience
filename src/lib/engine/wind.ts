import kzTable from '$lib/data/nscp-kz.json';
import type { ExposureCategory } from '$lib/types';

type KzRow = [number, number];
type KzTable = Record<ExposureCategory, KzRow[]>;

const table = kzTable as unknown as KzTable;

const Kd = 0.85;
const G = 0.85;

function getKz(height: number, exposure: ExposureCategory): number {
	const rows = table[exposure];
	if (!rows || rows.length === 0) return 1.0;

	for (let i = 0; i < rows.length - 1; i++) {
		const [h1, k1] = rows[i];
		const [h2, k2] = rows[i + 1];

		if (height >= h1 && height <= h2) {
			const ratio = (height - h1) / (h2 - h1);
			return k1 + ratio * (k2 - k1);
		}
	}

	return rows[rows.length - 1][1];
}

export function calculateWindPressure(
	windSpeedKph: number,
	height: number,
	exposure: ExposureCategory = 'C'
): number {
	const V = windSpeedKph / 3.6; // ← Kinahanglan valid ang windSpeedKph
	const Kz = getKz(height, exposure); // ← Kinahanglan valid ang height
	const Kzt = 1.0;

	const qz = 0.613 * Kz * Kzt * Kd * V ** 2;

	const Cp = 0.8;
	const GCpi = 0.18;

	return qz * G * Cp - qz * GCpi;
}

export function windToScore(pressure: number): number {
	const score = Math.min(100, (pressure / 6000) * 100);
	return Math.round(score);
}

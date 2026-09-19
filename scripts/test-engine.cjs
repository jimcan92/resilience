// Read-only audit probes against the actual TypeScript engine and storage code.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(relative) {
	const filename = path.resolve(relative);
	if (cache.has(filename)) return cache.get(filename).exports;
	const module = { exports: {} };
	cache.set(filename, module);
	const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
	}).outputText;
	new Function('require', 'module', 'exports', code)(
		(name) => {
			if (!name.startsWith('$lib/')) return require(name);
			const target = path.resolve('src/lib', name.slice(5));
			return name.endsWith('.json')
				? JSON.parse(fs.readFileSync(target, 'utf8'))
				: load(target + '.ts');
		},
		module,
		module.exports
	);
	return module.exports;
}

const assert = require('node:assert/strict');
const { estimatePGA, pgaToScore } = load('src/lib/engine/pga.ts');
const { calculateWindPressure, windToFragilityScore, getBuildingWindCapacity } =
	load('src/lib/engine/wind.ts');
const { calculateRisk } = load('src/lib/engine/risk.ts');
const { generateRecommendations } = load('src/lib/engine/recommendations.ts');
const near = (a, b, t = 1e-8) => assert.ok(Math.abs(a - b) < t, a + ' != ' + b);
near(estimatePGA(7, 0).pgaGal, (Math.pow(10, 1.3) / 0.032) * 0.87);
assert.ok(estimatePGA(7, 0).pgaG > 0);
near(estimatePGA(7, 0).pgaG, estimatePGA(7, 0.001).pgaG, 0.0001);
assert.ok(estimatePGA(7, 10).pgaG < estimatePGA(7, 0).pgaG);
near(calculateWindPressure(250, 12), 0.613 * 1.04 * 0.85 * (250 / 3.6) ** 2);
near(calculateWindPressure(200, 12) / calculateWindPressure(100, 12), 4);
const building = {
	height: 12,
	floors: 3,
	length: 20,
	width: 15,
	material: 'concrete',
	roofType: 'gable',
	configuration: 'regular'
};
const q = calculateWindPressure(250, 12);
assert.ok(
	windToFragilityScore(q, { ...building, material: 'timber' }).score >
		windToFragilityScore(q, building).score
);
assert.ok(
	windToFragilityScore(q, { ...building, roofType: 'flat' }).score >
		windToFragilityScore(q, { ...building, roofType: 'hip' }).score
);
near(
	windToFragilityScore(getBuildingWindCapacity(building).theta, building).probability,
	0.5,
	1e-7
);
assert.equal(calculateRisk(0, 0).buildingResilienceScore, 100);
assert.equal(calculateRisk(100, 100).buildingResilienceScore, 0);
assert.equal(calculateRisk(30, 30).dangerLevel, 'MODERATE');
assert.throws(() => estimatePGA(7, -1));
assert.throws(() => estimatePGA(NaN, 1));
assert.throws(() => calculateWindPressure(250, 151));
assert.throws(() => calculateWindPressure(250, 12, 'X'));
assert.throws(() => calculateRisk(NaN, 0));
assert.throws(() => calculateRisk(20, 20, { earthquake: 1, typhoon: 1 }));
assert.throws(() => pgaToScore(1, 0));
const input = {
	site: { latitude: 0, longitude: 0, faultDistance: 10, soilType: 'medium' },
	building,
	hazard: { magnitude: 7, windSpeed: 250, exposure: 'C' }
};
assert.ok(!generateRecommendations(input, 50, 50).join(' ').includes('HIGH SEISMIC'));
let value = '{broken';
global.localStorage = {
	getItem: () => value,
	setItem: (_, v) => {
		value = v;
	},
	removeItem: () => {
		value = null;
	}
};
const storage = load('src/lib/storage/localStorage.ts');
assert.deepEqual(storage.getAssessments(), []);
value = '[{"id":1,"input":{},"result":{}}]';
assert.deepEqual(storage.getAssessments(), []);
const result = {
	...calculateRisk(30, 30),
	earthquakeScore: 30,
	typhoonScore: 30,
	modelVersion: 'test',
	details: { windPressure: q, fragilityProbability: 0.3 }
};
assert.equal(storage.saveAssessment(input, result), true);
assert.equal(storage.getAssessments().length, 1);
global.localStorage.setItem = () => {
	throw new Error('quota');
};
assert.equal(storage.saveAssessment(input, result), false);
console.log(
	'PASS: formula reference, continuity, sensitivity, boundaries, invalid inputs, recommendations, and storage regressions'
);

const { defaultModelParameters, resolveModelParameters, parameterErrors } = load(
	'src/lib/engine/parameters.ts'
);
const { assess } = load('src/lib/engine/assessment.ts');
const defaults = resolveModelParameters(input);
assert.equal(defaults.theta, 4800);
assert.equal(defaults.soilMultiplier, 0.87);
near(defaults.kz, 1.04);
const baseline = assess(input);
assert.equal(baseline.earthquakeScore, 45);
assert.equal(baseline.typhoonScore, 4);
assert.equal(baseline.buildingResilienceScore, 76);
const params = {
	...defaultModelParameters(),
	soilMode: 'custom',
	soilMultiplier: 1.74,
	fragilityMode: 'custom',
	theta: 3000,
	beta: 0.4,
	damageState: 'Test damage state',
	reference: 'Synthetic test reference',
	kzt: 1.2,
	kd: 0.9,
	pgaMin: 0.1,
	pgaMax: 0.9,
	earthquakeWeight: 70
};
const customInput = { ...input, modelParameters: params };
const custom = assess(customInput);
near(custom.details.pga, baseline.details.pga * 2);
near(custom.details.windPressure / baseline.details.windPressure, (1.2 * 0.9) / 0.85);
assert.equal(custom.earthquakeScore, Math.round(((custom.details.pga - 0.1) / 0.8) * 100));
assert.equal(
	custom.buildingResilienceScore,
	Math.round(100 - 0.7 * custom.earthquakeScore - 0.3 * custom.typhoonScore)
);
const changed = assess({
	...customInput,
	building: { ...building, material: 'timber', roofType: 'flat' },
	site: { ...input.site, soilType: 'soft' }
});
assert.equal(changed.typhoonScore, custom.typhoonScore);
assert.equal(changed.details.pga, custom.details.pga);
assert.equal(
	resolveModelParameters({
		...input,
		building: { ...building, material: 'timber', roofType: 'hip' }
	}).theta,
	2880
);
assert.equal(
	resolveModelParameters({ ...input, site: { ...input.site, soilType: 'soft' } }).soilMultiplier,
	1.4
);
near(windToFragilityScore(3000, building, { theta: 3000, beta: 0.4 }).probability, 0.5, 1e-7);
assert.equal(pgaToScore(0.5, 0.9, 0.1), 50);
assert.equal(pgaToScore(0.05, 0.9, 0.1), 0);
assert.equal(pgaToScore(1.2, 0.9, 0.1), 100);
for (const earthquakeWeight of [0, 100]) {
	const r = assess({ ...customInput, modelParameters: { ...params, earthquakeWeight } });
	assert.equal(
		r.buildingResilienceScore,
		100 - (earthquakeWeight === 0 ? r.typhoonScore : r.earthquakeScore)
	);
}
for (const [key, bad] of [
	['soilMultiplier', 0],
	['theta', 0],
	['beta', -1],
	['kzt', 0.5],
	['kd', 1.1],
	['pgaMin', -1],
	['pgaMax', 0.1],
	['earthquakeWeight', 101],
	['reference', ' '],
	['damageState', '']
]) {
	const badParameters = { ...params, [key]: bad };
	assert.ok(parameterErrors(badParameters)[key]);
	assert.throws(() => assess({ ...input, modelParameters: badParameters }));
}
for (const key of [
	'soilMultiplier',
	'theta',
	'beta',
	'kzt',
	'kd',
	'pgaMin',
	'pgaMax',
	'earthquakeWeight'
])
	assert.throws(() => assess({ ...input, modelParameters: { ...params, [key]: NaN } }));
assert.throws(() => windToFragilityScore(0, building, { theta: 0, beta: 0.4 }));
// A saved result keeps the resolved values even when the input object later changes.
params.theta = 9000;
assert.equal(custom.details.resolvedParameters.theta, 3000);
assert.equal(custom.details.parameters.modelParameters.theta, 3000);
value = '[]';
global.localStorage.setItem = (_, v) => {
	value = v;
};
assert.equal(storage.saveAssessment(customInput, custom), true);
assert.deepEqual(
	storage.getAssessments()[0].result.details.resolvedParameters,
	custom.details.resolvedParameters
);
const saved = JSON.parse(value);
saved[0].result.details.resolvedParameters.kz = 'bad';
value = JSON.stringify(saved);
assert.equal(storage.getAssessments().length, 0);
value = JSON.stringify([{ id: 1, date: '2026-09-20T00:00:00Z', input, result }]);
assert.equal(storage.getAssessments().length, 1);
assert.equal(storage.getAssessments()[0].result.details.resolvedParameters, undefined);
console.log(
	'PASS: editable parameters, full assessment defaults/custom overrides, snapshots, legacy compatibility and invalid domains'
);

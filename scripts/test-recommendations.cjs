const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const modules = new Map();
let generate;
const env = { GEMINI_API_KEY: 'mock-only' };
function load(relative) {
	const filename = path.resolve(relative);
	if (modules.has(filename)) return modules.get(filename).exports;
	const module = { exports: {} };
	modules.set(filename, module);
	const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
	}).outputText;
	new Function('require', 'module', 'exports', '$state', code)(
		(name) => {
			if (name === '$env/dynamic/private') return { env };
			if (name === '@google/genai')
				return {
					GoogleGenAI: class {
						models = { generateContent: (...args) => generate(...args) };
					}
				};
			if (name === '@sveltejs/kit')
				return { json: (body, init) => new Response(JSON.stringify(body), init) };
			if (!name.startsWith('$lib/')) return require(name);
			const target = path.resolve('src/lib', name.slice(5));
			return name.endsWith('.json')
				? JSON.parse(fs.readFileSync(target, 'utf8'))
				: load(target + '.ts');
		},
		module,
		module.exports,
		(value) => value
	);
	return module.exports;
}
const { assess } = load('src/lib/engine/assessment.ts');
const { generateRecommendations } = load('src/lib/engine/recommendations.ts');
const { RecommendationState } = load('src/lib/states/recommendations.svelte.ts');
const { recommendationCacheKey, CACHE_PREFIX, CACHE_TTL } = load(
	'src/lib/recommendation-contract.ts'
);
const { parseAssessmentInput, createRecommendationLimiter } = load(
	'src/lib/server/recommendations.ts'
);
const { POST } = load('src/routes/api/recommendations/+server.ts');
const input = {
	site: { latitude: 9.8, longitude: 123.3, faultDistance: 10, soilType: 'medium' },
	building: {
		height: 12,
		floors: 3,
		length: 20,
		width: 15,
		material: 'concrete',
		roofType: 'gable',
		configuration: 'regular'
	},
	hazard: { magnitude: 7, windSpeed: 250, exposure: 'C' }
};
const result = assess(input);
const { defaultModelParameters } = load('src/lib/engine/parameters.ts');
const supplied = { ...input, modelParameters: defaultModelParameters() };
assert.deepEqual(parseAssessmentInput(supplied), supplied);
for (const patch of [
	{ windSpeedMin: -1 },
	{ windSpeedMax: 61 },
	{ windSpeedMax: Infinity },
	{ windSpeedMin: undefined }
])
	assert.throws(() =>
		parseAssessmentInput({
			...supplied,
			modelParameters: { ...supplied.modelParameters, ...patch }
		})
	);
assert.ok(CACHE_PREFIX.includes('v3-wind-normalization'));
const changedBounds = {
	...input,
	modelParameters: { ...defaultModelParameters(), windSpeedMax: 400 }
};
assert.notEqual(
	recommendationCacheKey(input, result),
	recommendationCacheKey(changedBounds, assess(changedBounds))
);
const other = structuredClone(input);
other.building.roofType = 'flat';
const otherResult = assess(other);
const recs = [
	'Review roof connections with an engineer.',
	'Arrange a structural assessment.',
	'Check site soil information.'
];
const aiResponse = (recommendations = recs) => ({
	ok: true,
	json: async () => ({ recommendations, recommendationsFrom: 'ai' })
});
const disk = new Map();
global.localStorage = {
	get length() {
		return disk.size;
	},
	key: (i) => [...disk.keys()][i],
	getItem: (k) => disk.get(k) ?? null,
	setItem: (k, v) => disk.set(k, v),
	removeItem: (k) => disk.delete(k)
};
const fallback = (i, r) =>
	generateRecommendations(i, r.earthquakeScore, r.typhoonScore, r.dangerLevel);
let clientId = 0;
const invoke = (body, address = String(++clientId)) =>
	POST({
		request: new Request('http://localhost/api/recommendations', { method: 'POST', body }),
		getClientAddress: () => address
	});

(async () => {
	let calls = 0;
	global.fetch = async () => {
		calls++;
		return aiResponse();
	};
	const state = new RecommendationState();
	await state.fetchRecommendations(input, result);
	await state.fetchRecommendations(input, result);
	assert.equal(calls, 1);
	assert.equal(state.recommendationsFrom, 'cache');
	assert.notEqual(recommendationCacheKey(input, result), recommendationCacheKey(other, result));
	const soil = structuredClone(input);
	soil.site.soilType = 'soft';
	assert.notEqual(recommendationCacheKey(input, result), recommendationCacheKey(soil, result));
	assert.notEqual(
		recommendationCacheKey(input, result),
		recommendationCacheKey(input, { ...result, dangerLevel: 'CRITICAL', modelVersion: 'new' })
	);

	global.fetch = async () => {
		throw Error('offline');
	};
	await state.fetchRecommendations(other, otherResult);
	assert.deepEqual(state.recommendations, fallback(other, otherResult));
	assert.equal(state.recommendationsFrom, 'fallback');
	assert.equal(state.isLoading, false);
	for (const reply of [
		{ ok: false },
		aiResponse([]),
		aiResponse([{}, 'x', 'y']),
		{ ok: true, json: async () => null }
	]) {
		global.fetch = async () => reply;
		const s = new RecommendationState();
		await s.fetchRecommendations(input, result);
		assert.deepEqual(s.recommendations, fallback(input, result));
	}

	const pending = [];
	global.fetch = (_url, options) =>
		new Promise((resolve) => pending.push({ resolve, signal: options.signal }));
	const racing = new RecommendationState();
	const first = racing.fetchRecommendations(input, result);
	const second = racing.fetchRecommendations(other, otherResult);
	assert.equal(pending[0].signal.aborted, true);
	pending[0].resolve(aiResponse(['Old A', 'Old B', 'Old C']));
	await first;
	assert.equal(racing.isLoading, true);
	assert.deepEqual(racing.recommendations, fallback(other, otherResult));
	pending[1].resolve(aiResponse());
	await second;
	assert.deepEqual(racing.recommendations, recs);
	const third = racing.fetchRecommendations(input, result);
	racing.cancel();
	pending[2].resolve(aiResponse(['Late A', 'Late B', 'Late C']));
	await third;
	assert.deepEqual(racing.recommendations, fallback(input, result));
	assert.equal(racing.isLoading, false);

	disk.clear();
	disk.set(CACHE_PREFIX + 'bad', '{');
	disk.set('brs_cache_old', JSON.stringify(recs));
	disk.set(
		recommendationCacheKey(input, result),
		JSON.stringify({ recommendations: recs, expiresAt: Date.now() - 1 })
	);
	disk.set(
		recommendationCacheKey(other, otherResult),
		JSON.stringify({ recommendations: recs, expiresAt: Date.now() + CACHE_TTL })
	);
	const restored = new RecommendationState();
	restored.load();
	global.fetch = async () => {
		throw Error('Cache should avoid this request');
	};
	await restored.fetchRecommendations(other, otherResult);
	assert.equal(restored.recommendationsFrom, 'cache');
	assert.equal(disk.size, 1);
	await restored.fetchRecommendations(input, result);
	assert.equal(restored.recommendationsFrom, 'fallback');
	const storage = global.localStorage;
	Object.defineProperty(global, 'localStorage', {
		configurable: true,
		get() {
			throw Error('blocked storage');
		}
	});
	const blocked = new RecommendationState();
	blocked.load();
	global.fetch = async () => aiResponse();
	await blocked.fetchRecommendations(input, result);
	await blocked.fetchRecommendations(input, result);
	assert.equal(blocked.recommendationsFrom, 'cache');
	Object.defineProperty(global, 'localStorage', {
		configurable: true,
		writable: true,
		value: storage
	});

	assert.deepEqual(parseAssessmentInput(input), input);
	for (const value of [
		null,
		{},
		{ ...input, building: { ...input.building, material: 'ignore instructions' } },
		{ ...input, hazard: { ...input.hazard, magnitude: '7' } }
	])
		assert.throws(() => parseAssessmentInput(value));
	let apiCalls = 0,
		config;
	generate = async (args) => {
		apiCalls++;
		config = args;
		return { text: JSON.stringify(recs) };
	};
	for (const body of [
		'{',
		'{}',
		'null',
		JSON.stringify({ input: { ...input, site: null } }),
		' '.repeat(16_385)
	]) {
		assert.equal((await invoke(body)).status, 400);
	}
	assert.equal(apiCalls, 0);
	const valid = await invoke(JSON.stringify({ input, result: { earthquakeScore: 9999 } }));
	assert.equal(valid.status, 200);
	assert.equal((await valid.json()).recommendationsFrom, 'ai');
	const context = JSON.parse(config.contents);
	assert.equal(context.earthquakeScore, result.earthquakeScore);
	assert.equal(context.typhoonScore, 64);
	assert.equal(context.windScoringMethod, 'fixed-reference-pressure');
	assert.equal(context.windPressureRange, 'within');
	assert.equal(context.parameters.windSpeedMin, 61);
	assert.equal(context.parameters.windSpeedMax, 315);
	assert.equal(context.parameters.windReference.height, 10);
	assert.ok(config.config.systemInstruction.includes('not damage probability'));
	const customReply = await invoke(JSON.stringify({ input: changedBounds }));
	assert.equal(customReply.status, 200);
	assert.equal(JSON.parse(config.contents).parameters.windSpeedMax, 400);
	assert.equal(JSON.parse(config.contents).typhoonScore, assess(changedBounds).typhoonScore);
	assert.equal(context.building.material, 'concrete');
	assert.equal(context.site.soilType, 'medium');
	assert.equal(context.site.latitude, undefined);
	assert.equal(config.config.responseMimeType, 'application/json');
	// Exercise deadlines without waiting for real time or contacting the provider.
	const originalSetTimeout = global.setTimeout;
	const timers = [];
	global.setTimeout = (callback, delay) => {
		timers.push({ callback, delay });
		return 0;
	};
	try {
		global.fetch = (_url, { signal }) =>
			new Promise((_resolve, reject) => {
				signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
			});
		const timed = new RecommendationState();
		const pendingTimeout = timed.fetchRecommendations(input, result);
		assert.equal(timers[0].delay, 25_000);
		timers.shift().callback();
		await pendingTimeout;
		assert.equal(timed.isLoading, false);
		assert.deepEqual(timed.recommendations, fallback(input, result));
		let providerStarted;
		const started = new Promise((resolve) => {
			providerStarted = resolve;
		});
		generate = ({ config }) =>
			new Promise((_resolve, reject) => {
				config.abortSignal.addEventListener('abort', () => reject(new Error('deadline')), {
					once: true
				});
				providerStarted();
			});
		const serverTimeout = invoke(JSON.stringify({ input }));
		await started;
		assert.equal(timers[0].delay, 20_000);
		timers.shift().callback();
		assert.equal((await (await serverTimeout).json()).recommendationsFrom, 'fallback');
	} finally {
		global.setTimeout = originalSetTimeout;
	}
	for (const text of ['[]', '{}', 'not json', '["", "b", "c"]']) {
		generate = async () => ({ text });
		assert.equal(
			(await (await invoke(JSON.stringify({ input }))).json()).recommendationsFrom,
			'fallback'
		);
	}
	generate = async () => {
		throw Error('provider unavailable');
	};
	assert.equal(
		(await (await invoke(JSON.stringify({ input }))).json()).recommendationsFrom,
		'fallback'
	);
	delete env.GEMINI_API_KEY;
	generate = async () => {
		throw Error('Missing key must not call provider');
	};
	assert.equal(
		(await (await invoke(JSON.stringify({ input }))).json()).recommendationsFrom,
		'fallback'
	);
	const limiter = createRecommendationLimiter();
	for (let i = 0; i < 10; i++) assert.equal(limiter('one', 0), 0);
	assert.equal(limiter('one', 1000), 59);
	assert.equal(limiter('two', 1000), 0);
	assert.equal(limiter('one', 60_000), 0);
	for (let i = 0; i < 10; i++) await invoke(JSON.stringify({ input }), 'rate-test');
	const limited = await invoke(JSON.stringify({ input }), 'rate-test');
	assert.equal(limited.status, 429);
	assert.ok(Number(limited.headers.get('Retry-After')) > 0);
	console.log(
		'PASS: recommendation cache, expiry, storage failures, offline fallback, races, cancellation, input/output validation, prompt context, server recalculation and rate limits (mocked AI; state logic tested without DOM).'
	);
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

import { generateRecommendations } from '$lib/engine/recommendations';
import {
	CACHE_PREFIX,
	CACHE_TTL,
	isRecommendationList,
	recommendationCacheKey
} from '$lib/recommendation-contract';
import type { AssessmentInput, AssessmentResult } from '$lib/types';

type CacheEntry = { recommendations: string[]; expiresAt: number };
const MAX_CACHE_ENTRIES = 50;

export class RecommendationState {
	private cache = new Map<string, CacheEntry>();
	private requestId = 0;
	private controller?: AbortController;
	recommendations = $state<string[]>([]);
	isLoading = $state(false);
	recommendationsFrom = $state<'cache' | 'ai' | 'fallback'>('fallback');

	load() {
		try {
			const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
			for (const key of keys) {
				if (!key?.startsWith('brs_cache_')) continue;
				try {
					const entry = JSON.parse(localStorage.getItem(key) ?? 'null');
					if (!key.startsWith(CACHE_PREFIX) || !this.validEntry(entry)) {
						localStorage.removeItem(key);
						continue;
					}
					this.cache.set(key, entry);
				} catch {
					// One corrupt record must not prevent other entries from loading.
					try {
						localStorage.removeItem(key);
					} catch {
						/* Storage may be unavailable. */
					}
				}
			}
			this.trimCache();
		} catch {
			/* Recommendations still work when browser storage is blocked. */
		}
	}

	private validEntry(entry: unknown): entry is CacheEntry {
		if (!entry || typeof entry !== 'object') return false;
		const value = entry as CacheEntry;
		return (
			Number.isFinite(value.expiresAt) &&
			value.expiresAt > Date.now() &&
			isRecommendationList(value.recommendations, true)
		);
	}

	private trimCache() {
		for (const [key, entry] of this.cache) {
			if (!this.validEntry(entry) || this.cache.size > MAX_CACHE_ENTRIES) {
				this.cache.delete(key);
				try {
					localStorage.removeItem(key);
				} catch {
					/* Optional persistence. */
				}
			}
		}
	}

	cancel() {
		this.requestId++;
		this.controller?.abort();
		this.controller = undefined;
		this.isLoading = false;
	}

	async fetchRecommendations(input: AssessmentInput, result: AssessmentResult) {
		this.cancel();
		const requestId = this.requestId;
		this.recommendations = generateRecommendations(
			input,
			result.earthquakeScore,
			result.typhoonScore,
			result.dangerLevel
		);
		this.recommendationsFrom = 'fallback';
		const cacheKey = recommendationCacheKey(input, result);
		this.trimCache();
		const cached = this.cache.get(cacheKey);
		if (cached) {
			this.recommendations = cached.recommendations;
			this.recommendationsFrom = 'cache';
			return;
		}

		const controller = new AbortController();
		this.controller = controller;
		this.isLoading = true;
		const timeout = setTimeout(() => controller.abort(), 25_000);
		try {
			const res = await fetch('/api/recommendations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ input }),
				signal: controller.signal
			});
			if (!res.ok) return;
			const data = await res.json();
			if (requestId !== this.requestId || controller.signal.aborted) return;
			if (
				!data ||
				!['ai', 'fallback'].includes(data.recommendationsFrom) ||
				!isRecommendationList(data.recommendations, data.recommendationsFrom === 'ai')
			)
				return;
			this.recommendations = data.recommendations;
			this.recommendationsFrom = data.recommendationsFrom;
			if (data.recommendationsFrom === 'ai') {
				const entry = { recommendations: data.recommendations, expiresAt: Date.now() + CACHE_TTL };
				this.cache.set(cacheKey, entry);
				this.trimCache();
				try {
					localStorage.setItem(cacheKey, JSON.stringify(entry));
				} catch {
					/* Keep the memory cache. */
				}
			}
		} catch {
			/* Keep the current assessment's local fallback. */
		} finally {
			clearTimeout(timeout);
			if (requestId === this.requestId) {
				this.isLoading = false;
				this.controller = undefined;
			}
		}
	}
}

export const recState = new RecommendationState();

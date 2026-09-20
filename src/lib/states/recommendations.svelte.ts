import type { AssessmentInput, AssessmentResult } from '$lib/types';

export class RecommendationState {
	cachedRecommendations = $state<Map<string, string[]> | null>(null);
	recommendations = $state<string[]>([]);
	isLoading = $state(false);
	recommendationsFrom = $state<'cache' | 'ai' | 'fallback'>('cache');

	// Helper para sa pagkuha sa cache key base sa parameters
	private getCacheKey(result: AssessmentResult): string {
		const params = result.details?.parameters;
		const rawMaterial = params?.building?.material ?? 'concrete';
		const materialType = String(rawMaterial).trim().toLowerCase().replace(/\s+/g, '_');

		const eqBucket = Math.round(result.earthquakeScore / 5) * 5;
		const tyBucket = Math.round(result.typhoonScore / 5) * 5;

		return `brs_cache_eq${eqBucket}_ty${tyBucket}_m_${materialType}`;
	}

	// 1. Método para makuha daan ang cache (pwede gamiton sa root o paspas nga lookup)
	load() {
		console.log('loading cached recommendations');

		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			console.log(`found this key: ${key}`);

			// Pangitaa lang ang mga keys nga nagsugod sa atong cache prefix
			if (key && key.startsWith('brs_cache_')) {
				console.log('key is brs cache');

				const data = localStorage.getItem(key);
				if (data) {
					console.log(`loaded data: ${data}`);

					if (!this.cachedRecommendations) this.cachedRecommendations = new Map();
					this.cachedRecommendations.set(key, JSON.parse(data));

					console.log(`updated cached recommendations: ${this.cachedRecommendations}`);
				}
			}
		}
	}

	// 2. Método nga tawgon ig-submit o ig-kuha sa resulta
	async fetchRecommendations(input: AssessmentInput, result: AssessmentResult) {
		// I-set una ang default recommendations gikan sa props as fallback
		// this.recommendations = result.recommendations || [];

		// Susiha ang cache gamit ang atong cache lookup method
		// const cachedRecommendations = this.getCached(result);
		// if (cachedRecommendations) {
		// 	this.recommendations = cachedRecommendations;
		// 	return; // Naa na sa cache, human na!
		// }

		// Kung wala sa cache, tawga ang API sa Vercel
		const cacheKey = this.getCacheKey(result);
		console.log(this.cachedRecommendations);

		console.log('cache key', this.cachedRecommendations?.get(cacheKey));

		if (this.cachedRecommendations?.get(cacheKey)) {
			this.recommendations = this.cachedRecommendations.get(cacheKey) ?? [];
			this.recommendationsFrom = 'cache';
			return;
		}

		this.isLoading = true;

		try {
			const res = await fetch('/api/recommendations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ input, result })
			});

			const data = await res.json();
			if (data.recommendations && Array.isArray(data.recommendations)) {
				this.recommendations = data.recommendations;
				this.recommendationsFrom = data.recommendationsFrom;
				// I-save dayon sa LocalStorage para sa sunod
				if (data.recommendationsFrom == 'ai') {
					localStorage.setItem(cacheKey, JSON.stringify(this.recommendations));
				}
			}
		} catch (e) {
			console.error(e);
		} finally {
			this.isLoading = false;
		}
	}
}

export const recState = new RecommendationState();

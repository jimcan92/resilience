import { GEMINI_API_KEY } from '$env/static/private';
import { generateRecommendations } from '$lib/engine/recommendations';
import type { AssessmentInput, AssessmentResult } from '$lib/types';
import { GoogleGenAI } from '@google/genai';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Initialize ang Google Gen AI client gamit ang imong private key
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const POST: RequestHandler = async ({ request }) => {
	const { input, result }: { input: AssessmentInput; result: AssessmentResult } =
		await request.json();
	try {
		// Paghimo og maayong prompt base sa assessment data sa user
		const prompt = `You are a structural engineering expert in the Philippines specializing in building resilience (earthquakes and typhoons).
        Based on this assessment result:
        - Danger Level: ${result.dangerLevel}
        - Resilience Index: ${result.resilienceIndex * 100}%
        - Earthquake Score (HE): ${result.earthquakeScore}/100 (PGA:${result.details?.pga?.toFixed(3)}g)
        - Typhoon Score (HT): ${result.typhoonScore}/100 (Wind Pressure:${result.details?.windPressure} Pa)
        - Material/Details: ${JSON.stringify(result.details?.parameters?.hazard ?? {})}

        Provide 3 to 4 short, highly practical, and actionable structural recommendations for improving building resilience in the Philippines (aligned with local conditions/NSCP standards if applicable).
        Return the response strictly as a JSON array of strings (e.g., ["Recommendation 1", "Recommendation 2", "Recommendation 3"]). Do not include markdown code block syntax like \`\`\`json, just return the raw JSON array string or clean text.`;

		// Gamita ang gemini-2.5-flash (o ang pinakabag-o nga flash model)
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt
		});

		const textResponse = response.text ?? '[]';

		// I-clean ang response kung naay markdown ticks
		const cleanedText = textResponse
			.replace(/```json/g, '')
			.replace(/```/g, '')
			.trim();
		const recommendations = JSON.parse(cleanedText);

		return json({ recommendations, recommendationsFrom: 'ai' });
	} catch (error) {
		const recommendations = generateRecommendations(
			input,
			result.earthquakeScore,
			result.typhoonScore,
			result.dangerLevel
		);
		return json({ recommendations, recommendationsFrom: 'fallback' });
	}
};

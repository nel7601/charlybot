import { json, error } from '@sveltejs/kit';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import { cocktails } from '$lib/data/cocktails.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({
	apiKey: env.OPENAI_API_KEY
}) : null;

/**
 * Use GPT to intelligently identify cocktail from transcribed text
 * @param {string} transcript - Text from Whisper transcription
 * @returns {Promise<import('$lib/data/cocktails.js').Cocktail | null>}
 */
async function identifyCocktailWithGPT(transcript) {
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4.1-nano',
			messages: [
				{
					role: 'system',
					content: `You are a bartender assistant. Analyze the customer's speech and identify which cocktail they want from the menu.

Available cocktails:
- mojito (Mojito)
- cuba-libre (Cuba Libre)
- cubata (Cubata)
- whiskey-rocks (Whiskey on the Rocks)
- neat-whiskey (Neat Whiskey)
- whiskey-highball (Whiskey Highball)
- whiskey-coke (Whiskey and Coke)

Instructions:
- If the customer mentions a cocktail from the menu, return ONLY the cocktail ID (e.g., "mojito", "cuba-libre")
- Handle natural language: "quiero un mojito" → "mojito"
- Handle changes: "mejor dame un whiskey" → use context to pick a whiskey option
- If multiple whiskeys mentioned without specifics, prefer "whiskey-rocks"
- If unclear or no cocktail mentioned, return "none"
- Return ONLY the ID, nothing else`
				},
				{
					role: 'user',
					content: transcript
				}
			],
			temperature: 0,
			max_tokens: 20
		});

		const cocktailId = completion.choices[0].message.content.trim().toLowerCase();

		if (cocktailId === 'none' || !cocktailId) {
			return null;
		}

		// Find the cocktail by ID
		const cocktail = cocktails.find(c => c.id === cocktailId);
		return cocktail || null;

	} catch (err) {
		console.error('GPT cocktail identification error:', err);
		return null;
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const formData = await request.formData();
		const audioFile = formData.get('audio');

		if (!audioFile || !(audioFile instanceof File)) {
			throw error(400, 'No audio file provided');
		}

		// Verify API key is configured
		if (!env.OPENAI_API_KEY || !openai) {
			throw error(500, 'OpenAI API key not configured');
		}

		// Convert File to format compatible with OpenAI
		const audioBuffer = await audioFile.arrayBuffer();
		const audioBlob = new Blob([audioBuffer], { type: audioFile.type });

		// Create a File object with proper name
		const file = new File([audioBlob], 'audio.webm', { type: audioFile.type });

		// Transcribe audio using Whisper (auto-detect language)
		const transcription = await openai.audio.transcriptions.create({
			file: file,
			model: 'whisper-1',
			prompt: 'Cocktail order. Drinks: mojito, cuba libre, cubata, whiskey on the rocks, neat whiskey, whiskey highball, whiskey and coke.'
		});

		const transcript = transcription.text;

		// Use GPT to intelligently identify cocktail
		const cocktail = await identifyCocktailWithGPT(transcript);

		if (!cocktail) {
			return json({
				success: false,
				transcript,
				message: 'Could not identify cocktail from your command. Please try again.',
				availableCocktails: cocktails.map(c => c.name)
			});
		}

		return json({
			success: true,
			transcript,
			cocktail: {
				id: cocktail.id,
				name: cocktail.name
			}
		});

	} catch (err) {
		console.error('Voice recognition error:', err);

		if (err.status === 400 || err.status === 500) {
			throw err;
		}

		throw error(500, {
			message: 'Error processing voice command',
			details: err.message
		});
	}
}

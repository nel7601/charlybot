import { json, error } from '@sveltejs/kit';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import { cocktails } from '$lib/data/cocktails.js';

const openai = env.OPENAI_API_KEY ? new OpenAI({
	apiKey: env.OPENAI_API_KEY
}) : null;

/**
 * Normalize text for comparison
 * @param {string} text
 */
function normalizeText(text) {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remove accents
		.replace(/[^a-z0-9\s]/g, '') // Remove special chars
		.trim();
}

/**
 * Find cocktail from transcribed text
 * @param {string} transcript
 */
function findCocktailFromTranscript(transcript) {
	const normalized = normalizeText(transcript);

	// Build a map of possible names/keywords for each cocktail
	const cocktailKeywords = {
		'mojito': ['mojito'],
		'cuba-libre': ['cuba libre', 'cubalibre', 'cuba'],
		'cubata': ['cubata'],
		'whiskey-rocks': ['whiskey on the rocks', 'whiskey rocks', 'whisky on the rocks', 'whisky rocks', 'whiskey con hielo'],
		'neat-whiskey': ['neat whiskey', 'whiskey neat', 'whisky neat', 'whiskey solo', 'whisky solo'],
		'whiskey-highball': ['whiskey highball', 'whisky highball', 'highball'],
		'whiskey-coke': ['whiskey and coke', 'whiskey coke', 'whisky and coke', 'whisky coke', 'whiskey con coca', 'whisky con coca']
	};

	// Check for each cocktail
	for (const [cocktailId, keywords] of Object.entries(cocktailKeywords)) {
		for (const keyword of keywords) {
			if (normalized.includes(normalizeText(keyword))) {
				return cocktails.find(c => c.id === cocktailId);
			}
		}
	}

	return null;
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

		// Transcribe audio using Whisper
		const transcription = await openai.audio.transcriptions.create({
			file: file,
			model: 'whisper-1',
			language: 'es', // Spanish, adjust if needed
			prompt: 'Esta es una orden de cóctel. Posibles bebidas: mojito, cuba libre, cubata, whiskey on the rocks, neat whiskey, whiskey highball, whiskey and coke.'
		});

		const transcript = transcription.text;

		// Find matching cocktail
		const cocktail = findCocktailFromTranscript(transcript);

		if (!cocktail) {
			return json({
				success: false,
				transcript,
				message: 'No se pudo identificar el cóctel. Por favor, intenta de nuevo.',
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

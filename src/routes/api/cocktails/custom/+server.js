import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { ingredients } = await request.json();

		if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
			return json({ error: true, message: 'No ingredients selected' }, { status: 400 });
		}

		const client = await getModbusClient();

		// Map ingredient IDs to Modbus addresses
		const ingredientMap = {
			'mint': 132,       // Mint
			'ice': 134,        // Ice
			'syrup': 135,      // Syrup
			'lime': 136,       // Lime
			'white-rum': 137,  // White Rum
			'dark-rum': 138,   // Dark Rum
			'whiskey': 139,    // Whiskey
			'soda': 140,       // Soda
			'coke': 141        // Coke
		};

		// Check if soda or coke is included
		const hasMixer = ingredients.includes('soda') || ingredients.includes('coke');
		const hasMint = ingredients.includes('mint');

		// Write each selected ingredient to Modbus
		for (const ingredientId of ingredients) {
			const address = ingredientMap[ingredientId];
			if (address) {
				await client.writeCoil(address, true);
				console.log(`Custom drink: Activated ${ingredientId} at address ${address}`);
			}
		}

		// If mint is selected, also activate muddling
		if (hasMint) {
			await client.writeCoil(133, true); // muddling
			console.log('Custom drink: Activated muddling at address 133');
		}

		// If soda or coke is included, activate stirring and straw
		if (hasMixer) {
			await client.writeCoil(142, true); // stirring
			await client.writeCoil(143, true); // straw
			console.log('Custom drink: Activated stirring at address 142');
			console.log('Custom drink: Activated straw at address 143');
		}

		// Write to custom drink address (106)
		await client.writeCoil(106, true);
		console.log('Custom drink: Activated custom address 106');

		// Write to start address (96) to tell robot to begin
		await client.writeCoil(96, true);
		console.log('Custom drink: Activated start signal at address 96');

		console.log('Custom cocktail order placed successfully');

		return json({
			success: true,
			message: 'Custom cocktail order placed',
			ingredients: ingredients,
			extras: {
				muddling: hasMint,
				stirring: hasMixer,
				straw: hasMixer
			}
		});

	} catch (error) {
		console.error('Error ordering custom cocktail:', error);
		return json({
			error: true,
			message: error.message || 'Failed to order custom cocktail'
		}, { status: 500 });
	}
}

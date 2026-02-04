import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';
import { getCustomWriteAddresses, ADDRESS_RANGES, COCKTAILS } from '$lib/modbus/registry.js';

const MODBUS_WRITE_DELAY_MS = 50; // Delay between Modbus write operations (good practice)

/**
 * Helper function to add delay between Modbus operations
 * Prevents saturating the Modbus server
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { ingredients } = await request.json();

		if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
			return json({ error: true, message: 'No ingredients selected' }, { status: 400 });
		}

		const client = await getModbusClient();

		// Get write addresses using registry function
		const { addresses, extras } = getCustomWriteAddresses(ingredients);

		// Write each address to Modbus
		for (const address of addresses) {
			await client.writeCoil(address, true);
			console.log(`Custom drink: Activated address ${address}`);
			await delay(MODBUS_WRITE_DELAY_MS); // Prevent saturating Modbus server
		}

		// Write to custom drink address
		await client.writeCoil(ADDRESS_RANGES.CUSTOM_COCKTAIL, true);
		console.log(`Custom drink: Activated custom address ${ADDRESS_RANGES.CUSTOM_COCKTAIL}`);
		await delay(MODBUS_WRITE_DELAY_MS);

		// Write to start address to tell robot to begin
		await client.writeCoil(ADDRESS_RANGES.START_SIGNAL, true);
		console.log(`Custom drink: Activated start signal at address ${ADDRESS_RANGES.START_SIGNAL}`);

		// Note: Frontend will monitor status via /api/status polling
		// When 91 = 1 (drinkReady), frontend calls /api/reset-addresses
		// Popup closes when 92 = 1 (waitingRecipe)

		console.log('Custom cocktail order placed successfully');

		return json({
			success: true,
			message: 'Custom cocktail order placed',
			ingredients: ingredients,
			extras: extras
		});

	} catch (error) {
		console.error('Error ordering custom cocktail:', error);
		return json({
			error: true,
			message: error.message || 'Failed to order custom cocktail'
		}, { status: 500 });
	}
}

import { json, error } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';
import { getCocktailById } from '$lib/data/cocktails.js';
import { getCocktailWriteAddresses, ADDRESS_RANGES } from '$lib/modbus/registry.js';

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
export async function POST({ params }) {
	const cocktailId = params.id;
	const cocktail = getCocktailById(cocktailId);

	if (!cocktail) {
		throw error(404, `Cocktail ${cocktailId} not found`);
	}

	const recipe = getCocktailWriteAddresses(cocktailId);
	if (!recipe) {
		throw error(404, `Recipe not found for cocktail ${cocktailId}`);
	}

	try {
		const client = await getModbusClient();

		// Check if robot is ready (address 92)
		// Address 92 = 1 (waitingRecipe = true) means robot is READY to receive orders
		// Address 92 = 0 (waitingRecipe = false) means robot is BUSY
		// All variables are COILS in RobotStudio
		try {
			const readyCheck = await client.readCoils(ADDRESS_RANGES.SYSTEM_START + 2, 1); // 92 = 90 + 2
			const waitingRecipe = readyCheck.data[0];
			console.log(`[Modbus] Robot status check - Address ${ADDRESS_RANGES.SYSTEM_START + 2} (waitingRecipe) = ${waitingRecipe ? 1 : 0}`);

			if (waitingRecipe === false) {
				// Robot is busy (92 = 0)
				throw error(503, 'Robot is busy preparing another drink. Please wait.');
			}
			// Robot is ready (92 = 1), continue with order
			console.log('[Modbus] ✓ Robot ready to receive order');
		} catch (readError) {
			// If read fails, propagate error
			if (readError.message && readError.message.includes('Robot is busy')) {
				throw readError; // Re-throw the 503 error
			}
			console.warn('[Modbus] Could not read robot status at address 92:', readError.message);
			// Continue with order attempt even if status check fails
		}

		// Write to all ingredient addresses for this cocktail
		console.log(`[Modbus] Writing ingredients for ${cocktail.name}`);
		for (const ingredientAddress of recipe.ingredients) {
			await client.writeCoil(ingredientAddress, true);
			console.log(`[Modbus]   ✓ Ingredient address ${ingredientAddress} = 1`);
			await delay(MODBUS_WRITE_DELAY_MS); // Prevent saturating Modbus server
		}

		// Write to the cocktail address
		console.log(`[Modbus] Triggering cocktail at address ${recipe.address}`);
		await client.writeCoil(recipe.address, true);
		await delay(MODBUS_WRITE_DELAY_MS);

		// Write to start address (96) to tell robot to begin
		await client.writeCoil(96, true);
		console.log(`[Modbus] Activated start signal at address 96`);

		// Note: Frontend will monitor status via /api/status polling
		// When 91 = 1 (drinkReady), frontend calls /api/reset-addresses
		// Popup closes when 92 = 1 (waitingRecipe)

		return json({
			success: true,
			message: `Started preparing ${cocktail.name}`,
			cocktailId: cocktail.id,
			ingredientsWritten: recipe.ingredients.length
		});

	} catch (err) {
		console.error('[Modbus] Error:', err);

		// Handle specific Modbus errors
		if (err.modbusCode === 1) {
			throw error(500, 'Modbus function not supported. The device may not support coils. Run: node scripts/test-modbus-support.js');
		} else if (err.modbusCode === 2) {
			throw error(500, `Invalid address ${cocktail?.modbusAddress || 'unknown'}. The device doesn't have a coil/register at this address. Run: node scripts/test-modbus-support.js`);
		} else if (err.modbusCode === 3) {
			throw error(500, 'Invalid data value in Modbus response.');
		} else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
			throw error(503, 'Robot connection lost. Please check network.');
		}

		const errorMessage = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
		throw error(500, `Failed to trigger cocktail preparation: ${errorMessage}`);
	}
}

import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';
import { getResetAddresses } from '$lib/modbus/registry.js';

const MODBUS_WRITE_DELAY_MS = 50; // Delay between Modbus write operations

/**
 * Helper function to add delay between Modbus operations
 * @param {number} ms
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reset all Modbus addresses when drink is ready (91 = 1)
 * Called by frontend when it detects drinkReady state
 *
 * @type {import('./$types').RequestHandler}
 */
export async function POST() {
	try {
		const client = await getModbusClient();

		console.log('[Reset] Starting address reset (triggered by 91 = 1)...');

		// Get reset addresses from registry
		const resetAddresses = getResetAddresses();

		// Reset cocktail addresses
		console.log(`[Reset] Resetting cocktail addresses (${resetAddresses.cocktails[0]}-${resetAddresses.cocktails[resetAddresses.cocktails.length - 1]})...`);

		for (const address of resetAddresses.cocktails) {
			try {
				await client.writeCoil(address, false);
				console.log(`[Reset]   ✓ Address ${address} = 0`);
				await delay(MODBUS_WRITE_DELAY_MS);
			} catch (err) {
				console.error(`[Reset]   ✗ Failed to reset address ${address}:`, err.message);
			}
		}

		// Reset ingredient addresses
		console.log(`[Reset] Resetting ingredient addresses (${resetAddresses.ingredients[0]}-${resetAddresses.ingredients[resetAddresses.ingredients.length - 1]})...`);

		for (const address of resetAddresses.ingredients) {
			try {
				await client.writeCoil(address, false);
				console.log(`[Reset]   ✓ Ingredient address ${address} = 0`);
				await delay(MODBUS_WRITE_DELAY_MS);
			} catch (err) {
				console.error(`[Reset]   ✗ Failed to reset ingredient address ${address}:`, err.message);
			}
		}

		// Reset start signal
		try {
			await client.writeCoil(resetAddresses.startSignal, false);
			console.log(`[Reset]   ✓ Start signal (${resetAddresses.startSignal}) = 0`);
		} catch (err) {
			console.error(`[Reset]   ✗ Failed to reset start signal:`, err.message);
		}

		console.log('[Reset] ✓ All addresses reset complete');

		return json({
			success: true,
			message: 'All addresses reset successfully'
		});

	} catch (error) {
		console.error('[Reset] Error:', error);
		return json({
			success: false,
			error: error.message || 'Failed to reset addresses'
		}, { status: 500 });
	}
}

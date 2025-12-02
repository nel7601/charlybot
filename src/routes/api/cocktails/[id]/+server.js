import { json, error } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';
import { getCocktailById } from '$lib/data/cocktails.js';

const MONITORING_ADDRESS = 91; // Address to monitor for completion signal
const POLL_INTERVAL_MS = 2000; // Check every 2 seconds (increased to reduce concurrent operations)
const MAX_MONITORING_TIME_MS = 120000; // Stop monitoring after 2 minutes (safety timeout)

/**
 * Monitor address 91 and reset ALL cocktail triggers (100-106) when it becomes 1
 * @param {import('modbus-serial')} client
 * @param {number} cocktailAddress - The address that was triggered
 * @param {string} cocktailName
 */
function monitorAddressAndReset(client, cocktailAddress, cocktailName) {
	const startTime = Date.now();
	let intervalId;
	let isResetting = false; // Prevent multiple concurrent resets

	const checkAddress = async () => {
		// Skip if already resetting
		if (isResetting) {
			console.log(`[Modbus] Reset in progress, skipping check...`);
			return;
		}

		try {
			// Check if maximum monitoring time exceeded
			if (Date.now() - startTime > MAX_MONITORING_TIME_MS) {
				clearInterval(intervalId);
				console.warn(`[Modbus] Monitoring timeout for ${cocktailName}. Resetting all cocktail addresses.`);
				isResetting = true;
				await resetAllCocktailAddresses(client);
				return;
			}

			// Try to read address 91 as discrete input first
			let signalValue = false;
			try {
				const result = await client.readDiscreteInputs(MONITORING_ADDRESS, 1);
				signalValue = result.data[0];
				console.log(`[Modbus] Monitor check - Address ${MONITORING_ADDRESS} = ${signalValue ? 1 : 0}`);
			} catch (readError) {
				// If discrete input fails, try reading as coil
				if (readError.modbusCode === 2 || readError.modbusCode === 1) {
					const result = await client.readCoils(MONITORING_ADDRESS, 1);
					signalValue = result.data[0];
					console.log(`[Modbus] Monitor check (coil) - Address ${MONITORING_ADDRESS} = ${signalValue ? 1 : 0}`);
				} else {
					throw readError;
				}
			}

			// If address 91 is 1 (true), reset ALL cocktail triggers (100-107)
			if (signalValue === true) {
				clearInterval(intervalId);
				isResetting = true;
				console.log(`[Modbus] ✓ Address ${MONITORING_ADDRESS} activated! Resetting all cocktail addresses (100-107)...`);
				await resetAllCocktailAddresses(client);
				console.log(`[Modbus] ✓ Reset complete for ${cocktailName}`);
			}
		} catch (err) {
			// Only log, don't try to reset on monitoring errors
			console.error(`[Modbus] ✗ Error monitoring address ${MONITORING_ADDRESS}:`, err.message);
			// Don't clear interval or try to reset - just skip this check and try again
		}
	};

	// Start polling
	console.log(`[Modbus] Started monitoring address ${MONITORING_ADDRESS} for ${cocktailName} completion`);
	intervalId = setInterval(checkAddress, POLL_INTERVAL_MS);

	// Perform first check after a small delay to let the cocktail start
	setTimeout(checkAddress, 1000);
}

/**
 * Reset ALL cocktail addresses (100-107) to 0
 * This ensures only one cocktail can be active at a time
 * @param {import('modbus-serial')} client
 */
async function resetAllCocktailAddresses(client) {
	const COCKTAIL_ADDRESSES = [100, 101, 102, 103, 104, 105, 106, 107];

	console.log(`[Modbus] Resetting all cocktail addresses (100-107)...`);

	for (const address of COCKTAIL_ADDRESSES) {
		try {
			await client.writeCoil(address, false);
			console.log(`[Modbus]   ✓ Address ${address} = 0`);
		} catch (err) {
			console.error(`[Modbus]   ✗ Failed to reset address ${address}:`, err.message);
		}
	}

	console.log(`[Modbus] ✓ All cocktail addresses reset complete`);
}

/**
 * Map cocktail IDs to their ingredient addresses
 */
const COCKTAIL_RECIPES = {
	'mojito': {
		address: 100,
		ingredients: [132, 133, 135, 136, 134, 137, 140, 142, 143] // mint, muddling, syrup, lime, ice, white-rum, soda, stirring, straw
	},
	'cuba-libre': {
		address: 101,
		ingredients: [134, 137, 136, 141, 142, 143] // ice, white-rum, lime, coke, stirring, straw
	},
	'cubata': {
		address: 102,
		ingredients: [134, 138, 141, 142, 143] // ice, dark-rum, coke, stirring, straw
	},
	'whiskey-rocks': {
		address: 103,
		ingredients: [134, 139] // ice, whiskey
	},
	'neat-whiskey': {
		address: 104,
		ingredients: [139] // whiskey only
	},
	'whiskey-highball': {
		address: 105,
		ingredients: [134, 139, 140, 142, 143] // ice, whiskey, soda, stirring, straw
	},
	'whiskey-coke': {
		address: 106,
		ingredients: [134, 139, 141, 142, 143] // ice, whiskey, coke, stirring, straw
	}
};

/** @type {import('./$types').RequestHandler} */
export async function POST({ params }) {
	const cocktailId = params.id;
	const cocktail = getCocktailById(cocktailId);

	if (!cocktail) {
		throw error(404, `Cocktail ${cocktailId} not found`);
	}

	const recipe = COCKTAIL_RECIPES[cocktailId];
	if (!recipe) {
		throw error(404, `Recipe not found for cocktail ${cocktailId}`);
	}

	try {
		const client = await getModbusClient();

		// Check if robot is ready (address 92)
		// Try reading as a discrete input (status bit) instead of holding register
		try {
			const readyCheck = await client.readDiscreteInputs(92, 1);
			console.log('[Modbus] Robot ready check:', readyCheck.data[0]);
			if (readyCheck.data[0] === true) {
				throw error(503, 'Robot is not ready. Please wait for current operation to complete.');
			}
		} catch (readError) {
			// If discrete inputs don't work, try coils
			if (readError.modbusCode === 2 || readError.modbusCode === 1) {
				console.log('[Modbus] Discrete input not available, trying coil...');
				try {
					const readyCheck = await client.readCoils(92, 1);
					console.log('[Modbus] Robot ready check (coil):', readyCheck.data[0]);
					if (readyCheck.data[0] === true) {
						throw error(503, 'Robot is not ready. Please wait for current operation to complete.');
					}
				} catch (coilError) {
					// If both fail, log warning but continue (robot status check optional)
					console.warn('[Modbus] Could not read robot status at address 92:', coilError.message);
				}
			} else {
				throw readError;
			}
		}

		// Write to all ingredient addresses for this cocktail
		console.log(`[Modbus] Writing ingredients for ${cocktail.name}`);
		for (const ingredientAddress of recipe.ingredients) {
			await client.writeCoil(ingredientAddress, true);
			console.log(`[Modbus]   ✓ Ingredient address ${ingredientAddress} = 1`);
		}

		// Write to the cocktail address
		console.log(`[Modbus] Triggering cocktail at address ${recipe.address}`);
		await client.writeCoil(recipe.address, true);

		// Write to start address (96) to tell robot to begin
		await client.writeCoil(96, true);
		console.log(`[Modbus] Activated start signal at address 96`);

		// Start monitoring address 91 to reset the cocktail trigger
		// When address 91 becomes 1, reset the cocktail address to 0
		monitorAddressAndReset(client, recipe.address, cocktail.name);

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

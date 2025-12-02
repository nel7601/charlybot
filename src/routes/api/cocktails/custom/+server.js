import { json } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';

const MODBUS_WRITE_DELAY_MS = 50; // Delay between Modbus write operations (good practice)
const MONITORING_ADDRESS = 91; // Address to monitor for completion signal
const POLL_INTERVAL_MS = 2000; // Check every 2 seconds
const MAX_MONITORING_TIME_MS = 120000; // Stop monitoring after 2 minutes (safety timeout)

/**
 * Helper function to add delay between Modbus operations
 * Prevents saturating the Modbus server
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Monitor address 91 and reset ALL addresses when drink is ready
 * @param {import('modbus-serial')} client
 */
function monitorAndResetCustomDrink(client) {
	const startTime = Date.now();
	let intervalId;
	let isResetting = false;

	const checkAddress = async () => {
		if (isResetting) {
			console.log(`[Modbus Custom] Reset in progress, skipping check...`);
			return;
		}

		try {
			// Check if maximum monitoring time exceeded
			if (Date.now() - startTime > MAX_MONITORING_TIME_MS) {
				clearInterval(intervalId);
				console.warn(`[Modbus Custom] Monitoring timeout. Resetting all addresses.`);
				isResetting = true;
				await resetAllAddresses(client);
				return;
			}

			// Try to read address 91 as discrete input first
			let signalValue = false;
			try {
				const result = await client.readDiscreteInputs(MONITORING_ADDRESS, 1);
				signalValue = result.data[0];
				console.log(`[Modbus Custom] Monitor check - Address ${MONITORING_ADDRESS} = ${signalValue ? 1 : 0}`);
			} catch (readError) {
				// If discrete input fails, try reading as coil
				if (readError.modbusCode === 2 || readError.modbusCode === 1) {
					const result = await client.readCoils(MONITORING_ADDRESS, 1);
					signalValue = result.data[0];
					console.log(`[Modbus Custom] Monitor check (coil) - Address ${MONITORING_ADDRESS} = ${signalValue ? 1 : 0}`);
				} else {
					throw readError;
				}
			}

			// If address 91 is 1 (true), reset ALL addresses
			if (signalValue === true) {
				clearInterval(intervalId);
				isResetting = true;
				console.log(`[Modbus Custom] ✓ Address ${MONITORING_ADDRESS} activated! Drink ready - Resetting all addresses...`);
				await resetAllAddresses(client);
				console.log(`[Modbus Custom] ✓ Reset complete for custom drink`);
			}
		} catch (err) {
			console.error(`[Modbus Custom] ✗ Error monitoring address ${MONITORING_ADDRESS}:`, err.message);
		}
	};

	// Start polling
	console.log(`[Modbus Custom] Started monitoring address ${MONITORING_ADDRESS} for custom drink completion`);
	intervalId = setInterval(checkAddress, POLL_INTERVAL_MS);

	// Perform first check after a small delay
	setTimeout(checkAddress, 1000);
}

/**
 * Reset ALL addresses: cocktails (100-107) and ingredients (132-143)
 * @param {import('modbus-serial')} client
 */
async function resetAllAddresses(client) {
	const COCKTAIL_ADDRESSES = [100, 101, 102, 103, 104, 105, 106, 107];
	const INGREDIENT_ADDRESSES = [132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143];

	// Reset cocktail addresses
	console.log(`[Modbus Custom] Resetting all cocktail addresses (100-107)...`);
	for (const address of COCKTAIL_ADDRESSES) {
		try {
			await client.writeCoil(address, false);
			console.log(`[Modbus Custom]   ✓ Address ${address} = 0`);
			await delay(MODBUS_WRITE_DELAY_MS);
		} catch (err) {
			console.error(`[Modbus Custom]   ✗ Failed to reset address ${address}:`, err.message);
		}
	}

	// Reset ingredient addresses
	console.log(`[Modbus Custom] Resetting all ingredient addresses (132-143)...`);
	for (const address of INGREDIENT_ADDRESSES) {
		try {
			await client.writeCoil(address, false);
			console.log(`[Modbus Custom]   ✓ Ingredient address ${address} = 0`);
			await delay(MODBUS_WRITE_DELAY_MS);
		} catch (err) {
			console.error(`[Modbus Custom]   ✗ Failed to reset ingredient address ${address}:`, err.message);
		}
	}

	console.log(`[Modbus Custom] ✓ All addresses reset complete`);
}

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
				await delay(MODBUS_WRITE_DELAY_MS); // Prevent saturating Modbus server
			}
		}

		// If mint is selected, also activate muddling
		if (hasMint) {
			await client.writeCoil(133, true); // muddling
			console.log('Custom drink: Activated muddling at address 133');
			await delay(MODBUS_WRITE_DELAY_MS);
		}

		// If soda or coke is included, activate stirring and straw
		if (hasMixer) {
			await client.writeCoil(142, true); // stirring
			console.log('Custom drink: Activated stirring at address 142');
			await delay(MODBUS_WRITE_DELAY_MS);

			await client.writeCoil(143, true); // straw
			console.log('Custom drink: Activated straw at address 143');
			await delay(MODBUS_WRITE_DELAY_MS);
		}

		// Write to custom drink address (107)
		await client.writeCoil(107, true);
		console.log('Custom drink: Activated custom address 107');
		await delay(MODBUS_WRITE_DELAY_MS);

		// Write to start address (96) to tell robot to begin
		await client.writeCoil(96, true);
		console.log('Custom drink: Activated start signal at address 96');

		// Start monitoring address 91 to reset addresses when drink is ready
		monitorAndResetCustomDrink(client);

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

import { json, error } from '@sveltejs/kit';
import { getModbusClient } from '$lib/services/modbusClient.js';
import { getCocktailById } from '$lib/data/cocktails.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params }) {
	const cocktailId = params.id;
	const cocktail = getCocktailById(cocktailId);

	if (!cocktail) {
		throw error(404, `Cocktail ${cocktailId} not found`);
	}

	try {
		const client = await getModbusClient();

		// Check if robot is ready (address 92) using holding registers
		const readyCheck = await client.readHoldingRegisters(92, 1);
		if (readyCheck.data[0] === 0) {
			throw error(503, 'Robot is not ready. Please wait for current operation to complete.');
		}

		// Pulse the cocktail register (write 1, wait 10 seconds, write 0)
		await client.writeRegister(cocktail.modbusAddress, 1);

		// Schedule the coil to be turned off after 10 seconds
		setTimeout(async () => {
			try {
				await client.writeRegister(cocktail.modbusAddress, 0);
			} catch (err) {
				console.error('Failed to reset cocktail trigger:', err);
			}
		}, 10000);

		return json({
			success: true,
			message: `Started preparing ${cocktail.name}`,
			cocktailId: cocktail.id
		});

	} catch (err) {
		console.error('Modbus error:', err);

		// Handle specific Modbus errors
		if (err.modbusCode === 1) {
			throw error(500, 'Modbus function not supported. Try visiting /api/modbus-test to diagnose.');
		} else if (err.modbusCode === 2) {
			throw error(500, `Invalid address ${cocktail.modbusAddress}. Check device configuration.`);
		} else if (err.modbusCode === 3) {
			throw error(500, 'Invalid data value in Modbus response.');
		} else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
			throw error(503, 'Robot connection lost. Please check network.');
		}

		const errorMessage = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
		throw error(500, `Failed to trigger cocktail preparation: ${errorMessage}`);
	}
}

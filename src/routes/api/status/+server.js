import { json, error } from '@sveltejs/kit';
import { getModbusClient, isConnected } from '$lib/services/modbusClient.js';

/**
 * Read robot state from Modbus addresses in batches for better performance
 * Tries discrete inputs first, then falls back to coils
 * @param {import('modbus-serial')} client
 * @returns {Promise<Object>}
 */
async function readRobotState(client) {
	const state = {};

	try {
		// Read step states in one batch (addresses 32-40: 9 consecutive addresses)
		let stepStates;
		try {
			stepStates = await client.readDiscreteInputs(32, 9);
		} catch (readError) {
			// If discrete inputs fail, try coils
			if (readError.modbusCode === 2 || readError.modbusCode === 1) {
				stepStates = await client.readCoils(32, 9);
			} else {
				throw readError;
			}
		}

		// Map step states to keys
		state.muddling = stepStates.data[0] === true;
		state.syrup = stepStates.data[1] === true;
		state.lime = stepStates.data[2] === true;
		state.ice = stepStates.data[3] === true;
		state.whiteRum = stepStates.data[4] === true;
		state.darkRum = stepStates.data[5] === true;
		state.soda = stepStates.data[6] === true;
		state.coke = stepStates.data[7] === true;
		state.whiskey = stepStates.data[8] === true;

	} catch (stepError) {
		// Silently set defaults on error to avoid spam
		if (!stepError.message.includes('Timed out')) {
			console.warn('[Modbus] Could not read step states (32-40):', stepError.message);
		}
		// Set all step states to false on error
		state.muddling = false;
		state.syrup = false;
		state.lime = false;
		state.ice = false;
		state.whiteRum = false;
		state.darkRum = false;
		state.soda = false;
		state.coke = false;
		state.whiskey = false;
	}

	try {
		// Read system states in one batch (addresses 90-92: 3 consecutive addresses)
		let systemStates;
		try {
			systemStates = await client.readDiscreteInputs(90, 3);
		} catch (readError) {
			// If discrete inputs fail, try coils
			if (readError.modbusCode === 2 || readError.modbusCode === 1) {
				systemStates = await client.readCoils(90, 3);
			} else {
				throw readError;
			}
		}

		// Map system states to keys
		state.cupHolder = systemStates.data[0] === true;
		state.drinkReady = systemStates.data[1] === true;
		state.waitingRecipe = systemStates.data[2] === true;

	} catch (systemError) {
		console.warn('[Modbus] Could not read system states (90-92):', systemError.message);
		// Set all system states to false on error
		state.cupHolder = false;
		state.drinkReady = false;
		state.waitingRecipe = false;
	}

	return state;
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		if (!isConnected()) {
			return json({
				isConnected: false,
				robotState: getDefaultState(),
				error: 'Not connected to robot'
			});
		}

		const client = await getModbusClient();

		// Read state addresses using discrete inputs or coils (not holding registers)
		// Step addresses: 32-40 (9 addresses)
		// System addresses: 90-92 (3 addresses)
		const robotState = await readRobotState(client);

		return json({
			isConnected: true,
			robotState,
			timestamp: new Date().toISOString()
		});

	} catch (err) {
		console.error('[Status] Polling error:', err);

		// Return a more graceful error response instead of throwing
		// This prevents the frontend from completely failing on transient errors
		return json({
			isConnected: false,
			robotState: getDefaultState(),
			error: err.message || 'Failed to read robot status',
			timestamp: new Date().toISOString()
		}, { status: 200 }); // Return 200 with error info instead of 500
	}
}

function getDefaultState() {
	return {
		muddling: false,
		syrup: false,
		lime: false,
		ice: false,
		whiteRum: false,
		darkRum: false,
		soda: false,
		coke: false,
		whiskey: false,
		cupHolder: false,
		drinkReady: false,
		waitingRecipe: false
	};
}

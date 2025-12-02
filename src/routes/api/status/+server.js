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
		// Read step states in one batch (addresses 32-41: 10 consecutive addresses)
		let stepStates;
		try {
			stepStates = await client.readDiscreteInputs(32, 10);
		} catch (readError) {
			// If discrete inputs fail, try coils
			if (readError.modbusCode === 2 || readError.modbusCode === 1) {
				stepStates = await client.readCoils(32, 10);
			} else {
				throw readError;
			}
		}

		// Map step states to keys (according to Modbus table)
		state.mint = stepStates.data[0] === true;        // Address 32
		state.muddling = stepStates.data[1] === true;    // Address 33
		state.ice = stepStates.data[2] === true;         // Address 34
		state.syrup = stepStates.data[3] === true;       // Address 35
		state.lime = stepStates.data[4] === true;        // Address 36
		state.whiteRum = stepStates.data[5] === true;    // Address 37
		state.darkRum = stepStates.data[6] === true;     // Address 38
		state.whiskey = stepStates.data[7] === true;     // Address 39
		state.soda = stepStates.data[8] === true;        // Address 40
		state.coke = stepStates.data[9] === true;        // Address 41

	} catch (stepError) {
		// Silently set defaults on error to avoid spam
		if (!stepError.message.includes('Timed out')) {
			console.warn('[Modbus] Could not read step states (32-41):', stepError.message);
		}
		// Set all step states to false on error
		state.mint = false;
		state.muddling = false;
		state.ice = false;
		state.syrup = false;
		state.lime = false;
		state.whiteRum = false;
		state.darkRum = false;
		state.whiskey = false;
		state.soda = false;
		state.coke = false;
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
		mint: false,         // Address 32
		muddling: false,     // Address 33
		ice: false,          // Address 34
		syrup: false,        // Address 35
		lime: false,         // Address 36
		whiteRum: false,     // Address 37
		darkRum: false,      // Address 38
		whiskey: false,      // Address 39
		soda: false,         // Address 40
		coke: false,         // Address 41
		cupHolder: false,    // Address 90
		drinkReady: false,   // Address 91
		waitingRecipe: false // Address 92
	};
}

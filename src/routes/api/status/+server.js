import { json, error } from '@sveltejs/kit';
import { getModbusClient, isConnected } from '$lib/services/modbusClient.js';
import { INGREDIENTS, SYSTEM_STATES, createDefaultRobotState, getBatchReadConfig } from '$lib/modbus/registry.js';

/**
 * Read robot state from Modbus addresses in batches for better performance
 * Tries discrete inputs first, then falls back to coils
 * @param {import('modbus-serial')} client
 * @returns {Promise<Object>}
 */
async function readRobotState(client) {
	const state = createDefaultRobotState();
	const config = getBatchReadConfig();

	try {
		// Read step states in one batch using registry config
		// All variables are COILS in RobotStudio
		console.log(`[Status] Reading step states (${config.steps.start}-${config.steps.start + config.steps.count - 1}) as coils...`);
		let stepStates = await client.readCoils(config.steps.start, config.steps.count);
		console.log('[Status] Step states read successfully');

		// Map step states to keys using registry
		const ingredientKeys = Object.values(INGREDIENTS)
			.filter(ing => ing.readAddress !== null)
			.sort((a, b) => a.readAddress - b.readAddress);

		const activeSteps = [];
		ingredientKeys.forEach((ingredient, index) => {
			const isActive = stepStates.data[index] === true;
			state[ingredient.stateKey] = isActive;
			if (isActive) {
				activeSteps.push(`${ingredient.id}(${ingredient.readAddress})`);
			}
		});
		console.log(`[Status] Active steps: ${activeSteps.length > 0 ? activeSteps.join(', ') : 'none'}`);

	} catch (stepError) {
		// Silently set defaults on error to avoid spam
		if (!stepError.message.includes('Timed out')) {
			console.warn(`[Modbus] Could not read step states (${config.steps.start}-${config.steps.start + config.steps.count - 1}):`, stepError.message);
		}
		// createDefaultRobotState() already set all to false
	}

	try {
		// Read system states in one batch using registry config
		// All variables are COILS in RobotStudio
		console.log(`[Status] Reading system states (${config.system.start}-${config.system.start + config.system.count - 1}) as coils...`);
		let systemStates = await client.readCoils(config.system.start, config.system.count);
		console.log('[Status] System states read successfully');

		// Map system states to keys using registry
		const systemKeys = Object.values(SYSTEM_STATES)
			.sort((a, b) => a.readAddress - b.readAddress);

		systemKeys.forEach((systemState, index) => {
			state[systemState.stateKey] = systemStates.data[index] === true;
		});

	} catch (systemError) {
		console.warn(`[Modbus] Could not read system states (${config.system.start}-${config.system.start + config.system.count - 1}):`, systemError.message);
		// createDefaultRobotState() already set all to false
	}

	return state;
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		console.log('[Status] Polling robot state...');

		if (!isConnected()) {
			console.log('[Status] Not connected, returning default state');
			return json({
				isConnected: false,
				robotState: createDefaultRobotState(),
				error: 'Not connected to robot'
			});
		}

		const client = await getModbusClient();

		// Read state addresses using discrete inputs or coils (not holding registers)
		// Step addresses: 32-41 (10 addresses)
		// System addresses: 90-92 (3 addresses)
		const robotState = await readRobotState(client);

		console.log(`[Status] State read - drinkReady: ${robotState.drinkReady ? 1 : 0}, waitingRecipe: ${robotState.waitingRecipe ? 1 : 0}`);

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
			robotState: createDefaultRobotState(),
			error: err.message || 'Failed to read robot status',
			timestamp: new Date().toISOString()
		}, { status: 200 }); // Return 200 with error info instead of 500
	}
}


import { json, error } from '@sveltejs/kit';
import { getMockClientInstance, getMockMode } from '$lib/services/modbusClient.js';

/**
 * API endpoint for controlling the Modbus mock client
 * Only works when MOCK_MODBUS=true
 *
 * POST /api/mock/control
 * Body: {
 *   action: 'setState' | 'reset' | 'setErrorSimulation' | 'simulateError',
 *   address?: number,  // for setState
 *   value?: boolean,   // for setState
 *   enabled?: boolean  // for setErrorSimulation
 * }
 */

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	// Check if mock mode is enabled
	if (!getMockMode()) {
		throw error(400, 'Mock mode is not enabled. Set MOCK_MODBUS=true to use this endpoint.');
	}

	const mockClient = getMockClientInstance();
	if (!mockClient) {
		throw error(500, 'Mock client not available');
	}

	try {
		const body = await request.json();
		const { action } = body;

		switch (action) {
			case 'setState': {
				const { address, value } = body;
				if (typeof address !== 'number' || typeof value !== 'boolean') {
					throw error(400, 'Invalid parameters: address (number) and value (boolean) required');
				}
				mockClient.setCoil(address, value);
				console.log(`[Mock Control] Set coil ${address} = ${value}`);
				return json({
					success: true,
					message: `Coil ${address} set to ${value}`,
					state: mockClient.getRobotState()
				});
			}

			case 'reset': {
				mockClient.reset();
				return json({
					success: true,
					message: 'Mock client reset to default state',
					state: mockClient.getRobotState()
				});
			}

			case 'setErrorSimulation': {
				const { enabled } = body;
				if (typeof enabled !== 'boolean') {
					throw error(400, 'Invalid parameter: enabled (boolean) required');
				}
				mockClient.setErrorSimulation(enabled);
				return json({
					success: true,
					message: `Error simulation ${enabled ? 'enabled' : 'disabled'}`
				});
			}

			case 'simulateError': {
				mockClient.simulateError();
				return json({
					success: true,
					message: 'Simulated connection error'
				});
			}

			default:
				throw error(400, `Unknown action: ${action}`);
		}
	} catch (err) {
		// Re-throw http errors
		if (err.status) {
			throw err;
		}
		console.error('[Mock Control] Error:', err);
		throw error(500, err.message || 'Failed to control mock');
	}
}

/**
 * GET /api/mock/control
 * Returns current mock state
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
	// Check if mock mode is enabled
	if (!getMockMode()) {
		throw error(400, 'Mock mode is not enabled. Set MOCK_MODBUS=true to use this endpoint.');
	}

	const mockClient = getMockClientInstance();
	if (!mockClient) {
		throw error(500, 'Mock client not available');
	}

	return json({
		enabled: true,
		state: mockClient.getRobotState()
	});
}

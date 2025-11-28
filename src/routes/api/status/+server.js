import { json, error } from '@sveltejs/kit';
import { getModbusClient, isConnected } from '$lib/services/modbusClient.js';

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

		// Read state addresses 32-40 (9 registers) and 90-92 (3 registers)
		// Using readHoldingRegisters as device only supports FC 3
		const actionStates = await client.readHoldingRegisters(32, 9);
		const systemStates = await client.readHoldingRegisters(90, 3);

		const robotState = {
			muddling: actionStates.data[0] > 0,
			syrup: actionStates.data[1] > 0,
			lime: actionStates.data[2] > 0,
			ice: actionStates.data[3] > 0,
			whiteRum: actionStates.data[4] > 0,
			darkRum: actionStates.data[5] > 0,
			soda: actionStates.data[6] > 0,
			coke: actionStates.data[7] > 0,
			whiskey: actionStates.data[8] > 0,
			cupHolder: systemStates.data[0] > 0,
			drinkReady: systemStates.data[1] > 0,
			waitingRecipe: systemStates.data[2] > 0
		};

		return json({
			isConnected: true,
			robotState,
			timestamp: new Date().toISOString()
		});

	} catch (err) {
		console.error('Status polling error:', err);

		// Handle specific Modbus errors
		if (err.modbusCode === 1) {
			throw error(500, 'Modbus function not supported. Check device configuration.');
		} else if (err.modbusCode === 2) {
			throw error(500, 'Invalid Modbus address. Check address configuration.');
		} else if (err.modbusCode === 3) {
			throw error(500, 'Invalid data value in Modbus response.');
		} else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
			throw error(503, 'Robot connection lost. Please check network.');
		}

		throw error(500, `Failed to read robot status: ${err.message}`);
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

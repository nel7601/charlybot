import { json } from '@sveltejs/kit';
import { getModbusClient, isConnected } from '$lib/services/modbusClient.js';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		if (!isConnected()) {
			// Attempt to connect
			await getModbusClient();
		}

		return json({
			status: 'healthy',
			modbus: {
				connected: isConnected(),
				host: '192.168.1.100',
				port: 502
			},
			timestamp: new Date().toISOString()
		});

	} catch (err) {
		return json({
			status: 'unhealthy',
			modbus: {
				connected: false,
				error: err.message
			},
			timestamp: new Date().toISOString()
		}, { status: 503 });
	}
}

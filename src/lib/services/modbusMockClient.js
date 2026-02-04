/**
 * Mock Modbus Client for Development and Testing
 *
 * Simulates a Modbus TCP server without requiring actual hardware.
 * Maintains an internal state that mimics robot behavior.
 */

import { createDefaultRobotState, ADDRESS_RANGES, INGREDIENTS } from '$lib/modbus/registry.js';

/**
 * Event emitter for mock client
 */
class EventEmitter {
	constructor() {
		/** @type {Map<string, Function[]>} */
		this.listeners = new Map();
	}

	/**
	 * Register event listener
	 * @param {string} event
	 * @param {Function} callback
	 */
	on(event, callback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)?.push(callback);
	}

	/**
	 * Emit event to all listeners
	 * @param {string} event
	 * @param {any} [data]
	 */
	emit(event, data) {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			callbacks.forEach(cb => cb(data));
		}
	}
}

/**
 * Mock Modbus Client
 * Simulates the modbus-serial client interface
 */
export class ModbusMockClient extends EventEmitter {
	/** @type {Map<number, boolean>} */
	#coils;

	/** @type {boolean} */
	#isOpen;

	/** @type {number} */
	#unitId;

	/** @type {number} */
	#timeout;

	/** @type {NodeJS.Timeout | null} */
	#autoProgressTimer;

	/** @type {boolean} */
	#simulateErrors;

	/** @type {number[]} */
	#selectedIngredients;

	/** @type {NodeJS.Timeout | null} */
	#preparationTimer;

	constructor() {
		super();
		this.#coils = new Map();
		this.#isOpen = false;
		this.#unitId = 1;
		this.#timeout = 1000;
		this.#autoProgressTimer = null;
		this.#simulateErrors = false;
		this.#selectedIngredients = [];
		this.#preparationTimer = null;

		// Initialize system states in default robot-ready state
		this.#initializeSystemStates();
	}

	/**
	 * Initialize system states (90-92) to robot-ready state
	 */
	#initializeSystemStates() {
		// Address 90: cupHolder = false
		this.#coils.set(90, false);
		// Address 91: drinkReady = false
		this.#coils.set(91, false);
		// Address 92: waitingRecipe = true (robot ready to accept orders)
		this.#coils.set(92, true);
	}

	/**
	 * Connect to mock Modbus server (always succeeds)
	 * @param {string} host
	 * @param {object} options
	 * @returns {Promise<void>}
	 */
	async connectTCP(host, options) {
		console.log(`[Modbus Mock] Connecting to ${host}:${options.port}...`);
		// Simulate connection delay
		await new Promise(resolve => setTimeout(resolve, 50));
		this.#isOpen = true;
		console.log(`[Modbus Mock] ✓ Connected (mock mode)`);
		return Promise.resolve();
	}

	/**
	 * Set unit ID (stored but not used in mock)
	 * @param {number} id
	 */
	setID(id) {
		this.#unitId = id;
	}

	/**
	 * Set timeout (stored but not used in mock)
	 * @param {number} ms
	 */
	setTimeout(ms) {
		this.#timeout = ms;
	}

	/**
	 * Check if connection is open
	 * @type {boolean}
	 */
	get isOpen() {
		return this.#isOpen;
	}

	/**
	 * Read multiple coils
	 * @param {number} address - Starting address
	 * @param {number} count - Number of coils to read
	 * @returns {Promise<{ data: boolean[] }>}
	 */
	async readCoils(address, count) {
		if (!this.#isOpen) {
			throw new Error('Mock client is not connected');
		}

		// Simulate read delay
		await new Promise(resolve => setTimeout(resolve, 10));

		const data = [];
		for (let i = 0; i < count; i++) {
			const addr = address + i;
			const value = this.#coils.get(addr) || false;
			data.push(value);
		}

		return { data };
	}

	/**
	 * Write a single coil
	 * @param {number} address - Coil address
	 * @param {boolean} value - Value to write
	 * @returns {Promise<void>}
	 */
	async writeCoil(address, value) {
		if (!this.#isOpen) {
			throw new Error('Mock client is not connected');
		}

		// Simulate write delay
		await new Promise(resolve => setTimeout(resolve, 5));

		// Check if we should simulate errors
		if (this.#simulateErrors && Math.random() < 0.05) {
			throw new Error('Mock Modbus error (simulated failure)');
		}

		// Clear all preparation state when start signal is reset
		if (address === 96 && value === false) {
			console.log('[Modbus Mock] Start signal reset, clearing preparation state');
			this.#selectedIngredients = [];
			// Clear all step states (32-41)
			for (let i = 32; i <= 41; i++) {
				this.#coils.set(i, false);
			}
			// Clear drinkReady
			this.#coils.set(91, false);
		}

		// Track ingredient writes (132-143) for simulation
		if (value === true && address >= 132 && address <= 143) {
			if (!this.#selectedIngredients.includes(address)) {
				this.#selectedIngredients.push(address);
				console.log(`[Modbus Mock] Ingredient added to preparation list: address ${address}`);
			}
		}

		// Clear ingredient from list when resetting
		if (value === false && address >= 132 && address <= 143) {
			this.#selectedIngredients = this.#selectedIngredients.filter(a => a !== address);
		}

		// Special handling for start signal (96)
		if (address === 96 && value === true) {
			console.log('[Modbus Mock] Start signal received, beginning mock execution...');
			this.#startMockExecution();
		}

		// Store the coil value
		this.#coils.set(address, value);

		// Log write operations for key addresses
		this.#logWrite(address, value);

		return Promise.resolve();
	}

	/**
	 * Log write operations for key addresses
	 * @param {number} address
	 * @param {boolean} value
	 */
	#logWrite(address, value) {
		const keyAddresses = {
			96: 'START_SIGNAL',
			100: 'MOJITO',
			101: 'CUBA_LIBRE',
			102: 'CUBATA',
			103: 'WHISKEY_ROCKS',
			104: 'NEAT_WHISKEY',
			105: 'WHISKEY_HIGHBALL',
			106: 'WHISKEY_COKE',
			107: 'CUSTOM',
			132: 'mint', 133: 'muddling', 134: 'ice',
			135: 'syrup', 136: 'lime', 137: 'white-rum',
			138: 'dark-rum', 139: 'whiskey', 140: 'soda',
			141: 'coke', 142: 'stirring', 143: 'straw'
		};

		const label = keyAddresses[address];
		if (label) {
			console.log(`[Modbus Mock]   ✓ ${label} (${address}) = ${value ? 1 : 0}`);
		}
	}

	/**
	 * Start mock execution sequence
	 * Simulates robot preparing a drink step by step
	 */
	#startMockExecution() {
		// Set waitingRecipe to false (robot is busy)
		this.#coils.set(92, false);
		console.log('[Modbus Mock] Robot now busy (92 = 0)');

		// Clear any existing timer
		if (this.#preparationTimer) {
			clearTimeout(this.#preparationTimer);
		}

		// If no ingredients selected, just finish immediately
		if (this.#selectedIngredients.length === 0) {
			console.log('[Modbus Mock] No ingredients selected, finishing immediately');
			this.#finishDrink();
			return;
		}

		// Map write addresses to read addresses and sort by read address for execution order
		/** @type {Array<{writeAddr: number, readAddr: number | null, label: string}>} */
		const steps = [];

		for (const writeAddr of this.#selectedIngredients) {
			// Map write address to ingredient
			const ingredient = Object.values(INGREDIENTS).find(ing => ing.writeAddress === writeAddr);

			if (ingredient) {
				steps.push({
					writeAddr: writeAddr,
					readAddr: ingredient.readAddress,
					label: ingredient.label
				});
			}
		}

		// Sort by read address (execution order)
		steps.sort((a, b) => {
			const addrA = a.readAddr ?? 999;
			const addrB = b.readAddr ?? 999;
			return addrA - addrB;
		});

		console.log(`[Modbus Mock] Starting preparation with ${steps.length} steps`);
		steps.forEach((step, i) => {
			console.log(`[Modbus Mock]   ${i + 1}. ${step.label} (address ${step.readAddr ?? 'N/A'})`);
		});

		// Execute each step sequentially
		let delay = 0;
		const STEP_DURATION = 800; // 800ms per step (faster for development)

		steps.forEach((step, index) => {
			if (step.readAddr !== null) {
				this.#preparationTimer = setTimeout(() => {
					// Activate the step
					this.#coils.set(step.readAddr, true);
					console.log(`[Modbus Mock] ✓ Step ${index + 1}/${steps.length}: ${step.label} (${step.readAddr})`);
				}, delay);
				delay += STEP_DURATION;
			}
		});

		// After all steps, mark drink as ready
		this.#preparationTimer = setTimeout(() => {
			this.#finishDrink();
		}, delay);
	}

	/**
	 * Finish drink preparation
	 * Sets drinkReady and eventually waitingRecipe
	 */
	#finishDrink() {
		console.log('[Modbus Mock] Drink preparation complete');
		// Set drinkReady to true
		this.#coils.set(91, true);
		console.log('[Modbus Mock]   ✓ drinkReady (91) = 1');

		// After a short delay, set waitingRecipe back to true (robot ready again)
		setTimeout(() => {
			this.#coils.set(92, true);
			console.log('[Modbus Mock]   ✓ waitingRecipe (92) = 1 - Robot ready for next order');
		}, 2000); // 2 seconds after drinkReady
	}

	/**
	 * Close the mock connection
	 * @param {Function} [callback]
	 */
	close(callback) {
		console.log('[Modbus Mock] Closing connection...');
		this.#isOpen = false;

		if (this.#autoProgressTimer) {
			clearTimeout(this.#autoProgressTimer);
			this.#autoProgressTimer = null;
		}

		if (this.#preparationTimer) {
			clearTimeout(this.#preparationTimer);
			this.#preparationTimer = null;
		}

		if (callback) {
			callback();
		}

		this.emit('close');
	}

	/**
	 * Get current robot state as an object
	 * Useful for testing and debugging
	 * @returns {object}
	 */
	getRobotState() {
		const state = createDefaultRobotState();

		// Map coils to state keys using address ranges
		const addressToKey = {
			32: 'mint', 33: 'muddling', 34: 'ice', 35: 'syrup',
			36: 'lime', 37: 'whiteRum', 38: 'darkRum', 39: 'whiskey',
			40: 'soda', 41: 'coke', 90: 'cupHolder',
			91: 'drinkReady', 92: 'waitingRecipe'
		};

		for (const [address, key] of Object.entries(addressToKey)) {
			const addr = parseInt(address);
			state[key] = this.#coils.get(addr) || false;
		}

		return state;
	}

	/**
	 * Manually set a coil value (for testing)
	 * @param {number} address
	 * @param {boolean} value
	 */
	setCoil(address, value) {
		this.#coils.set(address, value);
		// Also update selected ingredients list if needed
		if (value && address >= 132 && address <= 143) {
			if (!this.#selectedIngredients.includes(address)) {
				this.#selectedIngredients.push(address);
			}
		} else if (!value && address >= 132 && address <= 143) {
			this.#selectedIngredients = this.#selectedIngredients.filter(a => a !== address);
		}
	}

	/**
	 * Reset all coils to default state
	 */
	reset() {
		this.#coils.clear();
		this.#initializeSystemStates();
		this.#selectedIngredients = [];

		if (this.#autoProgressTimer) {
			clearTimeout(this.#autoProgressTimer);
			this.#autoProgressTimer = null;
		}

		if (this.#preparationTimer) {
			clearTimeout(this.#preparationTimer);
			this.#preparationTimer = null;
		}

		console.log('[Modbus Mock] Reset to default state');
	}

	/**
	 * Enable/disable error simulation
	 * @param {boolean} enabled
	 */
	setErrorSimulation(enabled) {
		this.#simulateErrors = enabled;
		console.log(`[Modbus Mock] Error simulation ${enabled ? 'enabled' : 'disabled'}`);
	}

	/**
	 * Simulate a connection error
	 */
	simulateError() {
		const error = new Error('Simulated Modbus connection error');
		this.emit('error', error);
		this.close();
	}
}

/**
 * Singleton instance
 * @type {ModbusMockClient | null}
 */
let mockInstance = null;

/** @type {Promise<ModbusMockClient> | null} */
let connectionPromise = null;

/**
 * Get or create the mock client singleton
 * Auto-connects on first use
 * @returns {Promise<ModbusMockClient>}
 */
export async function getMockClient() {
	// If already connected, return immediately
	if (mockInstance && mockInstance.isOpen) {
		return mockInstance;
	}

	// If connection is in progress, wait for it
	if (connectionPromise) {
		return connectionPromise;
	}

	// Create new connection
	connectionPromise = (async () => {
		if (!mockInstance) {
			mockInstance = new ModbusMockClient();
		}
		// Auto-connect to mock server
		await mockInstance.connectTCP('127.0.0.1', { port: 502 });
		connectionPromise = null; // Clear promise after connection
		return mockInstance;
	})();

	return connectionPromise;
}

/**
 * Get the current mock instance without creating a new one
 * @returns {ModbusMockClient | null}
 */
export function getCurrentMockInstance() {
	return mockInstance;
}

/**
 * Reset the mock client (clears state and creates new instance)
 * Useful for tests
 */
export function resetMockClient() {
	if (mockInstance) {
		mockInstance.close();
	}
	mockInstance = null; // Clear instance
	console.log('[Modbus Mock] Client reset');
}

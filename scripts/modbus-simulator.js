/**
 * Modbus TCP Server Simulator
 * Simulates a robot bartender for testing without physical hardware
 */

import ModbusRTU from 'modbus-serial';

// Create a Modbus server
const vector = {
	// Coils (read/write bits) - addresses 0-199
	getCoil: function (addr) {
		// Step states (32-40)
		if (addr >= 32 && addr <= 40) {
			return this.steps[addr - 32] || false;
		}
		// System states (90-92)
		if (addr >= 90 && addr <= 92) {
			return this.system[addr - 90] || false;
		}
		// Cocktail triggers (100-106)
		if (addr >= 100 && addr <= 106) {
			return this.cocktails[addr - 100] || false;
		}
		return false;
	},

	setCoil: function (addr, value) {
		console.log(`[Modbus] Set coil ${addr} = ${value ? 1 : 0}`);

		// Cocktail triggers (100-106)
		if (addr >= 100 && addr <= 106) {
			this.cocktails[addr - 100] = value;

			if (value === true) {
				const cocktailNames = ['Mojito', 'Cuba Libre', 'Cubata', 'Whiskey Rocks', 'Whiskey Coke', 'Reserved', 'Whiskey Highball'];
				const cocktailName = cocktailNames[addr - 100] || `Cocktail ${addr}`;
				console.log(`\n🍹 Starting: ${cocktailName} (address ${addr} = 1)`);

				// Simulate cocktail preparation
				this.simulateCocktail(addr);
			} else {
				console.log(`🔄 Cocktail trigger reset: address ${addr} = 0`);

				// When ANY cocktail address is reset to 0, also reset drinkReady flag
				// This happens when address 91 becomes 1 and the app resets all cocktail addresses
				if (this.system[1]) {
					this.system[1] = false; // Reset drinkReady (address 91)
					console.log(`♻️  System reset: address 91 = 0`);

					// Also reset all steps for next cocktail
					this.steps.fill(false);
					console.log(`♻️  All steps reset for next cocktail\n`);
				}
			}
		}

		return value;
	},

	// Discrete Inputs (read-only bits) - mirror coils for this simulator
	getDiscreteInput: function (addr) {
		return this.getCoil(addr);
	},

	// Holding Registers (read/write 16-bit) - not used but required
	getHoldingRegister: function (addr) {
		return 0;
	},

	setRegister: function (addr, value) {
		console.log(`[Modbus] Set register ${addr} = ${value}`);
		return value;
	},

	// Input Registers (read-only 16-bit) - not used but required
	getInputRegister: function (addr) {
		return 0;
	},

	// State storage
	steps: new Array(9).fill(false),      // addresses 32-40
	system: new Array(3).fill(false),     // addresses 90-92
	cocktails: new Array(7).fill(false),  // addresses 100-106

	/**
	 * Simulate cocktail preparation
	 */
	simulateCocktail: async function (cocktailAddr) {
		const cocktailIndex = cocktailAddr - 100;

		// Define step sequences for different cocktails
		const stepSequences = {
			0: [0, 1, 2, 3, 4, 6],      // Mojito: muddling, syrup, lime, ice, whiteRum, soda
			1: [3, 4, 2, 7],             // Cuba Libre: ice, whiteRum, lime, coke
			2: [3, 5, 7],                // Cubata: ice, darkRum, coke
			3: [3, 8],                   // Whiskey Rocks: ice, whiskey
			4: [3, 8, 7],                // Whiskey Coke: ice, whiskey, coke
			6: [3, 8, 6]                 // Whiskey Highball: ice, whiskey, soda
		};

		const sequence = stepSequences[cocktailIndex] || [3, 4]; // Default sequence

		console.log(`📋 Steps: ${sequence.length} operations\n`);

		// Reset all steps
		this.steps.fill(false);
		this.system[1] = false; // drinkReady = false

		// Execute each step with delay
		for (let i = 0; i < sequence.length; i++) {
			const stepIndex = sequence[i];
			const stepNames = ['Muddling', 'Syrup', 'Lime', 'Ice', 'White Rum', 'Dark Rum', 'Soda', 'Coke', 'Whiskey'];

			await this.delay(2000); // 2 seconds per step

			this.steps[stepIndex] = true;
			console.log(`  ✓ Step ${i + 1}/${sequence.length}: ${stepNames[stepIndex]} (address ${32 + stepIndex})`);
		}

		// Mark as complete
		await this.delay(1000);
		this.system[1] = true; // drinkReady = true (address 91)
		console.log(`\n✅ Drink ready! (address 91 = 1)`);
		console.log(`⏳ Waiting for application to reset address ${cocktailAddr}...\n`);
	},

	delay: function (ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
};

// Start the server
const serverTCP = new ModbusRTU.ServerTCP(vector, {
	host: '0.0.0.0',
	port: 502,
	debug: false,
	unitID: 1
});

serverTCP.on('socketError', function (err) {
	console.error('[Modbus] Socket error:', err.message);
});

console.log('━'.repeat(60));
console.log('🤖 Modbus TCP Server (Robot Bartender Simulator)');
console.log('━'.repeat(60));
console.log('📡 Listening on: 0.0.0.0:502');
console.log('🆔 Unit ID: 1');
console.log('\n📍 Available addresses:');
console.log('   Steps:     32-40 (Discrete Inputs/Coils)');
console.log('   System:    90-92 (Discrete Inputs/Coils)');
console.log('   Cocktails: 100-106 (Coils - Write to trigger)');
console.log('\n🍹 Ready to serve cocktails!');
console.log('━'.repeat(60));
console.log('\nPress Ctrl+C to stop the server\n');

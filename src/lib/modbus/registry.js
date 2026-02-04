/**
 * Single Source of Truth for Modbus Configuration
 *
 * This file contains all Modbus addresses, ingredient definitions,
 * cocktail recipes, and utility functions for the bartender robot.
 * All other files should import from here rather than hardcoding values.
 */

// ============================================================================
// ADDRESS RANGES
// ============================================================================

/**
 * Modbus address ranges for different operations
 */
export const ADDRESS_RANGES = {
	// Read addresses - step indicators and system states
	STEP_START: 32,        // Start of step state addresses
	STEP_COUNT: 10,        // Number of step addresses (32-41)
	SYSTEM_START: 90,      // Start of system state addresses (90-92)
	SYSTEM_COUNT: 3,       // Number of system addresses

	// Write addresses - cocktails and ingredients
	COCKTAIL_START: 100,   // Predefined cocktail triggers (100-107)
	COCKTAIL_COUNT: 8,
	CUSTOM_COCKTAIL: 107,  // Custom cocktail address
	START_SIGNAL: 96,      // Start signal to begin execution

	// Ingredient write addresses (132-143)
	INGREDIENT_START: 132,
	INGREDIENT_COUNT: 12
};

// ============================================================================
// INGREDIENTS
// ============================================================================

/**
 * All available ingredients with their Modbus addresses
 */
export const INGREDIENTS = {
	'mint': {
		id: 'mint',
		label: 'Placing Mint',
		stateKey: 'mint',
		description: 'Placing mint leaves in the glass',
		readAddress: 32,
		writeAddress: 132,
		isAutoTriggered: false
	},
	'muddling': {
		id: 'muddling',
		label: 'Muddling',
		stateKey: 'muddling',
		description: 'Muddling the mint leaves',
		readAddress: 33,
		writeAddress: 133,
		isAutoTriggered: true,
		triggeredBy: ['mint'] // Auto-triggered when mint is selected
	},
	'ice': {
		id: 'ice',
		label: 'Adding Ice',
		stateKey: 'ice',
		description: 'Adding ice cubes to the glass',
		readAddress: 34,
		writeAddress: 134,
		isAutoTriggered: false
	},
	'syrup': {
		id: 'syrup',
		label: 'Pouring Syrup',
		stateKey: 'syrup',
		description: 'Pouring syrup into the glass',
		readAddress: 35,
		writeAddress: 135,
		isAutoTriggered: false
	},
	'lime': {
		id: 'lime',
		label: 'Adding Lime',
		stateKey: 'lime',
		description: 'Pouring lime into the glass',
		readAddress: 36,
		writeAddress: 136,
		isAutoTriggered: false
	},
	'white-rum': {
		id: 'white-rum',
		label: 'Pouring White Rum',
		stateKey: 'whiteRum',
		description: 'Pouring white rum into the glass',
		readAddress: 37,
		writeAddress: 137,
		isAutoTriggered: false
	},
	'dark-rum': {
		id: 'dark-rum',
		label: 'Pouring Dark Rum',
		stateKey: 'darkRum',
		description: 'Pouring dark rum into the glass',
		readAddress: 38,
		writeAddress: 138,
		isAutoTriggered: false
	},
	'whiskey': {
		id: 'whiskey',
		label: 'Pouring Whiskey',
		stateKey: 'whiskey',
		description: 'Pouring whiskey into the glass',
		readAddress: 39,
		writeAddress: 139,
		isAutoTriggered: false
	},
	'soda': {
		id: 'soda',
		label: 'Adding Soda',
		stateKey: 'soda',
		description: 'Pouring soda into the glass',
		readAddress: 40,
		writeAddress: 140,
		isAutoTriggered: false
	},
	'coke': {
		id: 'coke',
		label: 'Adding Coke',
		stateKey: 'coke',
		description: 'Pouring coke into the glass',
		readAddress: 41,
		writeAddress: 141,
		isAutoTriggered: false
	},
	'stirring': {
		id: 'stirring',
		label: 'Stirring',
		stateKey: 'stirring',
		description: 'Stirring the drink',
		readAddress: null, // No read address (not a step indicator)
		writeAddress: 142,
		isAutoTriggered: true,
		triggeredBy: ['soda', 'coke'] // Auto-triggered when soda or coke is selected
	},
	'straw': {
		id: 'straw',
		label: 'Adding Straw',
		stateKey: 'straw',
		description: 'Adding a straw to the drink',
		readAddress: null, // No read address (not a step indicator)
		writeAddress: 143,
		isAutoTriggered: true,
		triggeredBy: ['soda', 'coke'] // Auto-triggered when soda or coke is selected
	}
};

// ============================================================================
// SYSTEM STATES
// ============================================================================

/**
 * System state indicators
 */
export const SYSTEM_STATES = {
	'cupHolder': {
		id: 'cupHolder',
		label: 'Cup Holder',
		stateKey: 'cupHolder',
		description: 'Cup is in the holder',
		readAddress: 90
	},
	'drinkReady': {
		id: 'drinkReady',
		label: 'Drink Ready',
		stateKey: 'drinkReady',
		description: 'The drink preparation is complete',
		readAddress: 91
	},
	'waitingRecipe': {
		id: 'waitingRecipe',
		label: 'Waiting Recipe',
		stateKey: 'waitingRecipe',
		description: 'Robot is ready to receive a recipe',
		readAddress: 92
	}
};

// ============================================================================
// COCKTAIL RECIPES
// ============================================================================

/**
 * Predefined cocktail recipes
 * Each cocktail has its ingredients and the Modbus address to trigger it
 */
export const COCKTAILS = {
	'mojito': {
		id: 'mojito',
		name: 'Mojito',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
		modbusAddress: 100,
		category: 'rum',
		ingredients: ['mint', 'muddling', 'syrup', 'lime', 'ice', 'white-rum', 'soda', 'stirring', 'straw']
	},
	'cuba-libre': {
		id: 'cuba-libre',
		name: 'Cuba Libre',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/ck6d0p1504388696.jpg',
		modbusAddress: 101,
		category: 'rum',
		ingredients: ['ice', 'white-rum', 'lime', 'coke', 'stirring', 'straw']
	},
	'cubata': {
		id: 'cubata',
		name: 'Cubata',
		imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
		modbusAddress: 102,
		category: 'rum',
		ingredients: ['ice', 'dark-rum', 'coke', 'stirring', 'straw']
	},
	'whiskey-rocks': {
		id: 'whiskey-rocks',
		name: 'Whiskey on the Rocks',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/rtpxqw1468877562.jpg',
		modbusAddress: 103,
		category: 'whiskey',
		ingredients: ['ice', 'whiskey']
	},
	'neat-whiskey': {
		id: 'neat-whiskey',
		name: 'Neat Whiskey',
		imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80',
		modbusAddress: 104,
		category: 'whiskey',
		ingredients: ['whiskey']
	},
	'whiskey-highball': {
		id: 'whiskey-highball',
		name: 'Whiskey Highball',
		imageUrl: 'https://bevvyco.s3.amazonaws.com/img/drinks/wa/nmwa/highball-4de45d79d99c54d28ae535e11a5526dc-lg.jpg',
		modbusAddress: 105,
		category: 'whiskey',
		ingredients: ['ice', 'whiskey', 'soda', 'stirring', 'straw']
	},
	'whiskey-coke': {
		id: 'whiskey-coke',
		name: 'Whiskey and Coke',
		imageUrl: 'https://bevvyco.s3.amazonaws.com/img/drinks/aa/liaa/whiskey-and-coke-5b5766b04fd7d1673ac4b7af52062899-lg.jpg?ts=1496502632000',
		modbusAddress: 106,
		category: 'whiskey',
		ingredients: ['ice', 'whiskey', 'coke', 'stirring', 'straw']
	}
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get ingredient configuration by ID
 * @param {string} id - Ingredient ID
 * @returns {typeof INGREDIENTS[keyof typeof INGREDIENTS] | undefined}
 */
export function getIngredient(id) {
	return /** @type {any} */ (INGREDIENTS)[id];
}

/**
 * Get cocktail configuration by ID
 * @param {string} id - Cocktail ID
 * @returns {typeof COCKTAILS[keyof typeof COCKTAILS] | undefined}
 */
export function getCocktail(id) {
	return /** @type {any} */ (COCKTAILS)[id];
}

/**
 * Get write addresses for a predefined cocktail
 * Returns both ingredient addresses and the cocktail's modbus address
 * @param {string} cocktailId - Cocktail ID
 * @returns {{ address: number, ingredients: number[] } | undefined}
 */
export function getCocktailWriteAddresses(cocktailId) {
	const cocktail = /** @type {any} */ (COCKTAILS)[cocktailId];
	if (!cocktail) {
		return undefined;
	}

	// Convert ingredient IDs to their write addresses
	const ingredientAddresses = cocktail.ingredients
		.map((/** @type {string} */ ingredientId) => /** @type {any} */ (INGREDIENTS)[ingredientId]?.writeAddress)
		.filter((/** @type {number | undefined} */ address) => address !== undefined && address !== null);

	return {
		address: cocktail.modbusAddress,
		ingredients: /** @type {number[]} */ (ingredientAddresses)
	};
}

/**
 * Get write addresses for a custom cocktail
 * Automatically includes auto-triggered ingredients (muddling, stirring, straw)
 * @param {string[]} ingredientIds - Selected ingredient IDs
 * @returns {{ addresses: number[], extras: { muddling: boolean, stirring: boolean, straw: boolean } }}
 */
export function getCustomWriteAddresses(ingredientIds) {
	const addresses = [];
	const extras = {
		muddling: false,
		stirring: false,
		straw: false
	};

	// Add selected ingredient addresses
	for (const ingredientId of ingredientIds) {
		const ingredient = /** @type {any} */ (INGREDIENTS)[ingredientId];
		if (ingredient && ingredient.writeAddress !== null) {
			addresses.push(ingredient.writeAddress);
		}

		// Check for auto-triggered ingredients
		if (ingredient?.isAutoTriggered && ingredient.triggeredBy) {
			for (const triggerIngredient of ingredientIds) {
				if (ingredient.triggeredBy.includes(triggerIngredient)) {
					if (ingredientId === 'muddling') extras.muddling = true;
					if (ingredientId === 'stirring') extras.stirring = true;
					if (ingredientId === 'straw') extras.straw = true;
				}
			}
		}
	}

	// Auto-add muddling if mint is selected
	if (ingredientIds.includes('mint')) {
		const muddling = INGREDIENTS['muddling'];
		if (muddling && muddling.writeAddress !== null) {
			addresses.push(muddling.writeAddress);
			extras.muddling = true;
		}
	}

	// Auto-add stirring and straw if soda or coke is selected
	const hasMixer = ingredientIds.includes('soda') || ingredientIds.includes('coke');
	if (hasMixer) {
		const stirring = INGREDIENTS['stirring'];
		const straw = INGREDIENTS['straw'];

		if (stirring && stirring.writeAddress !== null) {
			addresses.push(stirring.writeAddress);
			extras.stirring = true;
		}
		if (straw && straw.writeAddress !== null) {
			addresses.push(straw.writeAddress);
			extras.straw = true;
		}
	}

	// Sort addresses for consistent execution order
	addresses.sort((a, b) => a - b);

	return { addresses, extras };
}

/**
 * Create a default robot state object with all values set to false
 * @returns {{ mint: boolean, muddling: boolean, ice: boolean, syrup: boolean, lime: boolean, whiteRum: boolean, darkRum: boolean, whiskey: boolean, soda: boolean, coke: boolean, cupHolder: boolean, drinkReady: boolean, waitingRecipe: boolean }}
 */
export function createDefaultRobotState() {
	/** @type {any} */
	const state = {};

	// Add all ingredient states
	for (const ingredient of Object.values(INGREDIENTS)) {
		if (ingredient.stateKey && ingredient.readAddress !== null) {
			state[ingredient.stateKey] = false;
		}
	}

	// Add system states
	for (const systemState of Object.values(SYSTEM_STATES)) {
		state[systemState.stateKey] = false;
	}

	return /** @type {{ mint: boolean, muddling: boolean, ice: boolean, syrup: boolean, lime: boolean, whiteRum: boolean, darkRum: boolean, whiskey: boolean, soda: boolean, coke: boolean, cupHolder: boolean, drinkReady: boolean, waitingRecipe: boolean }} */ (state);
}

/**
 * Get all addresses that need to be reset after a drink is complete
 * @returns {{ cocktails: number[], ingredients: number[], startSignal: number }}
 */
export function getResetAddresses() {
	const cocktailAddresses = [];
	const ingredientAddresses = [];

	// Generate cocktail addresses (100-107)
	for (let i = 0; i < ADDRESS_RANGES.COCKTAIL_COUNT; i++) {
		cocktailAddresses.push(ADDRESS_RANGES.COCKTAIL_START + i);
	}

	// Generate ingredient addresses (132-143)
	for (let i = 0; i < ADDRESS_RANGES.INGREDIENT_COUNT; i++) {
		ingredientAddresses.push(ADDRESS_RANGES.INGREDIENT_START + i);
	}

	return {
		cocktails: cocktailAddresses,
		ingredients: ingredientAddresses,
		startSignal: ADDRESS_RANGES.START_SIGNAL
	};
}

/**
 * Get batch read configuration for reading robot state
 * Returns the address ranges to read for step and system states
 * @returns {{ steps: { start: number, count: number }, system: { start: number, count: number } }}
 */
export function getBatchReadConfig() {
	return {
		steps: {
			start: ADDRESS_RANGES.STEP_START,
			count: ADDRESS_RANGES.STEP_COUNT
		},
		system: {
			start: ADDRESS_RANGES.SYSTEM_START,
			count: ADDRESS_RANGES.SYSTEM_COUNT
		}
	};
}

/**
 * Get cocktail steps for UI display
 * Generates ordered steps with modbusAddress for custom cocktails
 * @param {string} cocktailId - Cocktail ID
 * @param {string[] | null} [customIngredients] - Selected ingredients for custom drinks
 * @returns {Array<{ label: string, stateKey: string, description: string, modbusAddress?: number }>}
 */
export function getCocktailSteps(cocktailId, customIngredients = null) {
	const steps = [];

	// Handle custom cocktail
	if (cocktailId === 'custom') {
		if (customIngredients && customIngredients.length > 0) {
			// Generate steps based on selected ingredients
			for (const ingredientId of customIngredients) {
				const ingredient = /** @type {any} */ (INGREDIENTS)[ingredientId];
				if (ingredient && ingredient.readAddress !== null) {
					steps.push({
						label: ingredient.label,
						stateKey: ingredient.stateKey,
						description: ingredient.description,
						modbusAddress: ingredient.readAddress
					});
				}
			}

			// Add auto-triggered ingredients
			// Muddling for mint
			if (customIngredients.includes('mint')) {
				const muddling = INGREDIENTS['muddling'];
				if (muddling) {
					steps.push({
						label: muddling.label,
						stateKey: muddling.stateKey,
						description: muddling.description,
						modbusAddress: muddling.readAddress
					});
				}
			}

			// Stirring and straw for soda/coke
			const hasMixer = customIngredients.includes('soda') || customIngredients.includes('coke');
			if (hasMixer) {
				const stirring = INGREDIENTS['stirring'];
				const straw = INGREDIENTS['straw'];

				if (stirring) {
					steps.push({
						label: stirring.label,
						stateKey: stirring.stateKey,
						description: stirring.description,
						modbusAddress: stirring.readAddress
					});
				}
				if (straw) {
					steps.push({
						label: straw.label,
						stateKey: straw.stateKey,
						description: straw.description,
						modbusAddress: straw.readAddress
					});
				}
			}

			// Sort steps by modbus address for correct execution order
			steps.sort((a, b) => {
				const addrA = a.modbusAddress ?? 0;
				const addrB = b.modbusAddress ?? 0;
				return addrA - addrB;
			});
		}

		// Always add "Drink Ready" as the final step
		steps.push({
			label: 'Drink Ready',
			stateKey: 'drinkReady',
			description: 'Your custom drink is ready!'
		});

		return steps;
	}

	// Handle predefined cocktails
	const cocktail = /** @type {any} */ (COCKTAILS)[cocktailId];
	if (!cocktail) {
		return [];
	}

	// Generate steps from cocktail ingredients
	for (const ingredientId of cocktail.ingredients) {
		const ingredient = /** @type {any} */ (INGREDIENTS)[ingredientId];
		if (ingredient && ingredient.readAddress !== null) {
			steps.push({
				label: ingredient.label,
				stateKey: ingredient.stateKey,
				description: ingredient.description
			});
		}
	}

	// Always add "Drink Ready" as the final step
	steps.push({
		label: 'Drink Ready',
		stateKey: 'drinkReady',
		description: 'The process is finished'
	});

	return steps;
}

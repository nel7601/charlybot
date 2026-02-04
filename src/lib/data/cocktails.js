import { COCKTAILS, getCocktailSteps } from '$lib/modbus/registry.js';

/**
 * @typedef {Object} CocktailStep
 * @property {string} label - Display name of the step
 * @property {string} stateKey - Robot state key to monitor
 * @property {string} description - Description of what happens
 * @property {number} [modbusAddress] - Optional Modbus address for ordering custom ingredients
 */

/**
 * @typedef {Object} Cocktail
 * @property {string} id
 * @property {string} name
 * @property {string} imageUrl
 * @property {number} modbusAddress
 * @property {string} category
 * @property {CocktailStep[]} steps - Preparation steps
 */

/**
 * Get cocktails array from registry
 * Converts registry format to display format with steps
 * @returns {Cocktail[]}
 */
export const cocktails = Object.values(COCKTAILS).map(cocktail => ({
	id: cocktail.id,
	name: cocktail.name,
	imageUrl: cocktail.imageUrl,
	modbusAddress: cocktail.modbusAddress,
	category: cocktail.category,
	steps: getCocktailSteps(cocktail.id)
}));

/**
 * Get cocktail by ID
 * @param {string} id
 * @param {string[] | null} [customIngredients] - Selected ingredients for custom drinks
 * @returns {Cocktail | undefined}
 */
export function getCocktailById(id, customIngredients = null) {
	// Handle custom cocktail
	if (id === 'custom') {
		return {
			id: 'custom',
			name: 'Custom Drink',
			imageUrl: '',
			modbusAddress: 107,
			category: 'custom',
			steps: getCocktailSteps(id, customIngredients)
		};
	}

	// Handle predefined cocktails
	const cocktail = /** @type {any} */ (COCKTAILS)[id];
	if (!cocktail) {
		return undefined;
	}

	return {
		id: cocktail.id,
		name: cocktail.name,
		imageUrl: cocktail.imageUrl,
		modbusAddress: cocktail.modbusAddress,
		category: cocktail.category,
		steps: getCocktailSteps(id)
	};
}

/**
 * Get cocktails by category
 * @param {string} category
 * @returns {Cocktail[]}
 */
export function getCocktailsByCategory(category) {
	return cocktails.filter(c => c.category === category);
}

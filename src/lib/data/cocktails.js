/**
 * @typedef {Object} CocktailStep
 * @property {string} label - Display name of the step
 * @property {string} stateKey - Robot state key to monitor
 * @property {string} description - Description of what happens
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

/** @type {Cocktail[]} */
export const cocktails = [
	{
		id: 'mojito',
		name: 'Mojito',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
		modbusAddress: 100,
		category: 'rum',
		steps: [
			{ label: 'Placing Mint', stateKey: 'mint', description: 'Placing mint leaves in the glass' }, // 32
			{ label: 'Muddling', stateKey: 'muddling', description: 'Muddling the mint leaves' }, // 33
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Syrup', stateKey: 'syrup', description: 'Pouring syrup into a glass' }, // 35
			{ label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into a glass' }, // 36
			{ label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into a glass' }, // 37
			{ label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into a glass' }, // 40
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'cuba-libre',
		name: 'Cuba Libre',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/ck6d0p1504388696.jpg',
		modbusAddress: 101,
		category: 'rum',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into a glass' }, // 36
			{ label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into the glass' }, // 37
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' }, // 41
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'cubata',
		name: 'Cubata',
		imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
		modbusAddress: 102,
		category: 'rum',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Dark Rum', stateKey: 'darkRum', description: 'Pouring dark rum into the glass' }, // 38
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' }, // 41
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'whiskey-rocks',
		name: 'Whiskey on the Rocks',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/rtpxqw1468877562.jpg',
		modbusAddress: 103,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'neat-whiskey',
		name: 'Neat Whiskey',
		imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80',
		modbusAddress: 104,
		category: 'whiskey',
		steps: [
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'whiskey-highball',
		name: 'Whiskey Highball',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/n0sx531504372951.jpg',
		modbusAddress: 105,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into the glass' }, // 40
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	},
	{
		id: 'whiskey-coke',
		name: 'Whiskey and Coke',
		imageUrl: 'https://images.unsplash.com/photo-1481671703460-040cb8a2d909?w=400&q=80',
		modbusAddress: 106,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' }, // 34
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' }, // 39
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' }, // 41
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' } // 91
		]
	}
];

// Map ingredient IDs to their configuration
const ingredientMapping = {
	'mint': { label: 'Placing Mint', stateKey: 'mint', description: 'Placing mint leaves in the glass' },
	'ice': { label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' },
	'syrup': { label: 'Pouring Syrup', stateKey: 'syrup', description: 'Pouring syrup into the glass' },
	'lime': { label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into the glass' },
	'white-rum': { label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into the glass' },
	'dark-rum': { label: 'Pouring Dark Rum', stateKey: 'darkRum', description: 'Pouring dark rum into the glass' },
	'whiskey': { label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' },
	'soda': { label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into the glass' },
	'coke': { label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' }
};

/**
 * Get cocktail by ID
 * @param {string} id
 * @param {string[] | null} [customIngredients] - Selected ingredients for custom drinks
 * @returns {Cocktail | undefined}
 */
export function getCocktailById(id, customIngredients = null) {
	// Handle custom cocktail
	if (id === 'custom') {
		const steps = [];

		// Generate steps based on selected ingredients
		if (customIngredients && customIngredients.length > 0) {
			customIngredients.forEach(ingredientId => {
				// @ts-ignore - ingredientId is a valid key from CustomCocktailModal
				const ingredient = ingredientMapping[ingredientId];
				if (ingredient) {
					steps.push(ingredient);
				}
			});
		}

		// Always add "Drink Ready" as the final step
		steps.push({ label: 'Drink Ready', stateKey: 'drinkReady', description: 'Your custom drink is ready!' });

		return {
			id: 'custom',
			name: 'Custom Drink',
			imageUrl: '',
			modbusAddress: 107,
			category: 'custom',
			steps: steps
		};
	}
	return cocktails.find(c => c.id === id);
}

/**
 * Get cocktails by category
 * @param {string} category
 * @returns {Cocktail[]}
 */
export function getCocktailsByCategory(category) {
	return cocktails.filter(c => c.category === category);
}

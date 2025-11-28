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
			{ label: 'Muddling', stateKey: 'muddling', description: 'Pick and place mint leaves and muddle it' },
			{ label: 'Pouring Syrup', stateKey: 'syrup', description: 'Pouring syrup into a glass' },
			{ label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into a glass' },
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' },
			{ label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into a glass' },
			{ label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into a glass' },
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' }
		]
	},
	{
		id: 'cuba-libre',
		name: 'Cuba Libre',
		imageUrl: 'https://www.thecocktaildb.com/images/media/drink/ck6d0p1504388696.jpg',
		modbusAddress: 101,
		category: 'rum',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' },
			{ label: 'Pouring White Rum', stateKey: 'whiteRum', description: 'Pouring white rum into the glass' },
			{ label: 'Adding Lime', stateKey: 'lime', description: 'Pouring lime into a glass' },
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' },
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' }
		]
	},
	{
		id: 'cubata',
		name: 'Cubata',
		imageUrl: 'https://www.liquor.com/thmb/iIWYL80vVTGGGLjs6vMTQUk8w1o=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/__opt__aboutcom__coeus__resources__content_migration__liquor__2018__01__02105149__Cuba-Libre-720x720-recipe-673b48bbef034d89b6b5149b8417c7d5.jpg',
		modbusAddress: 102,
		category: 'rum',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' },
			{ label: 'Pouring Dark Rum', stateKey: 'darkRum', description: 'Pouring dark rum into the glass' },
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' },
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' }
		]
	},
	{
		id: 'whiskey-rocks',
		name: 'Whiskey on the Rocks',
		imageUrl: 'https://www.foodandwine.com/thmb/SWVtJBCoYwwBmhAGHmhwsBSjeTs=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/old-fashioned-FT-RECIPE0824-8389f49dc5f54ca7a0b3223087698e82.jpeg',
		modbusAddress: 103,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' },
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' },
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' }
		]
	},
	{
		id: 'whiskey-coke',
		name: 'Whiskey and Coke',
		imageUrl: 'https://www.liquor.com/thmb/9eHA7QRo14l2tUEZ12pnYw09svU=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/whiskeyandcoke-720x720-primary-73df64c30d2e4576b4a9a7b727748d1b.jpg',
		modbusAddress: 104,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' },
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' },
			{ label: 'Adding Coke', stateKey: 'coke', description: 'Pouring coke into the glass' },
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' }
		]
	},
	// {
	// 	id: 'neat-whiskey',
	// 	name: 'Neat Whiskey',
	// 	imageUrl: 'https://www.thecocktaildb.com/images/media/drink/5s22081504883416.jpg',
	// 	modbusAddress: 105,
	// 	category: 'whiskey',
	// 	steps: [
	// 		{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' },
	// 		{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' }
	// 	]
	// },
	{
		id: 'whiskey-highball',
		name: 'Whiskey Highball',
		imageUrl: 'https://www.liquor.com/thmb/2w_CTNYp8grTR8MtREhG6y87Dow=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/whiskey-highball-1500x1500-hero-aa13a49019364fab8c94b53861aeb182.jpg',
		modbusAddress: 106,
		category: 'whiskey',
		steps: [
			{ label: 'Adding Ice', stateKey: 'ice', description: 'Adding ice cubes to the glass' },
			{ label: 'Pouring Whiskey', stateKey: 'whiskey', description: 'Pouring whiskey into the glass' },
			{ label: 'Adding Soda', stateKey: 'soda', description: 'Pouring soda into the glass' },
			{ label: 'Drink Ready', stateKey: 'drinkReady', description: 'The process is finished' }
		]
	}
];

/**
 * Get cocktail by ID
 * @param {string} id
 * @returns {Cocktail | undefined}
 */
export function getCocktailById(id) {
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

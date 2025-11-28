import { writable } from 'svelte/store';

/**
 * @typedef {Object} RobotState
 * @property {boolean} muddling - Address 32
 * @property {boolean} syrup - Address 33
 * @property {boolean} lime - Address 34
 * @property {boolean} ice - Address 35
 * @property {boolean} whiteRum - Address 36
 * @property {boolean} darkRum - Address 37
 * @property {boolean} soda - Address 38
 * @property {boolean} coke - Address 39
 * @property {boolean} whiskey - Address 40
 * @property {boolean} cupHolder - Address 90
 * @property {boolean} drinkReady - Address 91
 * @property {boolean} waitingRecipe - Address 92
 */

/**
 * @typedef {Object} CocktailStatus
 * @property {string | null} activeCocktailId - Currently preparing cocktail
 * @property {RobotState} robotState - Current robot state
 * @property {boolean} isConnected - Modbus connection status
 * @property {Error | null} error - Last error
 * @property {number} progress - Preparation progress (0-100)
 */

/** @type {import('svelte/store').Writable<CocktailStatus>} */
export const cocktailStatus = writable({
	activeCocktailId: null,
	robotState: {
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
	},
	isConnected: false,
	error: null,
	progress: 0
});

/** @type {number | null} */
let pollingInterval = null;

/**
 * Start polling Modbus status
 * @param {string} cocktailId
 */
export function startStatusPolling(cocktailId) {
	cocktailStatus.update(state => ({
		...state,
		activeCocktailId: cocktailId,
		progress: 0,
		error: null
	}));

	if (pollingInterval) {
		clearInterval(pollingInterval);
	}

	// Poll every 500ms
	pollingInterval = setInterval(async () => {
		try {
			const response = await fetch('/api/status');
			if (!response.ok) throw new Error('Status fetch failed');

			const data = await response.json();

			cocktailStatus.update(state => ({
				...state,
				robotState: data.robotState,
				isConnected: data.isConnected,
				progress: calculateProgress(data.robotState)
			}));

			// Stop polling when drink is ready
			if (data.robotState.drinkReady) {
				stopStatusPolling();
			}
		} catch (error) {
			cocktailStatus.update(state => ({
				...state,
				error: error,
				isConnected: false
			}));
		}
	}, 500);
}

/**
 * Stop polling
 */
export function stopStatusPolling() {
	if (pollingInterval) {
		clearInterval(pollingInterval);
		pollingInterval = null;
	}
}

/**
 * Calculate progress based on active states
 * @param {RobotState} state
 * @returns {number} Progress percentage (0-100)
 */
function calculateProgress(state) {
	const steps = [
		state.cupHolder,
		state.muddling || state.syrup || state.lime,
		state.ice,
		state.whiteRum || state.darkRum || state.whiskey,
		state.soda || state.coke,
		state.drinkReady
	];

	const completed = steps.filter(Boolean).length;
	return Math.round((completed / steps.length) * 100);
}

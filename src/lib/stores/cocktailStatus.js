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

	// Poll every 2000ms (reduced frequency to avoid overwhelming the device)
	pollingInterval = setInterval(async () => {
		try {
			const response = await fetch('/api/status', {
				// Add timeout to prevent hanging requests
				signal: AbortSignal.timeout(4000)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Status fetch failed' }));
				throw new Error(errorData.message || 'Status fetch failed');
			}

			const data = await response.json();

			cocktailStatus.update(state => ({
				...state,
				robotState: data.robotState,
				isConnected: data.isConnected,
				progress: calculateProgress(data.robotState),
				error: null // Clear error on success
			}));

			// Stop polling when drink is ready
			if (data.robotState.drinkReady) {
				stopStatusPolling();
			}
		} catch (error) {
			console.error('[Status] Polling error:', error.message);
			cocktailStatus.update(state => ({
				...state,
				error: error,
				isConnected: false
			}));
		}
	}, 2000);
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
 * Calculate progress based on the current cocktail's steps
 * @param {RobotState} state
 * @returns {number} Progress percentage (0-100)
 */
function calculateProgress(state) {
	// Import cocktails to get current cocktail steps
	// For now, count all true values in the state
	const allSteps = [
		state.muddling,
		state.syrup,
		state.lime,
		state.ice,
		state.whiteRum,
		state.darkRum,
		state.soda,
		state.coke,
		state.whiskey,
		state.drinkReady
	];

	const completed = allSteps.filter(Boolean).length;
	const total = allSteps.filter(step => step !== undefined).length;

	if (state.drinkReady) {
		return 100;
	}

	return total > 0 ? Math.round((completed / total) * 100) : 0;
}

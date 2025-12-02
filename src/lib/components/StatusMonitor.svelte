<script>
	import { cocktailStatus, stopStatusPolling } from '$lib/stores/cocktailStatus.js';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import { GlassWater, Bot, CheckCircle, XCircle, Circle, Loader2 } from '@lucide/svelte';
	import { getCocktailById } from '$lib/data/cocktails.js';

	let showModal = $state(false);

	$effect(() => {
		if ($cocktailStatus.activeCocktailId) {
			showModal = true;
		}

		if ($cocktailStatus.robotState.drinkReady) {
			setTimeout(() => {
				showModal = false;
				stopStatusPolling();
			}, 3000);
		}
	});

	/** @returns {import('$lib/data/cocktails.js').Cocktail | undefined} */
	function getCurrentCocktail() {
		if (!$cocktailStatus.activeCocktailId) return undefined;
		return getCocktailById($cocktailStatus.activeCocktailId);
	}

	/**
	 * Check if a step is active based on robot state
	 * @param {string} stateKey
	 */
	function isStepActive(stateKey) {
		return $cocktailStatus.robotState[stateKey] === true;
	}

	/**
	 * Check if a step is the current active step (first incomplete step)
	 * @param {number} stepIndex
	 */
	function isCurrentStep(stepIndex) {
		const cocktail = getCurrentCocktail();
		if (!cocktail) return false;

		// Find the first step that hasn't been completed yet
		for (let i = 0; i < cocktail.steps.length; i++) {
			const step = cocktail.steps[i];
			if (!isStepActive(step.stateKey)) {
				return i === stepIndex;
			}
		}
		return false;
	}
</script>

{#if showModal}
<dialog class="modal modal-open" style="animation: fadeIn 0.3s ease-out;">
	<div class="modal-box max-w-3xl w-full bg-white border-4 border-cyan-200 shadow-2xl" style="animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
		<!-- Compact Header -->
		<div class="flex flex-col gap-4 mb-8 pb-6 border-b-2 border-gray-200">
			<div class="flex items-center gap-4">
				{#if $cocktailStatus.robotState.drinkReady}
					<GlassWater class="w-12 h-12 text-cyan-600" />
				{:else}
					<Bot class="w-12 h-12 text-cyan-600 animate-pulse" />
				{/if}
				<div class="flex-1">
					<h3 class="font-bold text-3xl md:text-4xl gradient-text">
						{#if $cocktailStatus.robotState.drinkReady}
							Cocktail Ready!
						{:else}
							Preparing {getCurrentCocktail()?.name || 'Your Cocktail'}
						{/if}
					</h3>
					{#if !$cocktailStatus.robotState.drinkReady}
						<p class="text-lg md:text-xl text-gray-600 mt-1">Please wait while Charly crafts your drink...</p>
					{/if}
				</div>
			</div>
			<ProgressIndicator progress={$cocktailStatus.progress} />
		</div>

		<!-- Cocktail Steps in Grid -->
		{#if getCurrentCocktail()}
			<div class="grid grid-cols-1 gap-4">
				{#each getCurrentCocktail().steps as step, index}
					{@const isActive = isStepActive(step.stateKey)}
					{@const isCurrent = isCurrentStep(index)}
					<div
						class="flex items-center gap-5 p-5 rounded-xl border-2 transition-all duration-300 {
							isActive
								? 'bg-green-50 border-green-400'
								: isCurrent
									? 'bg-cyan-50 border-cyan-400'
									: 'bg-gray-50 border-gray-200 opacity-50'
						}"
						style="animation: slideUp 0.5s ease-out {index * 0.05}s both;"
					>
						<!-- Icon -->
						<div class="shrink-0">
							{#if isActive}
								<CheckCircle class="w-8 h-8 text-green-600" />
							{:else if isCurrent}
								<Loader2 class="w-8 h-8 text-cyan-600 animate-spin" />
							{:else}
								<Circle class="w-8 h-8 text-gray-300" />
							{/if}
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-xl md:text-2xl text-gray-800 truncate">
								{step.label}
							</div>
							<div class="text-base md:text-lg {isActive ? 'text-green-700' : isCurrent ? 'text-cyan-700' : 'text-gray-500'} truncate">
								{step.description}
							</div>
						</div>

						<!-- Status Icon (compact) -->
						<div class="shrink-0">
							{#if isActive}
								<div class="w-3 h-3 bg-green-500 rounded-full"></div>
							{:else if isCurrent}
								<div class="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
							{:else}
								<div class="w-3 h-3 bg-gray-300 rounded-full"></div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Error Display -->
		{#if $cocktailStatus.error}
			<div class="alert alert-error mt-6 border-2 border-red-500/30" style="animation: slideUp 0.5s ease-out;">
				<div class="flex items-start gap-3">
					<XCircle class="w-6 h-6 shrink-0" />
					<div>
						<h3 class="font-bold">Connection Error</h3>
						<div class="text-sm">{$cocktailStatus.error.message}</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Success Button -->
		{#if $cocktailStatus.robotState.drinkReady}
			<div class="modal-action justify-center mt-10">
				<button
					class="btn btn-lg krka-accent-gradient border-0 text-white hover:shadow-xl transition-all duration-300 active:scale-95 text-xl md:text-2xl px-10 py-6 h-auto"
					onclick={() => showModal = false}
					style="animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;"
				>
					<CheckCircle class="w-8 h-8" />
					Collect Your Drink
				</button>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop bg-gray-900/50 backdrop-blur-sm">
		<button>close</button>
	</form>
</dialog>
{/if}

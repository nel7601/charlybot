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
	<div class="modal-box max-w-xl w-full glass-morphism border-2 border-white/20" style="animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
		<!-- Compact Header -->
		<div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
			<div class="flex items-center gap-3">
				{#if $cocktailStatus.robotState.drinkReady}
					<GlassWater class="w-8 h-8 text-purple-400" />
				{:else}
					<Bot class="w-8 h-8 text-purple-400 animate-pulse" />
				{/if}
				<div>
					<h3 class="font-bold text-2xl gradient-text">
						{#if $cocktailStatus.robotState.drinkReady}
							Cocktail Ready!
						{:else}
							Preparing {getCurrentCocktail()?.name || 'Your Cocktail'}
						{/if}
					</h3>
					{#if !$cocktailStatus.robotState.drinkReady}
						<p class="text-sm opacity-60">Please wait while Charly crafts your drink...</p>
					{/if}
				</div>
			</div>
			<ProgressIndicator progress={$cocktailStatus.progress} />
		</div>

		<!-- Cocktail Steps in Grid -->
		{#if getCurrentCocktail()}
			<div class="grid grid-cols-1 gap-3">
				{#each getCurrentCocktail().steps as step, index}
					{@const isActive = isStepActive(step.stateKey)}
					{@const isCurrent = isCurrentStep(index)}
					<div
						class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 {
							isActive
								? 'bg-green-500/10 border-green-500/30'
								: isCurrent
									? 'bg-purple-500/10 border-purple-500/30'
									: 'bg-white/5 border-white/10 opacity-50'
						}"
						style="animation: slideUp 0.5s ease-out {index * 0.05}s both;"
					>
						<!-- Icon -->
						<div class="shrink-0">
							{#if isActive}
								<CheckCircle class="w-5 h-5 text-green-400" />
							{:else if isCurrent}
								<Loader2 class="w-5 h-5 text-purple-400 animate-spin" />
							{:else}
								<Circle class="w-5 h-5 text-white/30" />
							{/if}
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-sm text-white truncate">
								{step.label}
							</div>
							<div class="text-xs {isActive ? 'text-green-200' : isCurrent ? 'text-purple-200' : 'text-white/40'} truncate">
								{step.description}
							</div>
						</div>

						<!-- Status Icon (compact) -->
						<div class="shrink-0">
							{#if isActive}
								<div class="w-2 h-2 bg-green-400 rounded-full"></div>
							{:else if isCurrent}
								<div class="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
							{:else}
								<div class="w-2 h-2 bg-white/20 rounded-full"></div>
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
			<div class="modal-action justify-center mt-8">
				<button
					class="btn btn-lg bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white hover:from-purple-700 hover:to-pink-700"
					onclick={() => showModal = false}
					style="animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;"
				>
					<CheckCircle class="w-6 h-6" />
					Collect Your Drink
				</button>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop bg-black/60 backdrop-blur-sm">
		<button>close</button>
	</form>
</dialog>
{/if}

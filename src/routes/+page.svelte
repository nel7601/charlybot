<script>
	import { cocktails } from '$lib/data/cocktails.js';
	import { startStatusPolling } from '$lib/stores/cocktailStatus.js';
	import CocktailCard from '$lib/components/CocktailCard.svelte';
	import StatusMonitor from '$lib/components/StatusMonitor.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { Bot, AlertCircle, Loader2 } from '@lucide/svelte';

	let loading = $state(false);
	let errorMessage = $state('');

	/**
	 * Handle cocktail selection
	 * @param {string} cocktailId
	 */
	async function handleCocktailSelect(cocktailId) {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch(`/api/cocktails/${cocktailId}`, {
				method: 'POST'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to order cocktail');
			}

			const result = await response.json();

			// Start real-time status polling
			startStatusPolling(cocktailId);

		} catch (error) {
			errorMessage = error.message;
			console.error('Order error:', error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Robot Bartender</title>
	<meta name="description" content="Automated cocktail preparation system" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<!-- Animated background -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" style="animation: float 6s ease-in-out infinite;"></div>
	</div>

	<!-- Header -->
	<header class="relative backdrop-blur-md bg-base-300/50 border-b border-base-300">
		<div class="container mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
						<Bot class="w-7 h-7 text-primary-content" />
					</div>
					<h1 class="text-3xl font-bold text-primary">Charly Bot</h1>
				</div>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Error Alert -->
	{#if errorMessage}
		<div class="container mx-auto px-6 mt-6 " style="animation: slideUp 0.5s ease-out;">
			<div class="alert alert-error">
				<div class="flex items-center gap-3">
					<AlertCircle class="w-6 h-6" />
					<span>{errorMessage}</span>
				</div>
				<button class="btn btn-sm btn-ghost" onclick={() => errorMessage = ''}>Close</button>
			</div>
		</div>
	{/if}

	<!-- Cocktail Menu -->
	<section class="relative container mx-auto px-6 py-12 max-w-5xl">
		<div class="mb-8 text-center">
			<h2 class="text-5xl font-bold text-base-content mb-3">Select Your Drink</h2>
			<p class="text-lg text-base-content/70">Choose from our premium automated cocktail selection</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style="animation: fadeIn 0.8s ease-out;">
			{#each cocktails as cocktail, index}
				<div style="animation: slideUp 0.5s ease-out {index * 0.1}s both;">
					<CocktailCard
						{cocktail}
						onSelect={handleCocktailSelect}
					/>
				</div>
			{/each}
		</div>
	</section>
</div>

<!-- Status Monitor Modal -->
<StatusMonitor />

<!-- Loading Overlay -->
{#if loading}
	<div class="fixed inset-0 bg-base-300/70 backdrop-blur-sm flex items-center justify-center z-50" style="animation: fadeIn 0.3s ease-out;">
		<div class="flex flex-col items-center gap-4">
			<Loader2 class="w-12 h-12 text-primary animate-spin" />
			<p class="text-base-content text-lg font-medium">Processing your order...</p>
		</div>
	</div>
{/if}

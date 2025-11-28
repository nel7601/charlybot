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

<div class="min-h-screen  bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Animated background -->
	<div class="fixed inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
		<div class="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" style="animation: float 6s ease-in-out infinite;"></div>
	</div>

	<!-- Header -->
	<header class="relative backdrop-blur-md bg-black/20 border-b border-white/10">
		<div class="container mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
						<Bot class="w-7 h-7 text-white" />
					</div>
					<h1 class="text-3xl font-bold gradient-text">Charly Bot</h1>
				</div>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<!-- Error Alert -->
	{#if errorMessage}
		<div class="container mx-auto px-6 mt-6 " style="animation: slideUp 0.5s ease-out;">
			<div class="alert bg-red-500/10 border-2 border-red-500/30 backdrop-blur-md">
				<div class="flex items-center gap-3">
					<AlertCircle class="w-6 h-6 text-red-400" />
					<span class="text-white">{errorMessage}</span>
				</div>
				<button class="btn btn-sm btn-ghost text-white" onclick={() => errorMessage = ''}>Close</button>
			</div>
		</div>
	{/if}

	<!-- Cocktail Menu -->
	<section class="relative container mx-auto px-6 py-12 max-w-5xl">
		<div class="mb-8 text-center">
			<h2 class="text-5xl font-bold text-white mb-3">Select Your Drink</h2>
			<p class="text-lg text-purple-200">Choose from our premium automated cocktail selection</p>
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
	<div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" style="animation: fadeIn 0.3s ease-out;">
		<div class="flex flex-col items-center gap-4">
			<Loader2 class="w-12 h-12 text-purple-400 animate-spin" />
			<p class="text-white text-lg font-medium">Processing your order...</p>
		</div>
	</div>
{/if}

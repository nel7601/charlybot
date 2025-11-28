<script>
	import { onMount } from 'svelte';
	import { Sun, Moon } from '@lucide/svelte';

	let isDark = $state(false);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		const savedTheme = localStorage.getItem('theme') || 'light';
		isDark = savedTheme === 'dark';
		applyTheme(savedTheme);
	});

	function toggleTheme() {
		isDark = !isDark;
		const theme = isDark ? 'dark' : 'light';
		applyTheme(theme);
		localStorage.setItem('theme', theme);
	}

	/**
	 * @param {string} theme
	 */
	function applyTheme(theme) {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', theme);
			document.documentElement.classList.toggle('dark', theme === 'dark');
		}
	}
</script>

{#if mounted}
<button
	class="btn btn-circle btn-ghost text-white hover:bg-white/10"
	onclick={toggleTheme}
	aria-label="Toggle theme"
>
	{#if isDark}
		<Sun class="w-5 h-5" />
	{:else}
		<Moon class="w-5 h-5" />
	{/if}
</button>
{/if}

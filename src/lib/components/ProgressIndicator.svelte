<script>
	/** @type {{ progress: number }} */
	let { progress } = $props();
</script>

<div class="w-48">
	<div class="flex items-center gap-2">
		<div class="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
			<div
				class="h-2 rounded-full transition-all duration-500 ease-out glass-shimmer {
					progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
				}"
				style="width: {progress}%"
			></div>
		</div>
		<span class="text-sm font-bold text-white min-w-[3rem] text-right">{progress}%</span>
	</div>
</div>

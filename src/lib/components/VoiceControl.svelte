<script>
	import { Mic, MicOff, Loader2 } from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {(cocktailId: string) => void} onCocktailSelected - Callback when cocktail is identified
	 */

	/** @type {Props} */
	let { onCocktailSelected } = $props();

	let isRecording = $state(false);
	let isProcessing = $state(false);
	let transcript = $state('');
	let errorMessage = $state('');
	let successMessage = $state('');

	/** @type {MediaRecorder | null} */
	let mediaRecorder = null;
	/** @type {Blob[]} */
	let audioChunks = [];

	/**
	 * Start recording audio
	 */
	async function startRecording() {
		try {
			errorMessage = '';
			successMessage = '';
			transcript = '';

			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'audio/webm'
			});

			audioChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = async () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
				await processAudio(audioBlob);

				// Stop all tracks
				stream.getTracks().forEach(track => track.stop());
			};

			mediaRecorder.start();
			isRecording = true;

		} catch (err) {
			console.error('Error accessing microphone:', err);
			errorMessage = 'No se pudo acceder al micrófono. Por favor, verifica los permisos.';
		}
	}

	/**
	 * Stop recording audio
	 */
	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			isRecording = false;
		}
	}

	/**
	 * Process recorded audio
	 * @param {Blob} audioBlob
	 */
	async function processAudio(audioBlob) {
		try {
			isProcessing = true;
			errorMessage = '';

			const formData = new FormData();
			formData.append('audio', audioBlob, 'audio.webm');

			const response = await fetch('/api/voice-recognition', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Error al procesar el audio');
			}

			transcript = data.transcript;

			if (data.success && data.cocktail) {
				successMessage = `¡Detectado: ${data.cocktail.name}!`;

				// Wait a moment to show the message
				setTimeout(() => {
					onCocktailSelected(data.cocktail.id);
					successMessage = '';
					transcript = '';
				}, 1500);
			} else {
				errorMessage = data.message || 'No se pudo identificar el cóctel.';
			}

		} catch (err) {
			console.error('Error processing audio:', err);
			errorMessage = err.message || 'Error al procesar el comando de voz';
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * Toggle recording
	 */
	function toggleRecording() {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}

	/**
	 * Clear messages after timeout
	 */
	$effect(() => {
		if (errorMessage) {
			const timeout = setTimeout(() => {
				errorMessage = '';
			}, 5000);
			return () => clearTimeout(timeout);
		}
	});
</script>

<!-- Floating button -->
<div class="fixed bottom-8 right-8 z-50">
	<!-- Messages -->
	{#if transcript || errorMessage || successMessage}
		<div class="mb-4 max-w-xs">
			{#if successMessage}
				<div class="alert alert-success shadow-lg mb-2">
					<span class="text-sm">{successMessage}</span>
				</div>
			{/if}

			{#if errorMessage}
				<div class="alert alert-error shadow-lg mb-2">
					<span class="text-sm">{errorMessage}</span>
				</div>
			{/if}

			{#if transcript}
				<div class="alert alert-info shadow-lg">
					<div>
						<div class="text-xs opacity-70">Transcripción:</div>
						<div class="text-sm font-semibold">{transcript}</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Voice button -->
	<button
		onclick={toggleRecording}
		disabled={isProcessing}
		class="btn btn-circle btn-lg shadow-xl transition-all duration-200"
		class:btn-error={isRecording}
		class:btn-primary={!isRecording && !isProcessing}
		class:btn-disabled={isProcessing}
		aria-label={isRecording ? 'Detener grabación' : 'Grabar comando de voz'}
		title={isRecording ? 'Click para detener' : 'Click para hablar'}
	>
		{#if isProcessing}
			<Loader2 class="w-6 h-6 animate-spin" />
		{:else if isRecording}
			<MicOff class="w-6 h-6 animate-pulse" />
		{:else}
			<Mic class="w-6 h-6" />
		{/if}
	</button>

	<!-- Recording indicator -->
	{#if isRecording}
		<div class="absolute -top-2 -right-2">
			<span class="relative flex h-4 w-4">
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
				<span class="relative inline-flex rounded-full h-4 w-4 bg-error"></span>
			</span>
		</div>
	{/if}
</div>

<style>
	.animate-ping {
		animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
	}

	@keyframes ping {
		75%, 100% {
			transform: scale(2);
			opacity: 0;
		}
	}
</style>

<script>
	import { Mic, MicOff, Loader2 } from '@lucide/svelte';

	/**
	 * @typedef {Object} Props
	 * @property {(cocktailId: string) => void} onCocktailSelected - Callback when cocktail is identified
	 */

	/** @type {Props} */
	let { onCocktailSelected } = $props();

	// Recording states
	let isRecording = $state(false);
	let isProcessing = $state(false);

	// Audio detection states
	let audioLevel = $state(0);          // 0-100 scale
	let isSpeaking = $state(false);      // true when sound detected
	let audioLevelThreshold = $state(10); // Threshold for "speaking"

	// Feedback messages
	let transcript = $state('');
	let errorMessage = $state('');
	let successMessage = $state('');

	// MediaRecorder & Web Audio API
	/** @type {MediaRecorder | null} */
	let mediaRecorder = null;
	/** @type {AudioContext | null} */
	let audioContext = null;
	/** @type {AnalyserNode | null} */
	let analyserNode = null;
	/** @type {number | null} */
	let animationFrameId = null;
	/** @type {Blob[]} */
	let audioChunks = [];

	/**
	 * Calculate sound wave bar height based on audio level
	 * @param {number} level - Audio level (0-100)
	 * @param {number} barIndex - Bar position (0-4)
	 * @returns {number} Height in pixels
	 */
	function calculateBarHeight(level, barIndex) {
		const baseHeight = 10;
		const maxHeight = 60;
		// Center bar (index 2) is tallest, outer bars smaller
		const multipliers = [0.6, 0.9, 1.5, 0.9, 0.6];
		const multiplier = multipliers[barIndex] || 1;
		return Math.max(baseHeight, Math.min(maxHeight, level * multiplier));
	}

	/**
	 * Monitor audio level in real-time using Web Audio API
	 */
	function monitorAudioLevel() {
		if (!analyserNode) return;

		const bufferLength = analyserNode.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		function updateLevel() {
			if (!isRecording || !analyserNode) return;

			analyserNode.getByteFrequencyData(dataArray);

			// Calculate average amplitude
			const sum = dataArray.reduce((acc, val) => acc + val, 0);
			const average = sum / bufferLength;

			// Convert to 0-100 scale (amplified for better visibility)
			audioLevel = Math.min(100, (average / 255) * 100 * 2);

			// Determine if user is speaking
			isSpeaking = audioLevel > audioLevelThreshold;

			animationFrameId = requestAnimationFrame(updateLevel);
		}

		updateLevel();
	}

	/**
	 * Stop audio analysis and cleanup
	 */
	function stopAudioAnalysis() {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}
		analyserNode = null;
		audioLevel = 0;
		isSpeaking = false;
	}

	/**
	 * Start recording audio
	 */
	async function startRecording() {
		try {
			errorMessage = '';
			successMessage = '';
			transcript = '';

			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			// Setup MediaRecorder for audio capture
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

				// Cleanup audio analysis
				stopAudioAnalysis();
			};

			// Setup Web Audio API for level detection
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			analyserNode = audioContext.createAnalyser();
			analyserNode.fftSize = 256;

			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyserNode);

			// Start recording
			mediaRecorder.start();
			isRecording = true;

			// Start audio level monitoring
			monitorAudioLevel();

		} catch (err) {
			console.error('Error accessing microphone:', err);

			// Provide specific error messages
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings.';
			} else if (err.name === 'NotFoundError') {
				errorMessage = 'No microphone found. Please connect a microphone and try again.';
			} else {
				errorMessage = 'Could not access microphone. Please check permissions.';
			}
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
				throw new Error(data.message || 'Error processing audio');
			}

			transcript = data.transcript;

			if (data.success && data.cocktail) {
				successMessage = `Detected: ${data.cocktail.name}!`;

				// Wait a moment to show the message
				setTimeout(() => {
					onCocktailSelected(data.cocktail.id);
					successMessage = '';
					transcript = '';
				}, 1500);
			} else {
				errorMessage = data.message || 'Could not identify the cocktail.';
			}

		} catch (err) {
			console.error('Error processing audio:', err);
			if (err.message.includes('fetch')) {
				errorMessage = 'Network error. Please check your connection and try again.';
			} else {
				errorMessage = err.message || 'Error processing voice command';
			}
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

<!-- Full-screen blur overlay (when recording) -->
{#if isRecording}
	<div
		class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-md flex flex-col items-center justify-center"
		style="animation: fadeIn 0.3s ease-out;"
	>
		<!-- Status text -->
		<h2 class="text-5xl font-bold text-white mb-4">
			{isSpeaking ? 'Listening...' : 'Ready to speak'}
		</h2>

		<!-- Sound wave indicator (visible when speaking) -->
		{#if isSpeaking}
			<div class="flex items-center justify-center gap-2 mt-6">
				{#each Array(5) as _, i}
					<div
						class="w-2 bg-cyan-400 rounded-full transition-all duration-100"
						style="height: {calculateBarHeight(audioLevel, i)}px"
					></div>
				{/each}
			</div>
		{/if}

		<!-- Instruction text -->
		<p class="text-xl text-white/80 text-center max-w-md px-4 mt-8">
			Speak the name of your cocktail, then click the button to stop
		</p>
	</div>
{/if}

<!-- Messages above button (center-aligned) -->
{#if transcript || errorMessage || successMessage}
	<div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
		{#if successMessage}
			<div class="alert alert-success shadow-lg mb-2 bg-green-50 border-2 border-green-400">
				<span class="text-lg font-semibold">{successMessage}</span>
			</div>
		{/if}

		{#if errorMessage}
			<div class="alert alert-error shadow-lg mb-2 bg-red-50 border-2 border-red-300">
				<span class="text-lg font-semibold">{errorMessage}</span>
			</div>
		{/if}

		{#if transcript}
			<div class="alert alert-info shadow-lg bg-blue-50 border-2 border-blue-300">
				<div class="text-center">
					<div class="text-sm opacity-70 mb-1">Transcript:</div>
					<div class="text-lg font-semibold">{transcript}</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- Floating button (bottom-center) -->
<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
	<!-- Voice button -->
	<button
		onclick={toggleRecording}
		disabled={isProcessing}
		class="btn btn-circle btn-xl shadow-xl transition-all duration-200"
		class:btn-error={isRecording}
		class:btn-primary={!isRecording && !isProcessing}
		class:btn-disabled={isProcessing}
		class:animate-pulse={isRecording && isSpeaking}
		aria-label={isRecording ? 'Stop recording' : 'Record voice command'}
		title={isRecording ? 'Click to stop' : 'Click to speak'}
	>
		{#if isProcessing}
			<Loader2 class="w-6 h-6 animate-spin" />
		{:else if isRecording}
			<MicOff class="w-6 h-6" />
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

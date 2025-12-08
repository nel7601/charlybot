<script>
	import { Mic, MicOff, Loader2 } from '@lucide/svelte';
	import { browser } from '$app/environment';

	let { onCocktailSelected } = $props();

	let isRecording = $state(false);
	let isProcessing = $state(false);
	let errorMessage = $state('');

	let mediaRecorder = null;
	let stream = null;
	let chunks = [];

	async function startRecording() {
		try {
			isRecording = true;
			errorMessage = '';
			chunks = [];

			console.log('[VoiceControl] Requesting microphone...');
			stream = await navigator.mediaDevices.getUserMedia({
				audio: true
			});

			// Check if track is live and producing audio
			const audioTrack = stream.getAudioTracks()[0];
			console.log('[VoiceControl] Audio track:', audioTrack.label, 'enabled:', audioTrack.enabled, 'muted:', audioTrack.muted, 'readyState:', audioTrack.readyState);

			console.log('[VoiceControl] Creating MediaRecorder...');
			mediaRecorder = new MediaRecorder(stream);
			console.log('[VoiceControl] MediaRecorder mimeType:', mediaRecorder.mimeType);

			mediaRecorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					console.log('[VoiceControl] Chunk received:', e.data.size, 'bytes');
					chunks.push(e.data);
				}
			};

			mediaRecorder.onstop = async () => {
				console.log('[VoiceControl] Recording stopped. Total chunks:', chunks.length);
				const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
				console.log('[VoiceControl] Final blob size:', blob.size, 'bytes');

				isRecording = false;
				cleanup();

				if (blob.size > 1000) {
					await processAudio(blob);
				} else {
					errorMessage = 'Recording too short. Please try again and speak longer.';
				}
			};

			console.log('[VoiceControl] Starting recording...');
			mediaRecorder.start(1000); // Request data every 1 second
			console.log('[VoiceControl] ✅ Recording started');

		} catch (err) {
			console.error('[VoiceControl] Error:', err);
			errorMessage = 'Could not access microphone. Please check permissions.';
			isRecording = false;
			cleanup();
		}
	}

	async function stopRecording() {
		if (!mediaRecorder) return;

		console.log('[VoiceControl] Stopping recording...');
		if (mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	}

	function cleanup() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		mediaRecorder = null;
		chunks = [];
	}

	async function processAudio(audioBlob) {
		try {
			isProcessing = true;
			errorMessage = '';

			console.log('[VoiceControl] Sending', audioBlob.size, 'bytes to API...');

			const formData = new FormData();
			formData.append('audio', audioBlob, 'audio.webm');

			const response = await fetch('/api/voice-recognition', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();
			console.log('[VoiceControl] API response:', data);

			if (!response.ok) {
				throw new Error(data.message || 'Error processing audio');
			}

			if (data.success && data.cocktail) {
				console.log('[VoiceControl] ✅ Cocktail:', data.cocktail.name, data.cocktail.id);
				onCocktailSelected?.(data.cocktail.id);
			} else {
				console.log('[VoiceControl] No cocktail. Transcript:', data.transcript);
				errorMessage = 'No cocktail detected';
			}
		} catch (err) {
			console.error('[VoiceControl] Error:', err);
			errorMessage = err.message || 'Error processing audio';
		} finally {
			isProcessing = false;
		}
	}

	function toggleRecording() {
		if (isProcessing) return;
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	}

	$effect(() => {
		if (!errorMessage) return;
		const timeout = setTimeout(() => {
			errorMessage = '';
		}, 5000);
		return () => clearTimeout(timeout);
	});
</script>

{#if isRecording}
	<div class="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-md flex flex-col items-center justify-center">
		<h2 class="text-5xl font-bold text-white mb-4">Listening...</h2>
		<div class="flex items-center justify-center gap-2 mt-6">
			<div class="w-3 h-12 bg-cyan-400 rounded-full animate-pulse"></div>
			<div class="w-3 h-16 bg-cyan-400 rounded-full animate-pulse" style="animation-delay: 0.1s"></div>
			<div class="w-3 h-20 bg-cyan-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
			<div class="w-3 h-16 bg-cyan-400 rounded-full animate-pulse" style="animation-delay: 0.3s"></div>
			<div class="w-3 h-12 bg-cyan-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
		</div>
		<p class="text-xl text-white/80 text-center max-w-md px-4 mt-8">
			Speak the name of your cocktail, then click to stop
		</p>
	</div>
{/if}

{#if errorMessage}
	<div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
		<div class="alert alert-error shadow-lg bg-red-50 border-2 border-red-300">
			<span class="text-lg font-semibold">{errorMessage}</span>
		</div>
	</div>
{/if}

<div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
	<button
		onclick={toggleRecording}
		disabled={isProcessing}
		class="btn btn-circle btn-xl shadow-xl transition-all duration-200"
		class:btn-error={isRecording}
		class:btn-primary={!isRecording && !isProcessing}
		class:btn-disabled={isProcessing}
		class:animate-pulse={isRecording}
	>
		{#if isProcessing}
			<Loader2 class="w-6 h-6 animate-spin" />
		{:else if isRecording}
			<MicOff class="w-6 h-6" />
		{:else}
			<Mic class="w-6 h-6" />
		{/if}
	</button>

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

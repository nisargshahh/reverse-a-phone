/* ===========================================================
   Reverse-A-Phone — game logic
   - record voice via MediaRecorder
   - reverse via Web Audio API → re-encode to WAV
   - state machine drives UI via body[data-state]
   =========================================================== */

(() => {
  'use strict';

  // ----- State -----
  const STATES = {
    READY:                 'ready',
    RECORDING_ORIGINAL:    'recording-original',
    PROCESSING_ORIGINAL:   'processing-original',
    PRACTICE:              'practice',
    RECORDING_REVERSED:    'recording-reversed',
    PROCESSING_REVERSED:   'processing-reversed',
    COMPARE:               'compare',
  };

  const game = {
    current: STATES.READY,
    phrase: '',
    recordings: {
      original:                null,  // user saying phrase normally
      originalReversed:        null,  // ^ reversed → "target" sound to mimic
      reversedAttempt:         null,  // user trying to say it backwards
      reversedAttemptReversed: null,  // ^ reversed back → "how close to original?"
    },
    audioObjects: {},          // cached <Audio> per recording for fast playback
    mediaRecorder: null,
    chunks: [],
    activeStream: null,
    audioCtx: null,
  };

  // ----- DOM refs -----
  const $body         = document.body;
  const $phraseText   = document.getElementById('phraseText');
  const $instruction  = document.getElementById('instruction');
  const $btnRecord    = document.getElementById('btnRecord');
  const $btnRecordLab = document.getElementById('btnRecordLabel');
  const $btnStop      = document.getElementById('btnStop');
  const $btnNewSmall  = document.getElementById('btnNewPhraseSmall');
  const $btnNewBig    = document.getElementById('btnNewPhraseBig');
  const $errorBanner  = document.getElementById('errorBanner');
  const $playButtons  = document.querySelectorAll('.play-btn');

  // ===========================================================
  //  STATE MACHINE
  // ===========================================================
  function setState(next) {
    game.current = next;
    $body.dataset.state = next;

    // Update copy & button labels per state
    switch (next) {
      case STATES.READY:
        $instruction.textContent = "Tap the big red button and say your phrase clearly!";
        $btnRecordLab.textContent = "Tap to record";
        break;
      case STATES.RECORDING_ORIGINAL:
        $instruction.textContent = "🔴 Recording… say it nice and clear!";
        break;
      case STATES.PROCESSING_ORIGINAL:
        $instruction.textContent = "Reversing your voice…";
        break;
      case STATES.PRACTICE:
        $instruction.textContent = "Listen to it BACKWARDS — then try to say it backwards!";
        $btnRecordLab.textContent = "Record reversed attempt";
        break;
      case STATES.RECORDING_REVERSED:
        $instruction.textContent = "🔴 Now say it BACKWARDS — give it your best shot!";
        break;
      case STATES.PROCESSING_REVERSED:
        $instruction.textContent = "Un-reversing your attempt…";
        break;
      case STATES.COMPARE:
        // No instruction shown on compare screen
        break;
    }
  }

  // ===========================================================
  //  PHRASE LOADING
  // ===========================================================
  function loadNewPhrase() {
    if (!Array.isArray(PHRASES) || PHRASES.length === 0) {
      $phraseText.textContent = "(no phrases loaded)";
      return;
    }
    // Avoid same phrase twice in a row
    let next;
    do {
      next = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    } while (next === game.phrase && PHRASES.length > 1);
    game.phrase = next;
    $phraseText.textContent = next;

    // Reset recordings & cached audio
    game.recordings = {
      original: null, originalReversed: null,
      reversedAttempt: null, reversedAttemptReversed: null,
    };
    Object.values(game.audioObjects).forEach(a => { try { a.pause(); URL.revokeObjectURL(a.src); } catch (_) {} });
    game.audioObjects = {};

    setState(STATES.READY);
  }

  // ===========================================================
  //  AUDIO RECORDING
  // ===========================================================
  let _recordingInFlight = false;
  async function startRecording() {
    if (_recordingInFlight) return;          // ignore double-taps while mic permission resolves
    if (game.mediaRecorder && game.mediaRecorder.state === 'recording') return;
    _recordingInFlight = true;
    try {
      await _startRecordingImpl();
    } finally {
      _recordingInFlight = false;
    }
  }
  async function _startRecordingImpl() {
    hideError();

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      showError("🎤 Mic access denied. Please allow microphone in your browser settings and try again.");
      console.error(err);
      // Reset state if mid-flow
      if (game.current === STATES.READY) return;
      setState(game.recordings.original ? STATES.PRACTICE : STATES.READY);
      return;
    }

    game.activeStream = stream;
    game.chunks = [];

    // Pick a MIME type the browser supports (Safari is picky)
    const mimeCandidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      '',
    ];
    let mime = '';
    for (const candidate of mimeCandidates) {
      if (candidate === '' || (window.MediaRecorder && MediaRecorder.isTypeSupported(candidate))) {
        mime = candidate;
        break;
      }
    }

    try {
      game.mediaRecorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
    } catch (err) {
      showError("Your browser doesn't support audio recording. Try Chrome, Firefox, Edge, or Safari.");
      console.error(err);
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    game.mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size > 0) game.chunks.push(e.data);
    });

    game.mediaRecorder.addEventListener('stop', async () => {
      // Stop the mic stream
      if (game.activeStream) {
        game.activeStream.getTracks().forEach(t => t.stop());
        game.activeStream = null;
      }

      const blob = new Blob(game.chunks, { type: game.mediaRecorder.mimeType || 'audio/webm' });

      // Where did we come from?
      if (game.current === STATES.RECORDING_ORIGINAL) {
        setState(STATES.PROCESSING_ORIGINAL);
        try {
          game.recordings.original = blob;
          game.recordings.originalReversed = await reverseAudioBlob(blob);
          setState(STATES.PRACTICE);
        } catch (err) {
          console.error('Reverse failed:', err);
          showError("Couldn't process your recording. Try again?");
          setState(STATES.READY);
        }
      } else if (game.current === STATES.RECORDING_REVERSED) {
        setState(STATES.PROCESSING_REVERSED);
        try {
          game.recordings.reversedAttempt = blob;
          game.recordings.reversedAttemptReversed = await reverseAudioBlob(blob);
          setState(STATES.COMPARE);
        } catch (err) {
          console.error('Reverse failed:', err);
          showError("Couldn't process your recording. Try again?");
          setState(STATES.PRACTICE);
        }
      }
    });

    game.mediaRecorder.start();

    if (game.current === STATES.READY)    setState(STATES.RECORDING_ORIGINAL);
    else if (game.current === STATES.PRACTICE) setState(STATES.RECORDING_REVERSED);
  }

  function stopRecording() {
    if (game.mediaRecorder && game.mediaRecorder.state === 'recording') {
      game.mediaRecorder.stop();
    }
  }

  // ===========================================================
  //  AUDIO REVERSAL (Web Audio API + WAV encoder)
  // ===========================================================
  async function reverseAudioBlob(blob) {
    if (!game.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      game.audioCtx = new Ctx();
    }
    // iOS sometimes leaves the context suspended
    if (game.audioCtx.state === 'suspended') {
      try { await game.audioCtx.resume(); } catch (_) {}
    }

    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await game.audioCtx.decodeAudioData(arrayBuffer.slice(0));

    // Build a new buffer with reversed samples per channel
    const reversed = game.audioCtx.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const src = audioBuffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      const N = src.length;
      for (let i = 0; i < N; i++) dst[i] = src[N - 1 - i];
    }

    return audioBufferToWavBlob(reversed);
  }

  // Encode an AudioBuffer to a 16-bit PCM WAV Blob (mono or stereo).
  function audioBufferToWavBlob(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate  = audioBuffer.sampleRate;
    const numFrames   = audioBuffer.length;

    const bytesPerSample = 2;
    const blockAlign     = numChannels * bytesPerSample;
    const byteRate       = sampleRate * blockAlign;
    const dataSize       = numFrames * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view   = new DataView(buffer);

    // RIFF header
    writeStr(view, 0,  'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(view, 8,  'WAVE');
    // fmt chunk
    writeStr(view, 12, 'fmt ');
    view.setUint32(16, 16, true);            // chunk size
    view.setUint16(20, 1, true);             // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);            // bits per sample
    // data chunk
    writeStr(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleave channels & write PCM samples
    let offset = 44;
    const channels = [];
    for (let ch = 0; ch < numChannels; ch++) channels.push(audioBuffer.getChannelData(ch));

    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let s = channels[ch][i];
        s = Math.max(-1, Math.min(1, s));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }
  function writeStr(view, offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  // ===========================================================
  //  PLAYBACK
  // ===========================================================
  function playRecording(key, btnEl) {
    const blob = game.recordings[key];
    if (!blob) return;

    // Stop everything currently playing first
    Object.values(game.audioObjects).forEach(a => { a.pause(); a.currentTime = 0; });
    document.querySelectorAll('.play-btn.is-playing').forEach(b => b.classList.remove('is-playing'));

    // Cache <Audio> per blob so playback is instant on repeat
    if (!game.audioObjects[key]) {
      const audio = new Audio(URL.createObjectURL(blob));
      game.audioObjects[key] = audio;
    }
    const audio = game.audioObjects[key];

    if (btnEl) btnEl.classList.add('is-playing');
    audio.onended = () => { if (btnEl) btnEl.classList.remove('is-playing'); };
    audio.onerror = () => { if (btnEl) btnEl.classList.remove('is-playing'); };
    audio.currentTime = 0;
    audio.play().catch(err => {
      console.error('Playback failed:', err);
      if (btnEl) btnEl.classList.remove('is-playing');
    });
  }

  // ===========================================================
  //  ERROR HANDLING
  // ===========================================================
  function showError(msg) {
    $errorBanner.textContent = msg;
    $errorBanner.hidden = false;
    setTimeout(hideError, 5000);
  }
  function hideError() { $errorBanner.hidden = true; }

  // ===========================================================
  //  EVENT WIRING
  // ===========================================================
  function wire() {
    $btnRecord.addEventListener('click', startRecording);
    $btnStop.addEventListener('click', stopRecording);

    const onNewPhrase = () => {
      // If we're currently recording, stop the stream first
      if (game.mediaRecorder && game.mediaRecorder.state === 'recording') {
        try { game.mediaRecorder.stop(); } catch (_) {}
      }
      if (game.activeStream) {
        game.activeStream.getTracks().forEach(t => t.stop());
        game.activeStream = null;
      }
      loadNewPhrase();
    };
    $btnNewSmall.addEventListener('click', onNewPhrase);
    $btnNewBig.addEventListener('click', onNewPhrase);

    $playButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.play;
        if (key) playRecording(key, btn);
      });
    });

    // Spacebar = record / stop (desktop nicety)
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        if (game.current === STATES.READY || game.current === STATES.PRACTICE) {
          e.preventDefault();
          startRecording();
        } else if (game.current === STATES.RECORDING_ORIGINAL || game.current === STATES.RECORDING_REVERSED) {
          e.preventDefault();
          stopRecording();
        }
      }
    });
  }

  // ===========================================================
  //  BOOT
  // ===========================================================
  function boot() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showError("Your browser doesn't support microphone access. Try Chrome, Firefox, Edge, or Safari.");
    }
    wire();
    loadNewPhrase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

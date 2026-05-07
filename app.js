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
  const $playButtons  = document.querySelectorAll('.play-btn[data-play]');
  const $btnTTS       = document.getElementById('btnTTS');
  const $btnTTSComp   = document.getElementById('btnTTSCompare');

  // New refs for stats / speed / score reveal / HoF
  const $statsStrip   = document.getElementById('statsStrip');
  const $statTotal    = document.getElementById('statTotal');
  const $statAvg      = document.getElementById('statAvg');
  const $statBest     = document.getElementById('statBest');
  const $statStreak   = document.getElementById('statStreak');
  const $speedPills   = document.querySelectorAll('.speed-pill');
  const $scoreReveal  = document.getElementById('scoreReveal');
  const $scoreNumber  = document.getElementById('scoreNumber');
  const $scoreLabel   = document.getElementById('scoreLabel');
  const $scoreConfetti= document.getElementById('scoreConfetti');
  const $btnHofOpen   = document.getElementById('btnHofOpen');
  const $btnHofOpenFt = document.getElementById('btnHofOpenFooter');
  const $hofModal     = document.getElementById('hofModal');
  const $hofClose     = document.getElementById('hofClose');
  const $hofClear     = document.getElementById('hofClear');
  const $hofList      = document.getElementById('hofList');
  const $hofTotal     = document.getElementById('hofTotalPlays');
  const $hofAvg       = document.getElementById('hofAvgScore');
  const $hofBest      = document.getElementById('hofBestScore');
  const $hofLongest   = document.getElementById('hofLongestStreak');
  const $levelBadge   = document.getElementById('levelBadge');
  const $diffPills    = document.querySelectorAll('.diff-pill');

  // ===========================================================
  //  STORAGE — localStorage wrapper that fails gracefully
  // ===========================================================
  const Storage = {
    KEY: 'reverse-a-phone-v1',
    defaults() {
      return {
        stats: { totalPlays: 0, sumScores: 0, bestScore: 0, currentStreak: 0, longestStreak: 0 },
        hallOfFame: [],
        speed: 1,
        level: 'pro',
      };
    },
    load() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (!raw) return this.defaults();
        const parsed = JSON.parse(raw);
        const def = this.defaults();
        return { ...def, ...parsed, stats: { ...def.stats, ...(parsed.stats || {}) } };
      } catch (e) { return this.defaults(); }
    },
    save(data) {
      try { localStorage.setItem(this.KEY, JSON.stringify(data)); return true; }
      catch (e) { console.warn('Storage save failed (likely full):', e); return false; }
    },
    clear() { try { localStorage.removeItem(this.KEY); } catch (_) {} },
  };

  let storeData = Storage.load();
  function persist() { return Storage.save(storeData); }

  // ===========================================================
  //  STATS — lifetime counts + streak
  // ===========================================================
  const Stats = {
    STREAK_THRESHOLD: 50,

    recordAttempt(score) {
      const s = storeData.stats;
      s.totalPlays += 1;
      s.sumScores  += score;
      if (score > s.bestScore) s.bestScore = score;
      if (score >= Stats.STREAK_THRESHOLD) {
        s.currentStreak += 1;
        if (s.currentStreak > s.longestStreak) s.longestStreak = s.currentStreak;
      } else {
        s.currentStreak = 0;
      }
      persist();
    },

    refreshUI() {
      const s = storeData.stats;
      const avg = s.totalPlays ? Math.round(s.sumScores / s.totalPlays) : 0;
      if (s.totalPlays === 0) { $statsStrip.hidden = true; }
      else {
        $statsStrip.hidden = false;
        $statTotal.textContent  = s.totalPlays;
        $statAvg.textContent    = avg;
        $statBest.textContent   = s.bestScore;
        $statStreak.textContent = s.currentStreak;
      }
      // mirror into HoF modal
      $hofTotal.textContent   = s.totalPlays;
      $hofAvg.textContent     = avg;
      $hofBest.textContent    = s.bestScore;
      $hofLongest.textContent = s.longestStreak;
    },

    reset() {
      storeData = Storage.defaults();
      Storage.clear();
      Stats.refreshUI();
      HallOfFame.refreshUI();
    },
  };

  // ===========================================================
  //  DIFFICULTY — manages level selection and phrase set
  // ===========================================================
  const LEVEL_META = {
    easy:   { label: '🟢 Easy',   badge: 'badge-easy',   words: '2 words' },
    medium: { label: '🟡 Medium', badge: 'badge-medium', words: '3 words' },
    hard:   { label: '🔴 Hard',   badge: 'badge-hard',   words: '4 words' },
    pro:    { label: '🏆 Pro',    badge: 'badge-pro',    words: '5–6 words' },
  };

  const Difficulty = {
    current() { return storeData.level || 'pro'; },

    set(level) {
      if (!PHRASE_SETS[level]) return;
      storeData.level = level;
      persist();
      Difficulty.refreshUI();
    },

    phraseSet() {
      return PHRASE_SETS[Difficulty.current()] || PHRASES_PRO;
    },

    refreshUI() {
      const lvl  = Difficulty.current();
      const meta = LEVEL_META[lvl];
      // Update badge
      $levelBadge.textContent = meta.label;
      $levelBadge.className   = 'level-badge ' + meta.badge;
      // Update pills
      $diffPills.forEach(pill => {
        pill.classList.toggle('active', pill.dataset.level === lvl);
      });
    },
  };

  // ===========================================================
  //  TEXT-TO-SPEECH — reference pronunciation for the phrase
  //  Prefers en-IN male voice, falls back to en-US, then any en.
  // ===========================================================
  const TTS = {
    voice: null,
    _ready: false,

    init() {
      const synth = window.speechSynthesis;
      if (!synth) return;
      const pick = () => {
        const voices = synth.getVoices();
        if (!voices.length) return;
        // Preference: Indian English male → Indian English any → US English male → US English any → any English → first
        TTS.voice =
          voices.find(v => v.lang === 'en-IN' && /male/i.test(v.name)) ||
          voices.find(v => v.lang === 'en-IN') ||
          voices.find(v => v.lang === 'en-US' && /male/i.test(v.name)) ||
          voices.find(v => v.lang === 'en-US') ||
          voices.find(v => v.lang.startsWith('en')) ||
          voices[0];
        TTS._ready = true;
      };
      pick();
      synth.onvoiceschanged = pick;
    },

    speak(text, btnEl) {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      if (TTS.voice) utt.voice = TTS.voice;
      utt.rate  = 0.85;
      utt.pitch = 1;
      if (btnEl) {
        btnEl.classList.add('is-speaking');
        utt.onend = () => btnEl.classList.remove('is-speaking');
        utt.onerror = () => btnEl.classList.remove('is-speaking');
      }
      synth.speak(utt);
    },

    stop() {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },
  };

  // ===========================================================
  //  SCORING — MFCC + DTW phonetic comparison
  //  MFCCs capture vowel quality & consonant articulation.
  //  DTW handles natural timing variation between attempts.
  //  Combined with duration & envelope to prevent silence gaming.
  // ===========================================================
  const Scoring = {
    TIERS: [
      { min:  0, label: '🥶 Brain freeze',   tier: 1 },
      { min: 30, label: '🤔 Hmm not quite',  tier: 2 },
      { min: 52, label: '🔥 Pretty hot!',    tier: 3 },
      { min: 72, label: '🎯 Bullseye!',      tier: 4 },
      { min: 88, label: '🌟 LEGENDARY',      tier: 5 },
    ],

    async compute(originalBlob, attemptUnreversedBlob) {
      const ctx = ensureCtx();
      const [origBuf, attemptBuf] = await Promise.all([
        ctx.decodeAudioData((await originalBlob.arrayBuffer()).slice(0)),
        ctx.decodeAudioData((await attemptUnreversedBlob.arrayBuffer()).slice(0)),
      ]);

      const orig    = trimSilence(mixToMono(origBuf),    0.015);
      const attempt = trimSilence(mixToMono(attemptBuf), 0.015);

      if (orig.length < 200 || attempt.length < 200) return 3;

      const origSR = origBuf.sampleRate, attemptSR = attemptBuf.sampleRate;

      // ── Duration ratio (strict quadratic penalty) ──────────────
      const durRatio = Math.min(orig.length / origSR, attempt.length / attemptSR)
                     / Math.max(orig.length / origSR, attempt.length / attemptSR);
      const durSim   = Math.pow(durRatio, 2.5);

      // ── MFCC extraction ─────────────────────────────────────────
      const mfccOrig    = computeMFCCs(orig,    origSR);
      const mfccAttempt = computeMFCCs(attempt, attemptSR);

      if (!mfccOrig || !mfccAttempt || mfccOrig.length < 3 || mfccAttempt.length < 3) {
        return Math.round(durSim * 40); // fallback
      }

      // ── DTW distance (normalised by path length) ────────────────
      const rawDist  = dtwDistance(mfccOrig, mfccAttempt);
      // Calibration: dist ≤ 4 ≈ excellent, dist ≥ 40 ≈ completely wrong
      const mfccSim  = Math.max(0, 1 - rawDist / 38);

      // ── Envelope energy check (catches silence/noise gaming) ────
      const envO = computeEnvelope(orig,    32);
      const envA = computeEnvelope(attempt, 32);
      const envS = envelopeMAD(envO, envA);

      // ── Weighted final score ────────────────────────────────────
      const raw    = mfccSim * 0.65 + durSim * 0.20 + envS * 0.15;
      // pow(1.1) makes high scores harder to get (less generous than before)
      const curved = Math.pow(Math.max(0, raw), 1.10);
      return Math.max(0, Math.min(100, Math.round(curved * 100)));
    },

    reveal(score) {
      let tier = 1, label = Scoring.TIERS[0].label;
      for (const t of Scoring.TIERS) if (score >= t.min) { tier = t.tier; label = t.label; }
      $scoreReveal.dataset.tier = tier;
      $scoreLabel.textContent   = label;

      // Animate count up
      const duration = 900;
      const startT   = performance.now();
      $scoreNumber.textContent = '0';
      function tick(now) {
        const t = Math.min(1, (now - startT) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        $scoreNumber.textContent = Math.round(eased * score);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);

      if (tier >= 4) Scoring.spawnConfetti();
    },

    spawnConfetti() {
      $scoreConfetti.innerHTML = '';
      const colors = ['#FF3B5C', '#2D6CFF', '#FFCE2E', '#1FCB7A', '#FF6FB5'];
      for (let i = 0; i < 28; i++) {
        const dot   = document.createElement('span');
        const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.3;
        const dist  = 80 + Math.random() * 90;
        dot.style.left  = '50%';
        dot.style.top   = '50%';
        dot.style.background = colors[i % colors.length];
        dot.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
        dot.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
        dot.style.animationDelay = (Math.random() * 0.2) + 's';
        $scoreConfetti.appendChild(dot);
      }
      setTimeout(() => { $scoreConfetti.innerHTML = ''; }, 2000);
    },
  };

  // ===========================================================
  //  AUDIO ANALYSIS HELPERS
  // ===========================================================
  function ensureCtx() {
    if (!game.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      game.audioCtx = new Ctx();
    }
    if (game.audioCtx.state === 'suspended') {
      try { game.audioCtx.resume(); } catch (_) {}
    }
    return game.audioCtx;
  }
  function mixToMono(buf) {
    if (buf.numberOfChannels === 1) return buf.getChannelData(0);
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const out = new Float32Array(L.length);
    for (let i = 0; i < L.length; i++) out[i] = (L[i] + R[i]) / 2;
    return out;
  }
  function trimSilence(samples, threshold) {
    let s = 0, e = samples.length;
    while (s < samples.length && Math.abs(samples[s])     < threshold) s++;
    while (e > s             && Math.abs(samples[e - 1]) < threshold) e--;
    return samples.subarray(s, e);
  }

  // RMS envelope — N bins, peak-normalised
  function computeEnvelope(samples, N) {
    const env = new Float32Array(N);
    const w   = samples.length / N;
    for (let i = 0; i < N; i++) {
      let sum = 0;
      const s = Math.floor(i * w), e = Math.floor((i + 1) * w);
      const len = Math.max(1, e - s);
      for (let j = s; j < e; j++) sum += samples[j] * samples[j];
      env[i] = Math.sqrt(sum / len);
    }
    let max = 0;
    for (let i = 0; i < N; i++) if (env[i] > max) max = env[i];
    if (max > 1e-6) for (let i = 0; i < N; i++) env[i] /= max;
    return env;
  }

  // Mean absolute deviation similarity (0–1, higher = more similar)
  function envelopeMAD(a, b) {
    const N = Math.min(a.length, b.length);
    let mad = 0;
    for (let i = 0; i < N; i++) mad += Math.abs(a[i] - b[i]);
    return Math.max(0, 1 - mad / N);
  }

  // ===========================================================
  //  FFT — in-place Radix-2 Cooley-Tukey
  //  re[] and im[] must be Float32Array of length N (power of 2)
  // ===========================================================
  function fft(re, im) {
    const N = re.length;
    // Bit-reversal
    let j = 0;
    for (let i = 1; i < N; i++) {
      let bit = N >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
            t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    // Butterfly passes
    for (let len = 2; len <= N; len <<= 1) {
      const ang = -2 * Math.PI / len;
      const wRe = Math.cos(ang), wIm = Math.sin(ang);
      for (let i = 0; i < N; i += len) {
        let curRe = 1, curIm = 0;
        const half = len >> 1;
        for (let k = 0; k < half; k++) {
          const uRe = re[i + k], uIm = im[i + k];
          const vRe = re[i + k + half] * curRe - im[i + k + half] * curIm;
          const vIm = re[i + k + half] * curIm + im[i + k + half] * curRe;
          re[i + k]        = uRe + vRe;  im[i + k]        = uIm + vIm;
          re[i + k + half] = uRe - vRe;  im[i + k + half] = uIm - vIm;
          const nr = curRe * wRe - curIm * wIm;
          curIm = curRe * wIm + curIm * wRe;
          curRe = nr;
        }
      }
    }
  }

  // ===========================================================
  //  MEL FILTERBANK — triangular filters on mel-frequency scale
  // ===========================================================
  function melFilterbank(magSpec, effectiveSR, numFilters, fMin, fMax) {
    const N      = magSpec.length;        // half of FFT size
    const nyq    = effectiveSR / 2;
    const mel    = hz => 2595 * Math.log10(1 + hz / 700);
    const imel   = m  => 700 * (Math.pow(10, m / 2595) - 1);
    const melMin = mel(fMin), melMax = mel(fMax);

    // numFilters+2 evenly-spaced mel points → Hz → FFT bin indices
    const bins = new Int32Array(numFilters + 2);
    for (let i = 0; i < numFilters + 2; i++) {
      const hz = imel(melMin + i * (melMax - melMin) / (numFilters + 1));
      bins[i]  = Math.min(N - 1, Math.round(hz * N / nyq));
    }

    const energies = new Float32Array(numFilters);
    for (let f = 0; f < numFilters; f++) {
      const lo = bins[f], ctr = bins[f + 1], hi = bins[f + 2];
      let e = 0;
      for (let k = lo; k < ctr; k++)
        e += magSpec[k] * (k - lo) / Math.max(1, ctr - lo);
      for (let k = ctr; k < hi; k++)
        e += magSpec[k] * (hi - k) / Math.max(1, hi - ctr);
      energies[f] = e;
    }
    return energies;
  }

  // ===========================================================
  //  MFCC — 13 cepstral coefficients per 32ms frame (16ms hop)
  //  Downsamples to 8 kHz first for speed.
  // ===========================================================
  function computeMFCCs(samples, sampleRate) {
    const TARGET_SR  = 8000;
    const ds         = Math.max(1, Math.round(sampleRate / TARGET_SR));
    const dsLen      = Math.floor(samples.length / ds);
    if (dsLen < 64) return null;

    const dsig = new Float32Array(dsLen);
    for (let i = 0; i < dsLen; i++) dsig[i] = samples[i * ds];
    const effSR = sampleRate / ds;

    const FFT_SIZE   = 256;           // 32 ms at 8 kHz
    const HOP        = 128;           // 16 ms hop
    const NUM_FILT   = 13;
    const NUM_COEFF  = 13;
    const numFrames  = Math.floor((dsLen - FFT_SIZE) / HOP) + 1;
    if (numFrames < 2) return null;

    // Pre-compute Hamming window
    const win = new Float32Array(FFT_SIZE);
    for (let n = 0; n < FFT_SIZE; n++)
      win[n] = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (FFT_SIZE - 1));

    const re = new Float32Array(FFT_SIZE);
    const im = new Float32Array(FFT_SIZE);
    const features = [];

    for (let f = 0; f < numFrames; f++) {
      const start = f * HOP;
      for (let n = 0; n < FFT_SIZE; n++) {
        re[n] = (start + n < dsLen) ? dsig[start + n] * win[n] : 0;
        im[n] = 0;
      }
      fft(re, im);

      // Magnitude spectrum (positive frequencies only)
      const mag = new Float32Array(FFT_SIZE / 2);
      for (let k = 0; k < FFT_SIZE / 2; k++)
        mag[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);

      // Mel filterbank energies → log
      const energies = melFilterbank(mag, effSR, NUM_FILT, 80, effSR / 2 - 50);
      const logE     = new Float32Array(NUM_FILT);
      for (let i = 0; i < NUM_FILT; i++)
        logE[i] = Math.log(Math.max(energies[i], 1e-10));

      // DCT-II → cepstral coefficients (skip c0 — frame energy, not phonetic)
      const mfcc = new Float32Array(NUM_COEFF);
      for (let k = 0; k < NUM_COEFF; k++) {
        let sum = 0;
        for (let n = 0; n < NUM_FILT; n++)
          sum += logE[n] * Math.cos(Math.PI * k * (n + 0.5) / NUM_FILT);
        mfcc[k] = sum;
      }
      features.push(mfcc);
    }
    return features;
  }

  // ===========================================================
  //  DTW — Dynamic Time Warping between two MFCC sequences
  //  Returns distance normalised by warp path length.
  // ===========================================================
  function dtwDistance(seq1, seq2) {
    const N = seq1.length, M = seq2.length;
    const K = seq1[0].length; // number of coefficients

    // Frame-level Euclidean distance
    const fd = (a, b) => {
      let d = 0;
      for (let k = 0; k < K; k++) d += (a[k] - b[k]) * (a[k] - b[k]);
      return Math.sqrt(d);
    };

    // Flat DTW accumulator
    const dtw = new Float32Array(N * M).fill(1e9);
    dtw[0] = fd(seq1[0], seq2[0]);
    for (let i = 1; i < N; i++) dtw[i * M]     = dtw[(i - 1) * M]     + fd(seq1[i], seq2[0]);
    for (let j = 1; j < M; j++) dtw[j]          = dtw[j - 1]           + fd(seq1[0], seq2[j]);

    for (let i = 1; i < N; i++) {
      for (let j = 1; j < M; j++) {
        const cost = fd(seq1[i], seq2[j]);
        dtw[i * M + j] = cost + Math.min(
          dtw[(i - 1) * M + j],
          dtw[i * M + (j - 1)],
          dtw[(i - 1) * M + (j - 1)]
        );
      }
    }
    return dtw[N * M - 1] / (N + M);
  }

  // ===========================================================
  //  SPEED CONTROL — half / normal / double playback rate
  // ===========================================================
  const Speed = {
    current() { return storeData.speed || 1; },
    set(value) {
      storeData.speed = value;
      persist();
      $speedPills.forEach(pill => {
        pill.classList.toggle('active', parseFloat(pill.dataset.speed) === value);
      });
      // Live-apply to anything currently playing
      Object.values(game.audioObjects).forEach(a => { a.playbackRate = value; });
    },
    refreshUI() { Speed.set(Speed.current()); },
  };

  // ===========================================================
  //  HALL OF FAME — top 3 attempts with replayable audio
  // ===========================================================
  const HallOfFame = {
    MAX_ENTRIES: 3,

    async maybeAdd(score, phrase, audioBlob) {
      const list = storeData.hallOfFame;
      if (list.length >= HallOfFame.MAX_ENTRIES) {
        const worst = Math.min(...list.map(e => e.score));
        if (score <= worst) return;
      }
      try {
        const { base64, type } = await blobToBase64(audioBlob);
        list.push({
          score, phrase,
          date: new Date().toISOString(),
          audioBase64: base64,
          audioType:   type,
        });
        list.sort((a, b) => b.score - a.score);
        if (list.length > HallOfFame.MAX_ENTRIES) list.length = HallOfFame.MAX_ENTRIES;
        if (!persist()) {
          // localStorage full — drop oldest entry's audio data and retry
          if (list.length > 0) list.pop();
          persist();
        }
        HallOfFame.refreshUI();
      } catch (e) { console.warn('HoF save failed:', e); }
    },

    refreshUI() {
      const list = storeData.hallOfFame;
      if (list.length === 0) {
        $hofList.innerHTML = '<p class="hof-empty">🎤 No saved attempts yet — go play a round!</p>';
        return;
      }
      $hofList.innerHTML = '';
      list.forEach((entry, idx) => {
        const medal   = ['🥇','🥈','🥉'][idx] || '🏅';
        const dt      = new Date(entry.date);
        const dateStr = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const node    = document.createElement('div');
        node.className = 'hof-entry';
        node.innerHTML = `
          <div class="hof-rank">${medal}</div>
          <div class="hof-entry-mid">
            <div class="hof-entry-phrase">"${escapeHtml(entry.phrase)}"</div>
            <div class="hof-entry-meta">${dateStr}</div>
          </div>
          <div class="hof-entry-score">${entry.score}</div>
          <button class="hof-play-btn" data-hof-idx="${idx}" aria-label="Play attempt">▶</button>
        `;
        $hofList.appendChild(node);
      });
      $hofList.querySelectorAll('.hof-play-btn').forEach(btn => {
        btn.addEventListener('click', () => HallOfFame.play(parseInt(btn.dataset.hofIdx, 10), btn));
      });
    },

    async play(idx, btnEl) {
      const entry = storeData.hallOfFame[idx];
      if (!entry) return;
      // Stop any other HoF playback
      document.querySelectorAll('.hof-play-btn.is-playing').forEach(b => {
        b.classList.remove('is-playing');
        b.textContent = '▶';
      });
      try {
        const blob       = base64ToBlob(entry.audioBase64, entry.audioType);
        // Stored blob is the user's reversed-attempt; reverse it on the fly to hear the funny "un-reversed" version
        const reversed   = await reverseAudioBlob(blob);
        const audio      = new Audio(URL.createObjectURL(reversed));
        audio.playbackRate = Speed.current();
        btnEl.classList.add('is-playing');
        btnEl.textContent  = '⏸';
        audio.onended = () => {
          btnEl.classList.remove('is-playing');
          btnEl.textContent = '▶';
          URL.revokeObjectURL(audio.src);
        };
        audio.play();
      } catch (e) { console.error('HoF play failed:', e); }
    },

    open()  { HallOfFame.refreshUI(); Stats.refreshUI(); $hofModal.hidden = false; },
    close() {
      document.querySelectorAll('.hof-play-btn.is-playing').forEach(b => {
        b.classList.remove('is-playing');
        b.textContent = '▶';
      });
      $hofModal.hidden = true;
    },
  };

  // Encoding helpers
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = () => {
        const url = r.result;
        resolve({ base64: url.slice(url.indexOf(',') + 1), type: blob.type });
      };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }
  function base64ToBlob(base64, type) {
    const bin = atob(base64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

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
    const pool = Difficulty.phraseSet();
    if (!Array.isArray(pool) || pool.length === 0) {
      $phraseText.textContent = "(no phrases loaded)";
      return;
    }
    // Avoid same phrase twice in a row
    let next;
    do {
      next = pool[Math.floor(Math.random() * pool.length)];
    } while (next === game.phrase && pool.length > 1);
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

          // Score the attempt by comparing original to the un-reversed attempt
          let score = 0;
          try {
            score = await Scoring.compute(
              game.recordings.original,
              game.recordings.reversedAttemptReversed
            );
          } catch (err) { console.warn('Scoring failed:', err); }

          setState(STATES.COMPARE);
          Scoring.reveal(score);

          // Update stats + maybe save to Hall of Fame
          Stats.recordAttempt(score);
          Stats.refreshUI();
          HallOfFame.maybeAdd(score, game.phrase, game.recordings.reversedAttempt);
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
    audio.playbackRate = Speed.current();
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
      TTS.stop();
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

    // TTS buttons
    $btnTTS.addEventListener('click', () => TTS.speak(game.phrase, $btnTTS));
    $btnTTSComp.addEventListener('click', () => TTS.speak(game.phrase, $btnTTSComp));

    // Difficulty pills
    $diffPills.forEach(pill => {
      pill.addEventListener('click', () => {
        if (pill.dataset.level === Difficulty.current()) return; // already active
        Difficulty.set(pill.dataset.level);
        // Load a new phrase from the new pool immediately
        if (game.current === STATES.READY || game.current === STATES.COMPARE) {
          loadNewPhrase();
        }
      });
    });

    // Speed pills
    $speedPills.forEach(pill => {
      pill.addEventListener('click', () => {
        Speed.set(parseFloat(pill.dataset.speed));
      });
    });

    // Hall of Fame open / close / clear
    $btnHofOpen  .addEventListener('click', () => HallOfFame.open());
    $btnHofOpenFt.addEventListener('click', () => HallOfFame.open());
    $hofClose    .addEventListener('click', () => HallOfFame.close());
    $hofModal    .addEventListener('click', (e) => {
      if (e.target === $hofModal) HallOfFame.close(); // click outside modal card
    });
    $hofClear.addEventListener('click', () => {
      if (confirm('Clear all stats and Hall of Fame entries? This cannot be undone.')) {
        Stats.reset();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$hofModal.hidden) HallOfFame.close();
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
    TTS.init();
    Difficulty.refreshUI();
    Speed.refreshUI();
    Stats.refreshUI();
    HallOfFame.refreshUI();
    loadNewPhrase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
# 🔁 Reverse-A-Phone

A web-based reverse-voice game. The game shows you a phrase, you say it, the game reverses it, you try to say it backwards, and then the game un-reverses *that* — so you hear how close your reversed-attempt actually got to the original.

Built with vanilla HTML / CSS / JS — no build step, no dependencies, ~zero kilobytes shipped after the Google Fonts request. Deploys to Vercel for free in under a minute.

## How it works

1. Game shows a random 5–6 word phrase from `phrases.js` (~400 curated phrases — add more freely).
2. You hit **🎤 Tap to record** and say the phrase.
3. The recording is reversed in-browser using the Web Audio API. You can replay both the original and the reversed (target) sound as many times as you want.
4. You hit record again and try to *say it backwards*.
5. The game reverses *your reversed attempt* back to forward — and shows you all four playbacks side-by-side so you can hear how close you got to the original phrase.
6. Tap **🎲 New phrase** to play forever.

Spacebar also toggles record / stop on desktop.

## Run locally

Because the page uses `getUserMedia` (microphone), most browsers require it to be served from a real URL — not `file://`. Use any tiny local server:

```bash
# Python 3
python3 -m http.server 8000

# Or with Node (npx)
npx serve .
```

Open `http://localhost:8000` and allow mic access when prompted.

## Deploy to Vercel (free)

### Option A — drag & drop (fastest)
1. Go to <https://vercel.com/new>.
2. Drag the entire `reverse-voice-game/` folder onto the import area.
3. Click **Deploy**. Done — you'll get a free `*.vercel.app` URL.

### Option B — via GitHub
1. Push this folder to a GitHub repo.
2. On <https://vercel.com/new>, import the repo.
3. Framework preset: **Other** (it's pure static).
4. Output directory: **leave blank** (root).
5. Click **Deploy**.

No `vercel.json` needed — Vercel auto-detects static sites. The free Hobby tier is more than enough.

> ⚠️ Mic access requires HTTPS. Vercel gives you HTTPS by default, so this works automatically.

## File structure

```
reverse-voice-game/
├── index.html      ← markup + state-driven UI
├── styles.css      ← playful arcade styling (Bagel Fat One + Fredoka)
├── app.js          ← game state machine, recording, audio reversal
├── phrases.js      ← ~400 curated 5–6 word phrases (edit freely)
└── README.md
```

## Adding more phrases

Just open `phrases.js` and add strings to the `PHRASES` array. Anything 4–7 words works fine — 5–6 is the sweet spot for the game.

## Browser support

Works in any modern browser that supports `MediaRecorder` + Web Audio API:
Chrome, Firefox, Edge, Safari (14.1+), and mobile equivalents.

## Tech notes

- Audio reversal: decode the recorded blob with `AudioContext.decodeAudioData`, build a new `AudioBuffer` with samples in reverse order per channel, then re-encode to a 16-bit PCM WAV blob (so it plays back in a regular `<audio>` element via a blob URL).
- State machine: a `data-state` attribute on `<body>` drives all UI visibility through `[class*="show-on-"]` CSS rules. No frameworks needed.
- Mobile-friendly: tap targets sized for thumbs, viewport locked, microphone permissions requested only on first record tap.

Have fun. 🎤🔁

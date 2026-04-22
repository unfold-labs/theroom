# The Room — Project Brief

## What this is

The Room is a real-time audience response tool for live and recorded content. Participants use their own iPhones to continuously indicate where they are with the content. The core output is a response curve synced to a timestamped transcript, showing exactly which words lost which people.

We use it internally first — to tune our own training products. When we are good at it, we sell the methodology and the tool to other training companies, speaker coaches, and content creators.

## The core interaction

A participant opens a URL on their iPhone, scans a QR code, enters their first name, and sees a full-screen dark field with a single dot. The field has two labels:

- **Top:** With you
- **Bottom:** Lost me

They drag the dot up and down continuously during the session. No numbers. No scale. No instructions needed. The dot colour shifts automatically — green when high, amber in the middle, red when low.

The facilitator creates the session, gets a QR code, starts and stops the session. The facilitator does NOT see individual responses during the session — only after.

## What we call things

- **The Room** — the product name
- **Calibrators** — our trained professional panel
- **Session** — a single run of content with a group
- **The curve** — the engagement response over time
- **The transcript** — the timestamped words, which is the primary analysis surface

## The analysis view

After the session, the facilitator uploads an audio recording. It is transcribed automatically via Whisper. The transcript and the response curve are synced via a clap at the start of the session — someone claps, it is captured in the audio and marked in the app, everything aligns from that anchor point.

The analysis view is a transcript reader with the curve in the margin. Low engagement passages are highlighted. The three lowest moments are surfaced at the top. The facilitator can click any word and hear that moment in the audio.

**The headline feature:** the specific words and passages that lost the room, highlighted in the transcript. Not a graph. Not a number. The actual words.

## Sprint 1 scope — build only this

- Facilitator creates a session, gets a QR code and a short join URL
- Participant scans QR, enters first name, sees the response field
- Participant drags dot up and down during session
- Dot position writes to a Google Sheet every 2 seconds — timestamp and value
- Facilitator can start and stop the session
- Nothing else

**The Sprint 1 question:** will people actually move the dot, and does the data vary in interesting ways?

## Tech choices for Sprint 1

- **Frontend:** plain HTML/CSS/JS — no framework, keep it minimal
- **Hosting:** Vercel — deploy in minutes
- **Backend:** Google Sheets via API — embarrassing infrastructure, real data, zero build time
- **Real-time:** polling the sheet every 2 seconds is fine for Sprint 1
- **QR code:** generated in browser with qrcode.js

Upgrade to Firebase or Supabase only after Sprint 1 proves the data is interesting. Do not build ahead.

## Tech choices for Sprint 2

- **Transcription:** OpenAI Whisper API — upload audio, get back timestamped JSON, cheap and accurate
- **Sync:** facilitator enters clap offset manually — one number, one text field
- **Analysis view:** transcript as HTML, each word a span with timestamp data attribute, background colour driven by engagement value at that timestamp

## Principles — never compromise these

**No friction on join.** Scan → name → in. Three taps maximum. Every feature idea gets tested against this.

**Dark UI on participant screen.** A bright white screen in a training room or conference is a distraction to neighbours. Keep it dark and discreet.

**No numbers visible to participants.** No scale, no percentage, no score. Just position. The less clinical it feels, the more honest the responses.

**Facilitator blind during session.** They see nothing until after. This is a feature, not a limitation. It protects session integrity.

**Transcript is the product.** The curve is a navigation tool. The words are the insight. Everything in the analysis view should push the facilitator toward the words, not the graph.

**Audio first.** No video in Sprint 1 or 2. Audio is simpler, lighter, and the transcript is what matters anyway.

**Start and stop only.** The facilitator app is minimal. Create session, show QR, start, stop. Nothing else until Sprint 3.

## What we are NOT building yet

Do not build these until the relevant sprint:

- Second axis / 2D touch field
- Video support
- Notifications / push
- Break management
- Section labelling
- Participant profiles / segmentation
- PDF report generation
- Benchmarking / cross-session comparison
- Auth / accounts (use secret codes for now)
- Facilitator live view of responses
- Async / remote sessions
- Platform / multi-tenant

## The broader vision — for context only, do not build

The Room will eventually serve training companies, speaker coaches, podcast creators, audiobook publishers, conference organisers. The methodology — continuous self-reported two-dimensional response synced to timestamped transcript — is the IP. The benchmark database accumulated across sessions is the long-term moat.

The second axis, when we add it, will be configurable per session. For training the axes might be "with you" × "likely to apply." For a conference talk they might be "gripped" × "convinced." The facilitator defines axis two before the session starts.

## The join flow — get this right

```
Facilitator screen → large QR code + short URL (e.g. theroom.io/join/DRUM)
Participant → scans QR or types URL
Participant → enters first name only
Participant → sees holding screen "waiting for session to start"
Facilitator → hits Start
Participant → response field appears
```

The URL code should be a real word — DRUM, MILO, APEX — not a random string. Easier to type, easier to say aloud as a fallback.

## The response field — get this right

```
Full screen, dark background (#111)
"With you" — top, small, quiet, weight 500
"Lost me" — bottom, small, quiet, weight 500, lower opacity
Single white dot, 48px, follows touch position vertically only
Dot has a coloured inner circle — green above 60%, amber 35–60%, red below 35%
Subtle fill beneath the dot — same colour, very low opacity (8–10%)
No numbers anywhere
No track, no slider UI chrome
Session name and live indicator at top — small, unobtrusive
Participant name at bottom — small, unobtrusive
```

## File structure to aim for

```
/
├── CLAUDE.md
├── participant/
│   └── index.html        — the response field
├── facilitator/
│   └── index.html        — create session, QR code, start/stop
├── join/
│   └── index.html        — name entry, holding screen
└── analysis/
    └── index.html        — transcript + curve (Sprint 2)
```

## Tone

This is a real product being built iteratively. Favour working code over perfect code. Favour real data over perfect infrastructure. If something can be faked in Sprint 1 to validate the concept, fake it. Label the fake clearly so we know to replace it.

When suggesting approaches, give the fastest path first. We are anti-Yoda — we try, we do not do.

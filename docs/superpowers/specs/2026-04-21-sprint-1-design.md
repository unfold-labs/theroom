# The Room — Sprint 1 Design

## Overview

Sprint 1 validates the core question: will participants actually move the dot, and does the data vary in interesting ways?

Scope: facilitator creates a session → gets QR code + join URL → participants scan and enter their name → facilitator starts session → participants drag a dot up/down → position writes to Google Sheets every 2s → facilitator stops session.

---

## Architecture

### Backend: Google Apps Script Web App

A single standalone Apps Script Web App handles all backend operations. No server, no build step — deployed directly from the Google Apps Script editor.

Two endpoints:

- `doGet(e)` — read-only: resolve a session code to a sheet ID, or poll session status
- `doPost(e)` — writes: create session, start, stop, log data point

The script URL is baked into the frontend JS at deploy time (environment variable via Vercel, or a `config.js` file).

### Data: Google Sheets

**Master registry sheet** (`1t35mJ8TIY60ePOrEgTPZ_oGUX69atXMhAdQmYS8Ralo`):
One tab called `registry`.

| code | sheet_id | status | created_at |
|------|----------|--------|------------|
| DRUM | abc123   | ACTIVE | 2026-04-21T10:00:00 |

**Per-session sheet**: created fresh by Apps Script on `action=create`. One tab (named after the session code).

| type | participant | timestamp | value |
|------|-------------|-----------|-------|
| STATUS | | 2026-04-21T10:00:00 | WAITING |
| DATA | Alice | 2026-04-21T10:01:05 | 0.74 |
| DATA | Bob | 2026-04-21T10:01:07 | 0.31 |

`value` is a float 0.0–1.0 where 1.0 = top ("With you") and 0.0 = bottom ("Lost me").

Status transitions: `WAITING → ACTIVE → ENDED`

---

## Apps Script Actions

### `doGet`

| param | description |
|-------|-------------|
| `action=resolve&code=DRUM` | Look up code in registry, return `{sheetId, status}` |
| `action=poll&sheetId=X` | Read STATUS row from session sheet, return `{status}` |

### `doPost`

| action | params | description |
|--------|--------|-------------|
| `create` | — | Pick unused word code, create new sheet, append to registry, return `{code, sheetId}` |
| `start` | `sheetId` | Update STATUS row value to `ACTIVE` in registry and session sheet |
| `stop` | `sheetId` | Update STATUS row value to `ENDED` in registry and session sheet |
| `log` | `sheetId, participant, value` | Append DATA row with server timestamp |

All responses are JSON with CORS headers (`Access-Control-Allow-Origin: *`).

---

## URL Structure

```
theroom.io/facilitator/      — facilitator page
theroom.io/join/DRUM         — join page (clean path via Vercel rewrite)
theroom.io/participant/      — response field (arrived via redirect from join page)
```

`vercel.json` rewrite:
```json
{
  "rewrites": [{ "source": "/join/:code", "destination": "/join/index.html" }]
}
```

The join page reads the session code from `window.location.pathname.split('/').pop()`.

---

## Session Flow

1. Facilitator opens `/facilitator/` → clicks **Create session**
2. Page POSTs `action=create` → receives `{code, sheetId}`
3. Page stores `{code, sheetId}` in `localStorage`, generates QR code for `theroom.io/join/{code}` using qrcode.js, shows join URL and **Start** button. On page load, if `localStorage` has a session, restore the waiting/running state instead of showing Create.
4. Participant scans QR or types URL → `/join/DRUM`
5. Join page GETs `action=resolve&code=DRUM` → receives `{sheetId, status}`
6. Participant enters first name → clicks Join
7. Join page stores `{name, sheetId, code}` in `sessionStorage` → redirects to `/participant/`
8. Participant page polls every 2s (`action=poll&sheetId=X`) → shows holding screen while `status=WAITING`
9. Facilitator clicks **Start** → POSTs `action=start` → session status → `ACTIVE`
10. Next participant poll returns `ACTIVE` → response field appears, dot writing begins every 2s
11. Participant drags dot → page POSTs `action=log` with current value every 2s
12. Facilitator clicks **Stop** → POSTs `action=stop` → status → `ENDED`
13. Next participant poll returns `ENDED` → show "Session ended" screen

---

## File Structure

```
/
├── vercel.json
├── facilitator/
│   └── index.html        — create session, show QR, start/stop
├── join/
│   └── index.html        — name entry, holding screen, redirect to participant
├── participant/
│   └── index.html        — full-screen response field, polling, dot drag
└── apps-script/
    └── Code.gs           — deployed separately to Google Apps Script
```

---

## UI Specs

### Participant response field (`/participant/`)

- Full screen, `background: #111`
- `"With you"` — top, small, `font-weight: 500`, `opacity: 0.45`
- `"Lost me"` — bottom, small, `font-weight: 500`, `opacity: 0.25`
- Single off-white dot (`#e8e3d8`), 44px, follows touch/drag vertically only
- Dot has a translucent outer ring and a soft glow
- No colour change at any position — position is the only signal
- Subtle white fill beneath the dot (`rgba(255,255,255,0.04)`)
- Session code + small indicator dot — top centre, unobtrusive
- Participant name — bottom centre, very faint
- No numbers, no scale, no track

### Facilitator screen (`/facilitator/`)

Three states:
1. **Create** — "The Room" heading, single "Create session" button
2. **Waiting** — large session code, join URL, QR code, participant count ("N joined"), "Start session" button
3. **Running** — session code, LIVE indicator, participant count ("N responding"), "Stop session" button (destructive style)

### Join screen (`/join/`)

Two states:
1. **Name entry** — "What's your first name?", single text input, "Join" button, session code shown faintly
2. **Holding** — "Hi [name]", "Waiting for the session to start…", subtle pulse indicator

---

## Session Word List

~50 short, memorable English words baked into `facilitator/index.html`. Picked randomly on session create. No collision check in Sprint 1.

```
DRUM, MILO, APEX, COVE, FLINT, GROVE, HALO, INK, JADE, KITE,
LARK, MESH, NOON, OAK, PINE, QUAY, REEF, SAGE, TIDE, URN,
VALE, WAVE, YARN, ZINC, BOLT, CALM, DUSK, ECHO, FERN, GUST,
HIVE, IRIS, JEST, KELP, LIME, MAST, NOOK, OPAL, PEAT, QUILL,
RUNE, SALT, TARN, UMBER, VANE, WREN, YOKE, ZEST, BIRCH, CLAY
```

---

## Deployment

- Frontend: Vercel, automatic deploy from git push
- Apps Script: deployed manually from script.google.com as a Web App, "execute as me", "anyone can access"
- Apps Script URL stored in a `<script>` config block at the top of each HTML file that needs it (facilitator, join, participant)

---

## Out of Scope (Sprint 1)

- Auth of any kind
- Facilitator live view of responses
- Analysis / transcript view
- Second axis
- Session history
- Collision checking on word codes

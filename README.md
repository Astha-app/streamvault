# StreamVault

A self-hosted video player app with Real-Debrid integration and a premium streaming experience.

---

## ⚠️ Legal Usage Notice

This app is designed **exclusively** for users to stream their own content through their own Real-Debrid account. It does not include, support, or link to piracy sources, torrent search engines, public movie/TV catalogs, copyrighted content databases, or illegal streaming integrations. Users are responsible for ensuring they are authorized to access any content they stream.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Player | HTML5 Video + hls.js + dash.js |
| State | Zustand |
| Local DB | IndexedDB via Dexie |
| Backend | Node.js + Express + TypeScript |
| Validation | Zod |
| Testing | Vitest |

---

## Setup

### Prerequisites

- Node.js ≥ 20.6
- A Real-Debrid account and API token ([get it here](https://real-debrid.com/apitoken))

### Install

```bash
git clone <your-repo-url>
cd video-player-app
npm install
```

### Configure

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
REALDEBRID_API_TOKEN=your_token_here
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
```

> **Security**: Your token never leaves the server. The frontend only communicates with the local backend proxy.

```bash
cp client/.env.example client/.env
```

### Run

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

Open `http://localhost:5173` in your browser.

---

## How to Use Real-Debrid

1. Get your API token at [real-debrid.com/apitoken](https://real-debrid.com/apitoken)
2. Add it to `server/.env` as `REALDEBRID_API_TOKEN=...`
3. Start the server with `npm run dev`
4. Go to **Resolver** in the app and click **Test** to verify the connection
5. Paste any supported link and click **Resolve**
6. Click **Play Now** to start streaming

---

## Environment Variables

### `server/.env`

| Variable | Default | Description |
|---|---|---|
| `REALDEBRID_API_TOKEN` | — | Your Real-Debrid API token (**required**) |
| `PORT` | `3001` | Backend server port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Frontend URL for CORS |
| `REALDEBRID_CACHE_TTL_MINUTES` | `60` | How long resolved links are cached in memory |
| `NODE_ENV` | `development` | Node environment |

### `client/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | — | Backend URL (only needed outside Vite proxy) |

---

## Scripts

```bash
npm run dev          # Start both server and client
npm run build        # Build both for production
npm run test         # Run all tests
npm run lint         # Lint both packages
npm run typecheck    # TypeScript type-check both packages
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` / `K` | Play / Pause |
| `J` | Seek back 10s |
| `L` | Seek forward 10s |
| `←` / `→` | Seek ±5s |
| `Shift` + `←` / `→` | Seek ±30s |
| `↑` / `↓` | Volume ±10% |
| `M` | Mute / Unmute |
| `F` | Fullscreen |
| `T` | Theater mode |
| `P` | Picture in Picture |
| `C` | Toggle captions |
| `>` / `<` | Speed up / down |
| `0`–`9` | Jump to 0%–90% |
| `Esc` | Close menus |

---

## Architecture

```
video-player-app/
├── client/        # React + Vite frontend
│   └── src/
│       ├── components/player/   # Custom video player UI
│       ├── hooks/               # useVideoEngine, useScrubbing, etc.
│       ├── pages/               # Routed page components
│       ├── services/            # API client, IndexedDB, subtitles
│       ├── stores/              # Zustand state
│       └── utils/               # Time, URL, format helpers
├── server/        # Express backend proxy
│   └── src/
│       ├── routes/              # health, realdebrid, cache
│       ├── services/            # RD service + in-memory cache
│       ├── middleware/          # CORS, rate limiting, validation
│       └── schemas/             # Zod validation schemas
└── shared/
    └── types/                   # Shared TypeScript types
```

### Key Security Decisions

- **Token isolation**: `REALDEBRID_API_TOKEN` is read only by the server. The client never sees it.
- **No open proxy**: The backend only forwards requests to `api.real-debrid.com`. All other outbound requests are blocked.
- **No full-video caching**: Video binaries are never stored locally — only metadata, history, and subtitle text.
- **Rate limiting**: Backend has per-route rate limiting to avoid hammering the Real-Debrid API.

---

## Caching Behavior

| Cache layer | What | Where | TTL |
|---|---|---|---|
| Server in-memory | Resolved RD download URLs | Node process | Configurable (default 60m) |
| IndexedDB | Metadata, history, settings, subtitles | Browser | Permanent (user-cleared) |

Video files themselves are **never cached**. This is intentional:
1. Copyright law in many jurisdictions prohibits caching copyrighted content
2. Real-Debrid download links expire and differ between sessions
3. Browser storage quotas would be exhausted immediately

---

## Known Limitations & Future Improvements

- **DASH support**: `dash.js` is installed as a dependency but the engine defaults to hls.js and native video. Full DASH + ABR switching requires additional wiring in `useVideoEngine.ts`.
- **Thumbnail previews**: The seek bar shows a hover tooltip with timestamp but not actual video frame thumbnails. WebVTT sprite support is a planned enhancement.
- **Chromecast / AirPlay**: AirPlay works on Safari natively (the `<video>` tag enables it). Full Chromecast support requires the Cast SDK.
- **Audio track switching**: Supported where hls.js provides track data. Not all streams expose multiple audio tracks.
- **A/B loop markers**: Architecture is in place (`abMarkers` in playerStore) but UI is not yet wired.
- **Volume boost / normalise**: Not implemented. Would require a Web Audio API pipeline.
- **Playwright E2E tests**: Structure scaffolded, not yet written.
- **Persistent server cache**: The in-memory cache resets on server restart. Swap `cacheService.ts` for a Redis or SQLite store for persistence.
- **History titles**: History entries currently store the `videoId` as the title fallback. This is improved when metadata is saved via the resolver flow.

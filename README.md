# Streamship

Professional white-label live streaming on Nostr and Bitcoin.

## Quick Start

### Run with Docker Compose

```bash
docker-compose up -d
```

Open http://localhost:3000

### Development

```bash
npm install
npm run dev
```

## OBS Setup

1. Open OBS → Settings → Stream
2. Set **Service** to `Custom...`
3. **Server:** `rtmp://localhost/live`
4. **Stream Key:** your hex pubkey (shown in the dashboard after connecting your Nostr wallet)
5. Click **Start Streaming**

Your stream will be live at `http://localhost:3000`

## Pages

| Page | Description |
|---|---|
| `/` | Browse all live streams |
| `/dashboard` | Broadcaster dashboard — get your stream key and go live |
| `/watch/[naddr]` | Viewer page — HLS player, Nostr chat, zap leaderboard |

## Architecture

```
OBS → RTMP → SRS (port 1935) → HLS → hls.js player
                                      ↕
                               NIP-53 kind:30311 (live event)
                               NIP-28 kind:1311  (chat)
                               NIP-57 kind:9735  (zap receipts)
```

### Components

- **SRS** (Simple Realtime Server) — RTMP ingest on port 1935, HLS output on port 8080
- **Next.js** — Frontend app on port 3000
- **NDK** (@nostr-dev-kit/ndk) — Nostr relay connections, event subscriptions
- **hls.js** — HLS video playback in the browser
- **WebLN** — Browser Lightning wallet integration for zaps

### Nostr Events

- **kind:30311** (NIP-53) — Live Activity events for stream metadata and discovery
- **kind:1311** — Stream chat messages
- **kind:9735** — Zap receipts for the leaderboard

### Stream Key

Your stream key is derived from your Nostr pubkey (first 32 hex chars). This means:
- No registration required
- Cryptographically tied to your identity
- Only you can claim your stream slot

## Default Relays

- wss://relay.damus.io
- wss://relay.nostr.band
- wss://nos.lol
- wss://relay.primal.net

Configure via `NEXT_PUBLIC_NOSTR_RELAYS` environment variable.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SRS_HTTP_URL` | `http://localhost:8080` | SRS HLS base URL |
| `NEXT_PUBLIC_RTMP_HOST` | `localhost` | RTMP server hostname |
| `NEXT_PUBLIC_NOSTR_RELAYS` | (see above) | Comma-separated relay list |

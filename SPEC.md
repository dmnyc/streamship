# Streamship | Technical Specification
**Version:** 2.0 — March 2026
**Domain:** streamship.net

---

## 1. Vision

Streamship is the professional streaming engine for the open web.

Built on Nostr and Bitcoin, it gives creators, platforms, and brands everything they need to run a world-class live streaming operation — without touching Twitch, YouTube, or any centralized gatekeeper.

The problem with every existing Nostr streaming tool (zap.stream, Tunestr) is that they're proof-of-concepts that got stuck. Rough UX, manual configuration, brittle infrastructure. Nobody building on top of them can move fast or deliver a professional experience.

Streamship rebuilds it from scratch, the way a professional video streaming platform should work. The broadcaster plugs into OBS and goes. The audience shows up and pays. The operator owns the platform.

**We are the Shopify of live streaming.**

---

## 2. Deployment Model

Streamship is a white-label framework. Operators deploy their own "ship" — a fully branded streaming platform on their own domain.

### Instance Types

| Mode | Description | Example |
|---|---|---|
| **Open** | Anyone can sign in and stream | Community hub, open stage |
| **Curated** | Whitelisted pubkeys or NIP-05 verified users only | Artist collective, label roster |
| **Gated** | Viewing requires payment (Lightning, NWC, or fiat) | Pay-per-view concert, exclusive content |

---

## 3. The Broadcaster Experience

This is the core product differentiator. Setup must be zero-friction.

### Automatic Configuration
- Broadcaster authenticates with their Nostr key (NIP-07 / NIP-46)
- Streamship auto-generates their personal RTMP endpoint and stream key
- **One-click OBS profile export** — broadcaster imports the file, never touches a setting manually
- Restream.io compatibility — Streamship acts as a destination, rebroadcasting to configured Nostr relays
- WHIP support for direct browser streaming (no OBS required for casual streams)

### Stream Health Dashboard
- Real-time bitrate, resolution, dropped frames
- Relay connectivity status (which relays are live, which dropped)
- Viewer count and zap activity feed
- Alert system for stream degradation

### Broadcast Flow
1. Broadcaster hits "Go Live" in the dashboard
2. NIP-53 Live Activity event is published to configured relays
3. Stream is ingested via RTMP/WHIP → transcoded to adaptive bitrate HLS
4. Viewers connect; payments flow in real time
5. On stream end, VOD is automatically archived to Blossom and a NIP-94 event is published

---

## 4. The Viewer Experience

### Discovery
- Network filtering: "People I Follow" streams surface first
- Tag and genre browsing
- Featured/promoted streams per instance

### Playback
- Theater mode — distraction-free, content-first
- Adaptive bitrate (auto quality based on connection)
- HLS-compatible with standard players and embeds

### Payments
Streamship supports the full payment stack — no audience is left behind:

| Method | Use Case |
|---|---|
| **WebLN** | Browser wallet users (Alby extension, etc.) |
| **NWC via BitcoinConnect** | Connected Lightning wallets |
| **Breez SDK** | Embedded wallet for operators offering native Lightning |
| **Stripe / fiat** | Mainstream audiences, non-crypto users |

### Engagement
- Real-time zap leaderboard during streams
- "Heatmap" visualization — zap density mapped to stream timeline (shows highlight moments)
- Clip sharing with timestamp deeplinks

---

## 5. The Policy Engine

Identity and access control without hardcoded lists.

### Identity
- **NIP-05 domain verification** — instances can restrict to specific domains (e.g., `*@yourlabel.com`)
- **NIP-98 HTTP auth** — secure headers on all stream endpoints, prevents hijacking
- Email + password fallback for non-Nostr users (mapped to ephemeral keypair)

### Access Control
- **NIP-58 Badges** — grant/revoke viewer or broadcaster access; Last-Write-Wins logic (most recent `Kind 8` from issuer is source of truth)
- **NWC payment gates** — access unlocked by verified Lightning payment
- **Stripe payment gates** — same model for fiat-paying viewers
- **Role system** — Admin, Moderator, Broadcaster, Viewer tiers per instance

---

## 6. Technical Stack

| Component | Technology | Notes |
|---|---|---|
| **Media Ingest** | SRS or Mediamtx | RTMP + WHIP, self-hostable, battle-tested |
| **Transcoding** | FFmpeg | Adaptive bitrate HLS packaging |
| **Frontend** | Next.js + Tailwind CSS | White-label ready, SEO optimized |
| **Nostr Logic** | NDK (Nostr Dev Kit) | Relay management, event caching, NIP-53 |
| **Payments** | BitcoinConnect + WebLN + Breez SDK + Stripe | Full payment stack |
| **Auth** | NIP-07 / NIP-46 + email fallback | Nostr-native, accessible |
| **VOD Storage** | Blossom protocol | Decentralized, operator-controlled |
| **State** | TanStack Query | Real-time live status sync |
| **Database** | PostgreSQL | Operator config, analytics, user data |
| **Deployment** | Docker Compose + CLI installer | One-command instance deploy |

---

## 7. Infrastructure & Deployment

### Self-Hosted
- Docker Compose stack: frontend + media server + relay + database
- CLI installer: `npx create-streamship-app` — interactive setup, auto-generates config
- Custom domain support out of the box
- Operator owns all data

### Managed (Streamship-hosted)
- Operator gets a subdomain on `streamship.net` or brings their own domain
- Streamship manages media server, relay, scaling
- Operator logs in to a dashboard, never touches infrastructure

---

## 8. Business Model

### Revenue Streams

1. **Instance Licensing (SaaS)** — monthly fee per deployed ship
   - Starter: self-hosted, free (open core)
   - Pro: managed hosting, $99-299/mo
   - Enterprise: custom SLA, white-glove onboarding, custom pricing

2. **Payment Processing Share** — optional 0.5-1% of Lightning/fiat volume processed
   - Operators can opt out in exchange for higher license tier

3. **Managed Infrastructure** — Streamship runs the media server and relays
   - Higher margin, lower friction for non-technical operators

### Target Customers
- Music streaming platforms (Tunestr and successors)
- Independent artist collectives
- Music labels running their own fan platforms
- Conference and event organizers
- Sports leagues, e-sports orgs
- Faith communities
- Any vertical running live gated content that wants to exit Twitch/YouTube

---

## 9. Roadmap

### Phase 1 — The Core Engine
- Media ingest server (RTMP + WHIP via SRS/Mediamtx)
- NIP-53 Live Activity integration with multi-relay broadcast
- Basic broadcaster dashboard
- OBS profile auto-export
- NIP-07 / NIP-46 auth

### Phase 2 — The Viewer Layer
- Theater mode viewer UI
- Real-time zap integration (WebLN + BitcoinConnect)
- Breez SDK embedded wallet option
- Stripe payment gates
- Zap leaderboard + heatmap

### Phase 3 — White-Label Framework
- Full instance configuration system
- NIP-05 domain verification (policy engine)
- NIP-58 badge-based access control
- Custom branding/theming per instance
- CLI installer + Docker Compose stack

### Phase 4 — VOD & Growth
- Automatic VOD archiving to Blossom (NIP-94 events)
- Analytics dashboard for operators
- Managed hosting tier launch
- Restream.io integration

---

## 10. Open Questions

- **Relay strategy** — run a dedicated Streamship relay per instance, or integrate with existing relay networks?
- **Dynamic revocation** — NIP-09 + NIP-58 interplay for instant access removal edge cases
- **CDN layer** — for managed tier at scale, evaluate Cloudflare Stream vs self-hosted HLS delivery
- **Mobile** — React Native app in roadmap or PWA-first?

"use client";

import { useEffect, useState } from "react";
import { connectNDK } from "@/lib/ndk";
import { streamKeyFromPubkey, hlsUrlFromStreamKey, rtmpEndpoint } from "@/lib/nostr";
import { NDKEvent } from "@nostr-dev-kit/ndk";

interface StreamHealth {
  status: "idle" | "live" | "checking";
  viewers: number;
  bitrate?: number;
}

export default function DashboardPage() {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [health, setHealth] = useState<StreamHealth>({ status: "idle", viewers: 0 });
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dTag] = useState(() => `stream-${Date.now()}`);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.nostr) {
      alert("No Nostr wallet found. Install a NIP-07 extension like Alby.");
      return;
    }
    try {
      const pk = await window.nostr.getPublicKey();
      setPubkey(pk);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const streamKey = pubkey ? streamKeyFromPubkey(pubkey) : null;
  const srsBase = process.env.NEXT_PUBLIC_SRS_HTTP_URL || "http://localhost:8080";
  const rtmpHost = process.env.NEXT_PUBLIC_RTMP_HOST || "localhost";
  const hlsUrl = streamKey ? hlsUrlFromStreamKey(streamKey, srsBase) : null;

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const goLive = async () => {
    if (!pubkey || !streamKey) return;
    setPublishing(true);

    try {
      const ndk = await connectNDK();

      const event = new NDKEvent(ndk);
      event.kind = 30311;
      event.content = "";
      event.tags = [
        ["d", dTag],
        ["title", title || "Live Stream"],
        ["summary", summary],
        ["status", "live"],
        ["streaming", hlsUrl!],
        ["starts", Math.floor(Date.now() / 1000).toString()],
        ...tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => ["t", t]),
      ];

      await event.sign();
      await event.publish();

      setIsLive(true);
      setHealth({ status: "live", viewers: 0 });
    } catch (err) {
      console.error("Failed to go live:", err);
      alert("Failed to publish live event. Check console for details.");
    } finally {
      setPublishing(false);
    }
  };

  const endStream = async () => {
    if (!pubkey || !streamKey) return;
    setPublishing(true);

    try {
      const ndk = await connectNDK();

      const event = new NDKEvent(ndk);
      event.kind = 30311;
      event.content = "";
      event.tags = [
        ["d", dTag],
        ["title", title || "Live Stream"],
        ["status", "ended"],
        ["ends", Math.floor(Date.now() / 1000).toString()],
      ];

      await event.sign();
      await event.publish();

      setIsLive(false);
      setHealth({ status: "idle", viewers: 0 });
    } catch (err) {
      console.error("Failed to end stream:", err);
    } finally {
      setPublishing(false);
    }
  };

  // Poll SRS API for stream health
  useEffect(() => {
    if (!streamKey || !isLive) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `${srsBase.replace("8080", "1985")}/api/v1/streams/`
        );
        if (res.ok) {
          const data = await res.json();
          const streams: Array<{ name: string; clients: number; kbps?: { recv_30s: number } }> = data.streams || [];
          const myStream = streams.find((s) => s.name === streamKey);
          if (myStream) {
            setHealth({
              status: "live",
              viewers: myStream.clients || 0,
              bitrate: myStream.kbps?.recv_30s,
            });
          }
        }
      } catch {}
    };

    const interval = setInterval(poll, 5000);
    poll();
    return () => clearInterval(interval);
  }, [streamKey, isLive, srsBase]);

  if (!pubkey) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">🎙️</div>
        <h1 className="text-3xl font-bold mb-3">Broadcaster Dashboard</h1>
        <p className="text-white/50 mb-8">
          Connect your Nostr wallet to get your stream key and go live.
        </p>
        <button
          onClick={connectWallet}
          className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
        >
          Connect Nostr Wallet
        </button>
        <p className="text-white/30 text-xs mt-4">
          Requires a NIP-07 extension (Alby, nos2x, etc.)
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Broadcaster Dashboard</h1>
          <p className="text-white/40 text-sm mt-1 font-mono">
            {pubkey.slice(0, 16)}...{pubkey.slice(-8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="live-badge">Live</span>
          ) : (
            <span className="text-white/30 text-sm">Offline</span>
          )}
        </div>
      </div>

      {/* Stream Info */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
        <h2 className="font-semibold mb-4">Stream Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
              Stream Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Stream"
              disabled={isLive}
              className="w-full bg-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tell viewers what this stream is about..."
              disabled={isLive}
              rows={2}
              className="w-full bg-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="music, live, nostr"
              disabled={isLive}
              className="w-full bg-white/10 rounded-lg px-4 py-2.5 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* OBS Config */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
        <h2 className="font-semibold mb-4">OBS Setup</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
              RTMP Server
            </label>
            <div className="flex gap-2">
              <code className="flex-1 bg-black/40 rounded-lg px-4 py-2.5 text-sm font-mono text-green-400">
                rtmp://{rtmpHost}/live
              </code>
              <button
                onClick={() => copyToClipboard(`rtmp://${rtmpHost}/live`, "rtmp")}
                className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {copied === "rtmp" ? "✓" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">
              Stream Key
            </label>
            <div className="flex gap-2">
              <code className="flex-1 bg-black/40 rounded-lg px-4 py-2.5 text-sm font-mono text-green-400 truncate">
                {streamKey}
              </code>
              <button
                onClick={() => copyToClipboard(streamKey!, "key")}
                className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {copied === "key" ? "✓" : "Copy"}
              </button>
            </div>
          </div>
          <div className="text-xs text-white/30 bg-black/20 rounded-lg p-3">
            In OBS: Settings → Stream → Service: Custom → enter the server and key above.
          </div>
        </div>
      </div>

      {/* Stream Health */}
      {isLive && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-6">
          <h2 className="font-semibold mb-4">Stream Health</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {health.viewers}
              </div>
              <div className="text-xs text-white/40 mt-1">Viewers</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {health.bitrate ? `${Math.round(health.bitrate)}` : "—"}
              </div>
              <div className="text-xs text-white/40 mt-1">Kbps (in)</div>
            </div>
            <div className="bg-black/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">✓</div>
              <div className="text-xs text-white/40 mt-1">Relay</div>
            </div>
          </div>
        </div>
      )}

      {/* Go Live / End Stream */}
      <div className="flex gap-4">
        {!isLive ? (
          <button
            onClick={goLive}
            disabled={publishing}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition-colors"
          >
            {publishing ? "Publishing..." : "🔴 Go Live"}
          </button>
        ) : (
          <button
            onClick={endStream}
            disabled={publishing}
            className="flex-1 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg transition-colors border border-white/20"
          >
            {publishing ? "Ending..." : "⏹ End Stream"}
          </button>
        )}
      </div>
    </div>
  );
}

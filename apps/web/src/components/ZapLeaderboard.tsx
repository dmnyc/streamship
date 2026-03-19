"use client";

import { useEffect, useState } from "react";
import { connectNDK } from "@/lib/ndk";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";

interface ZapEntry {
  pubkey: string;
  amount: number; // in sats
  count: number;
}

interface ZapLeaderboardProps {
  streamPubkey: string;
  streamDTag: string;
}

function shortPubkey(pk: string): string {
  return pk.slice(0, 8) + "..." + pk.slice(-4);
}

function parseZapAmount(event: NDKEvent): number {
  // NIP-57: amount is in bolt11 invoice or in "amount" tag (millisats)
  const amountTag = event.tags.find((t) => t[0] === "amount")?.[1];
  if (amountTag) {
    return Math.floor(parseInt(amountTag, 10) / 1000);
  }
  // Try to parse from bolt11 (simplified - just look for amount tag)
  const bolt11 = event.tags.find((t) => t[0] === "bolt11")?.[1];
  if (bolt11) {
    // Very simplified: look for amount in msats from description tag
    const descTag = event.tags.find((t) => t[0] === "description")?.[1];
    if (descTag) {
      try {
        const zapRequest = JSON.parse(descTag);
        const ms = zapRequest.tags?.find((t: string[]) => t[0] === "amount")?.[1];
        if (ms) return Math.floor(parseInt(ms, 10) / 1000);
      } catch {}
    }
  }
  return 0;
}

export default function ZapLeaderboard({ streamPubkey, streamDTag }: ZapLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<ZapEntry[]>([]);
  const [totalSats, setTotalSats] = useState(0);

  useEffect(() => {
    let sub: { stop: () => void } | null = null;

    const init = async () => {
      const ndk = await connectNDK();

      const filter: NDKFilter = {
        kinds: [9735 as number],
        "#a": [`30311:${streamPubkey}:${streamDTag}`],
      };

      sub = ndk.subscribe(filter, { closeOnEose: false });

      sub.on("event", (event: NDKEvent) => {
        const sats = parseZapAmount(event);
        if (sats <= 0) return;

        // Zap sender is in "P" tag (uppercase) of the zap receipt
        const senderPubkey =
          event.tags.find((t) => t[0] === "P")?.[1] ??
          event.tags.find((t) => t[0] === "p")?.[1] ??
          event.pubkey;

        setLeaderboard((prev) => {
          const existing = prev.find((e) => e.pubkey === senderPubkey);
          let updated: ZapEntry[];
          if (existing) {
            updated = prev.map((e) =>
              e.pubkey === senderPubkey
                ? { ...e, amount: e.amount + sats, count: e.count + 1 }
                : e
            );
          } else {
            updated = [...prev, { pubkey: senderPubkey, amount: sats, count: 1 }];
          }
          return updated.sort((a, b) => b.amount - a.amount).slice(0, 10);
        });
        setTotalSats((prev) => prev + sats);
      });
    };

    init().catch(console.error);
    return () => { sub?.stop(); };
  }, [streamPubkey, streamDTag]);

  const handleZap = async () => {
    if (typeof window === "undefined" || !window.webln) {
      alert(
        "No WebLN wallet found. Install Alby or another WebLN-compatible browser extension."
      );
      return;
    }
    try {
      await window.webln.enable();
      // Simple fixed-amount zap — in production would show amount picker
      const invoice = prompt("Paste a Lightning invoice to zap the stream:");
      if (invoice) {
        await window.webln.sendPayment(invoice);
      }
    } catch (err) {
      console.error("Zap failed:", err);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">⚡ Zap Leaderboard</h3>
          {totalSats > 0 && (
            <p className="text-xs text-yellow-400 mt-0.5">
              {totalSats.toLocaleString()} sats total
            </p>
          )}
        </div>
        <button
          onClick={handleZap}
          className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
        >
          ⚡ Zap
        </button>
      </div>

      <div className="divide-y divide-white/5">
        {leaderboard.length === 0 && (
          <div className="text-center text-white/30 text-xs py-6">
            No zaps yet. Be the first!
          </div>
        )}
        {leaderboard.map((entry, i) => (
          <div
            key={entry.pubkey}
            className="flex items-center gap-3 px-4 py-2.5"
          >
            <span className="text-white/40 text-xs w-4 shrink-0">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
            </span>
            <span className="text-sm font-mono text-white/70 flex-1 truncate">
              {shortPubkey(entry.pubkey)}
            </span>
            <span className="text-yellow-400 text-sm font-semibold shrink-0">
              {entry.amount.toLocaleString()} ⚡
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

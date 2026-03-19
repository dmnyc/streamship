"use client";

import { useEffect, useState } from "react";
import { connectNDK } from "@/lib/ndk";
import { parseStreamEvent, type StreamEvent } from "@/lib/nostr";
import StreamCard from "@/components/StreamCard";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";

export default function HomePage() {
  const [streams, setStreams] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sub: { stop: () => void } | null = null;

    const init = async () => {
      const ndk = await connectNDK();

      const filter: NDKFilter = {
        kinds: [30311 as number],
        "#status": ["live"],
        limit: 50,
      };

      sub = ndk.subscribe(filter, { closeOnEose: false });

      sub.on("event", (event: NDKEvent) => {
        const stream = parseStreamEvent({
          id: event.id,
          pubkey: event.pubkey,
          tags: event.tags,
          kind: event.kind ?? 30311,
        });
        if (!stream || stream.status !== "live") return;

        setStreams((prev) => {
          const exists = prev.findIndex((s) => s.dTag === stream.dTag && s.pubkey === stream.pubkey);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = stream;
            return updated;
          }
          return [...prev, stream];
        });
        setLoading(false);
      });

      // Timeout to stop loading state even if no streams
      setTimeout(() => setLoading(false), 5000);
    };

    init().catch((err) => {
      console.error(err);
      setLoading(false);
    });

    return () => { sub?.stop(); };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Live Now</h1>
        <p className="text-white/50">Live streams on Nostr</p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span>Scanning relays for live streams...</span>
        </div>
      )}

      {!loading && streams.length === 0 && (
        <div className="text-center py-20 text-white/30">
          <div className="text-5xl mb-4">📡</div>
          <p className="text-lg font-medium mb-2">No live streams right now</p>
          <p className="text-sm">
            Be the first!{" "}
            <a href="/dashboard" className="text-brand hover:underline">
              Go live →
            </a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {streams.map((stream) => (
          <StreamCard key={stream.naddr} stream={stream} />
        ))}
      </div>
    </div>
  );
}

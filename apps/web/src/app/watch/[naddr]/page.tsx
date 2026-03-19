"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { nip19 } from "nostr-tools";
import { connectNDK } from "@/lib/ndk";
import { parseStreamEvent, type StreamEvent } from "@/lib/nostr";
import VideoPlayer from "@/components/VideoPlayer";
import NostrChat from "@/components/NostrChat";
import ZapLeaderboard from "@/components/ZapLeaderboard";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";

export default function WatchPage() {
  const params = useParams();
  const naddr = params.naddr as string;
  const [stream, setStream] = useState<StreamEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!naddr) return;

    let decoded: { pubkey: string; identifier: string } | null = null;
    try {
      const result = nip19.decode(naddr);
      if (result.type === "naddr") {
        decoded = {
          pubkey: result.data.pubkey,
          identifier: result.data.identifier,
        };
      }
    } catch {
      setError("Invalid stream address");
      return;
    }

    if (!decoded) {
      setError("Invalid stream address");
      return;
    }

    const { pubkey, identifier } = decoded;
    let sub: { stop: () => void } | null = null;

    const init = async () => {
      const ndk = await connectNDK();

      const filter: NDKFilter = {
        kinds: [30311 as number],
        authors: [pubkey],
        "#d": [identifier],
        limit: 1,
      };

      sub = ndk.subscribe(filter, { closeOnEose: false });

      sub.on("event", (event: NDKEvent) => {
        const parsed = parseStreamEvent({
          id: event.id,
          pubkey: event.pubkey,
          tags: event.tags,
          kind: event.kind ?? 30311,
        });
        if (parsed) {
          // Override naddr with the one from the URL
          setStream({ ...parsed, naddr });
        }
      });

      // Timeout if stream not found
      setTimeout(() => {
        setError((prev) => {
          if (!stream && !prev) return "Stream not found";
          return prev;
        });
      }, 8000);
    };

    init().catch((err) => {
      console.error(err);
      setError("Failed to connect to relays");
    });

    return () => { sub?.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naddr]);

  if (error && !stream) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-4">📡</div>
        <h1 className="text-xl font-bold mb-2">Stream Not Found</h1>
        <p className="text-white/50 mb-6">{error}</p>
        <a href="/" className="text-brand hover:underline">
          ← Browse streams
        </a>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-white/40">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span>Loading stream...</span>
        </div>
      </div>
    );
  }

  const decodedNaddr = nip19.decode(naddr);
  const naddrData = decodedNaddr.type === "naddr" ? decodedNaddr.data : null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            {stream.status === "live" && <span className="live-badge">Live</span>}
            <h1 className="text-xl font-bold">{stream.title}</h1>
          </div>
          {stream.summary && (
            <p className="text-white/50 text-sm">{stream.summary}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {stream.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        {stream.viewers > 0 && (
          <div className="text-white/50 text-sm shrink-0">
            {stream.viewers} watching
          </div>
        )}
      </div>

      {/* Main layout: player + sidebar */}
      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Video + zap leaderboard */}
        <div className="flex-1 min-w-0 space-y-4">
          <VideoPlayer
            src={stream.streamingUrl}
            poster={stream.image}
          />
          {naddrData && (
            <ZapLeaderboard
              streamPubkey={naddrData.pubkey}
              streamDTag={naddrData.identifier}
            />
          )}
        </div>

        {/* Chat sidebar */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 h-[500px] lg:h-auto lg:min-h-[600px]">
          {naddrData && (
            <NostrChat
              streamPubkey={naddrData.pubkey}
              streamDTag={naddrData.identifier}
            />
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { connectNDK } from "@/lib/ndk";
import type NDK from "@nostr-dev-kit/ndk";
import { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";

interface ChatMessage {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
}

interface NostrChatProps {
  streamPubkey: string;
  streamDTag: string;
}

function shortPubkey(pubkey: string): string {
  return pubkey.slice(0, 8) + "..." + pubkey.slice(-4);
}

function randomColor(pubkey: string): string {
  const colors = [
    "text-purple-400",
    "text-blue-400",
    "text-green-400",
    "text-yellow-400",
    "text-pink-400",
    "text-cyan-400",
    "text-orange-400",
  ];
  const idx = parseInt(pubkey.slice(0, 2), 16) % colors.length;
  return colors[idx];
}

export default function NostrChat({ streamPubkey, streamDTag }: NostrChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const ndkRef = useRef<NDK | null>(null);

  useEffect(() => {
    let sub: { stop: () => void } | null = null;

    const init = async () => {
      const ndk = await connectNDK();
      ndkRef.current = ndk;
      setConnected(true);

      // Check NIP-07 auth
      if (typeof window !== "undefined" && window.nostr) {
        try {
          const pk = await window.nostr.getPublicKey();
          setPubkey(pk);
        } catch {}
      }

      const filter: NDKFilter = {
        kinds: [1311 as number],
        "#a": [`30311:${streamPubkey}:${streamDTag}`],
        limit: 50,
      };

      sub = ndk.subscribe(filter, { closeOnEose: false });

      sub.on("event", (event: NDKEvent) => {
        const msg: ChatMessage = {
          id: event.id,
          pubkey: event.pubkey,
          content: event.content,
          created_at: event.created_at ?? 0,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev.slice(-199), msg].sort(
            (a, b) => a.created_at - b.created_at
          );
        });
      });
    };

    init().catch(console.error);

    return () => {
      sub?.stop();
    };
  }, [streamPubkey, streamDTag]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !ndkRef.current) return;
    if (!pubkey) {
      alert("Connect a Nostr wallet (NIP-07) to chat");
      return;
    }

    setSending(true);
    try {
      const ndk = ndkRef.current;
      const event = new NDKEvent(ndk);
      event.kind = 1311;
      event.content = inputValue.trim();
      event.tags = [
        ["a", `30311:${streamPubkey}:${streamDTag}`, "", "root"],
      ];

      await event.sign();
      await event.publish();
      setInputValue("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Live Chat</h3>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`}
          />
          <span className="text-xs text-white/40">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-white/30 text-xs py-8">
            No messages yet. Be the first to chat!
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm leading-relaxed">
            <span className={`font-medium mr-1.5 ${randomColor(msg.pubkey)}`}>
              {shortPubkey(msg.pubkey)}
            </span>
            <span className="text-white/80">{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 border-t border-white/10">
        {pubkey ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Send a message..."
              maxLength={280}
              className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !inputValue.trim()}
              className="bg-brand hover:bg-brand-dark disabled:opacity-40 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        ) : (
          <button
            onClick={async () => {
              if (window.nostr) {
                const pk = await window.nostr.getPublicKey();
                setPubkey(pk);
              } else {
                alert(
                  "No Nostr wallet found. Install a NIP-07 extension like Alby."
                );
              }
            }}
            className="w-full bg-white/10 hover:bg-white/20 text-white/70 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            Connect wallet to chat
          </button>
        )}
      </div>
    </div>
  );
}

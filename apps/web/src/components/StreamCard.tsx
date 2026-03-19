import Link from "next/link";
import type { StreamEvent } from "@/lib/nostr";

export default function StreamCard({ stream }: { stream: StreamEvent }) {
  return (
    <Link href={`/watch/${stream.naddr}`}>
      <div className="group rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand/50 transition-all cursor-pointer">
        <div className="relative aspect-video bg-black/50">
          {stream.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stream.image}
              alt={stream.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
              📡
            </div>
          )}
          {stream.status === "live" && (
            <div className="absolute top-2 left-2 live-badge">Live</div>
          )}
          {stream.viewers > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {stream.viewers} watching
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate">{stream.title}</h3>
          {stream.summary && (
            <p className="text-xs text-white/50 mt-0.5 truncate">
              {stream.summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {stream.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

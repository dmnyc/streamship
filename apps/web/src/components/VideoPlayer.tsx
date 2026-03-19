"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    let destroyed = false;

    const initPlayer = async () => {
      const Hls = (await import("hls.js")).default;

      if (destroyed || !videoRef.current) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          videoRef.current?.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event: unknown, data: { fatal: boolean; type: string }) => {
          if (data.fatal) {
            setError(`Stream error: ${data.type}`);
            setLoading(false);
          }
        });
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        videoRef.current.src = src;
        videoRef.current.addEventListener("loadedmetadata", () => {
          setLoading(false);
          videoRef.current?.play().catch(() => {});
        });
      } else {
        setError("HLS not supported in this browser");
        setLoading(false);
      }
    };

    initPlayer();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        (hlsRef.current as { destroy: () => void }).destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className="relative w-full bg-black aspect-video rounded-lg overflow-hidden">
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Connecting to stream...</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
          <span className="text-3xl">📡</span>
          <span className="text-sm">{error}</span>
          <span className="text-xs">Stream may not be live yet</span>
        </div>
      )}
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        className="w-full h-full"
        style={{ display: error ? "none" : "block" }}
      />
    </div>
  );
}

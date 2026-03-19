import { nip19 } from "nostr-tools";

export interface StreamEvent {
  id: string;
  pubkey: string;
  dTag: string;
  title: string;
  summary: string;
  image: string;
  status: "live" | "ended" | "planned";
  streamingUrl: string;
  starts: number;
  viewers: number;
  tags: string[];
  naddr: string;
}

export function parseStreamEvent(event: {
  id: string;
  pubkey: string;
  tags: string[][];
  kind: number;
}): StreamEvent | null {
  const getTag = (name: string) =>
    event.tags.find((t) => t[0] === name)?.[1] ?? "";

  const dTag = getTag("d");
  const status = (getTag("status") || "ended") as StreamEvent["status"];
  const streamingUrl = getTag("streaming");

  if (!dTag) return null;

  const naddr = nip19.naddrEncode({
    kind: 30311,
    pubkey: event.pubkey,
    identifier: dTag,
  });

  return {
    id: event.id,
    pubkey: event.pubkey,
    dTag,
    title: getTag("title") || "Untitled Stream",
    summary: getTag("summary") || "",
    image: getTag("image") || "",
    status,
    streamingUrl,
    starts: parseInt(getTag("starts") || "0", 10),
    viewers: parseInt(getTag("current_participants") || "0", 10),
    tags: event.tags.filter((t) => t[0] === "t").map((t) => t[1]),
    naddr,
  };
}

export function streamKeyFromPubkey(pubkey: string): string {
  // Use first 16 chars of hex pubkey as stream key for readability
  return pubkey.slice(0, 32);
}

export function hlsUrlFromStreamKey(
  streamKey: string,
  baseUrl = "http://localhost:8080"
): string {
  return `${baseUrl}/live/${streamKey}/index.m3u8`;
}

export function rtmpEndpoint(host = "localhost"): string {
  return `rtmp://${host}/live`;
}

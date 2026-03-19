import NDK from "@nostr-dev-kit/ndk";

const RELAYS = (process.env.NEXT_PUBLIC_NOSTR_RELAYS || "wss://relay.damus.io,wss://relay.nostr.band,wss://nos.lol,wss://relay.primal.net")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

let _ndk: NDK | null = null;

export function getNDK(): NDK {
  if (!_ndk) {
    _ndk = new NDK({
      explicitRelayUrls: RELAYS,
    });
  }
  return _ndk;
}

export async function connectNDK(): Promise<NDK> {
  const ndk = getNDK();
  await ndk.connect(2000);
  return ndk;
}

export { RELAYS };

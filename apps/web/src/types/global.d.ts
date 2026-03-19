interface NostrProvider {
  getPublicKey(): Promise<string>;
  signEvent(event: object): Promise<object>;
}

interface WebLNProvider {
  enable(): Promise<void>;
  sendPayment(paymentRequest: string): Promise<{ preimage: string }>;
  makeInvoice(args: {
    amount: number;
    defaultMemo?: string;
  }): Promise<{ paymentRequest: string }>;
}

declare global {
  interface Window {
    nostr?: NostrProvider;
    webln?: WebLNProvider;
  }
}

export {};

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streamship",
  description: "Professional live streaming on Nostr and Bitcoin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-white">
        <nav className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            ⚡ Streamship
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Browse
            </a>
            <a
              href="/dashboard"
              className="text-sm bg-brand hover:bg-brand-dark text-white px-4 py-1.5 rounded-full transition-colors font-medium"
            >
              Go Live
            </a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}

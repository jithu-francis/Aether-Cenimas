import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Aether Cinema — Private Screening",
  description:
    "A private, aesthetic cinema experience with real-time sync and live messaging.",
  keywords: ["cinema", "streaming", "private", "sync", "watch party"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          toastOptions={{
            style: {
              background: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              color: "#e2e8f0",
            },
          }}
        />
      </body>
    </html>
  );
}

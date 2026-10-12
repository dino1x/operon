import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operon Mesh | Sovereign Agent Coordination Enclave on Monad",
  description: "WebAuthn P-256 Passkeys governing bounded autonomous operator fleets with sub-second parallel execution on Monad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0c0d12] text-white font-sans antialiased selection:bg-[#836EF9]/40 selection:text-white">
        {children}
      </body>
    </html>
  );
}

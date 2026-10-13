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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  if (event.message && (event.message.indexOf('Cannot redefine property: ethereum') !== -1 || event.message.indexOf('evmAsk.js') !== -1)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0d0e12] text-white font-sans antialiased selection:bg-[#E1007E]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}

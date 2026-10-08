import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operon Protocol | Monad Metropolis",
  description: "Policy-Bounded Autonomous Agent Execution Framework on Monad Testnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#06070a] text-[#f4f4f7] font-sans antialiased metropolis-grid selection:bg-[#836EF9]/40 selection:text-white">
        <div className="min-h-screen w-full metropolis-radial flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

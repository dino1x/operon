"use client";

import React, { useEffect, useState, useRef } from "react";
import { Shield, Fingerprint, Zap, ExternalLink, Volume2, Cpu, CheckCircle2 } from "lucide-react";
import { isWebAuthnAvailable, registerPasskey, authenticatePasskey, PasskeyAccount, getStoredPasskey } from "../lib/webauthn";
import { playBiometricChirp, playMechanicalClick } from "../lib/audio";
import { createPublicClient, http } from "viem";
import { monadTestnet } from "../config/monad";

interface HeaderProps {
  passkey: PasskeyAccount | null;
  onPasskeyChange: (account: PasskeyAccount | null) => void;
  rpcUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({ passkey, onPasskeyChange, rpcUrl = "https://testnet-rpc.monad.xyz" }) => {
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const blockNumberRef = useRef<HTMLSpanElement>(null);
  const [currentBlock, setCurrentBlock] = useState<string>("67905630");

  useEffect(() => {
    isWebAuthnAvailable().then(setHasWebAuthn);

    // Live block listener on Monad Testnet (Zero Mock)
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http(rpcUrl),
    });

    let active = true;
    const fetchBlock = async () => {
      try {
        const b = await client.getBlockNumber();
        if (active) {
          const numStr = b.toString();
          setCurrentBlock(numStr);
          if (blockNumberRef.current) {
            blockNumberRef.current.textContent = numStr;
          }
        }
      } catch (e) {
        // network retry
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 1500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [rpcUrl]);

  const handleConnectPasskey = async () => {
    try {
      playMechanicalClick();
      setIsAuthenticating(true);
      const existing = getStoredPasskey();
      if (existing) {
        const authed = await authenticatePasskey();
        if (authed) {
          playBiometricChirp();
          onPasskeyChange(authed);
          return;
        }
      }
      const newAccount = await registerPasskey("monad-master-agent");
      playBiometricChirp();
      onPasskeyChange(newAccount);
    } catch (err: any) {
      alert("Biometric Passkey registration: " + (err?.message || "User cancelled"));
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <header className="border-b border-white/[0.08] bg-[#07080e]/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#836EF9] to-[#00F59B] rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative w-10 h-10 rounded-xl bg-[#0c0d15] border border-white/10 p-0.5 flex items-center justify-center shadow-lg shadow-black">
              <Shield className="w-5 h-5 text-[#836EF9]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-white text-base tracking-tight font-sans">
                OPERON <span className="text-[#836EF9] font-mono">PROTOCOL</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#836EF9]/15 text-[#836EF9] border border-[#836EF9]/30 font-semibold tracking-wider">
                MONAD TESTNET
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono tracking-tight hidden sm:block">
              Policy-Bounded Autonomous Operator · ERC-8004
            </p>
          </div>
        </div>

        {/* Live Network, Telemetry & Biometrics */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Live Monad Block Ticker */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#0e1018] border border-white/[0.07] text-xs font-mono shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F59B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F59B]" />
            </span>
            <span className="text-neutral-400">Block:</span>
            <span ref={blockNumberRef} className="text-white font-bold tracking-wider">
              {currentBlock}
            </span>
            <span className="text-neutral-500 text-[10px] border-l border-white/10 pl-2">~385ms</span>
          </div>

          {/* Passkey Connection Button */}
          {passkey ? (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#0e1018] border border-[#836EF9]/40 text-xs font-mono shadow-[0_0_15px_rgba(131,110,249,0.15)]">
              <div className="w-2 h-2 rounded-full bg-[#00F59B]" />
              <Fingerprint className="w-4 h-4 text-[#836EF9]" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-neutral-400 leading-none">Master Passkey (P256)</span>
                <span className="text-white font-bold tracking-wider mt-0.5">
                  {passkey.address.slice(0, 6)}...{passkey.address.slice(-4)}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectPasskey}
              disabled={isAuthenticating}
              className="relative group overflow-hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6e54ff] to-[#836EF9] hover:from-[#7a62ff] hover:to-[#9380ff] active:scale-[0.98] transition-all text-white text-xs font-semibold shadow-lg shadow-[#836EF9]/30 border border-[#836EF9]/50 disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span>{isAuthenticating ? "Verifying WebAuthn..." : "Connect Master Passkey"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

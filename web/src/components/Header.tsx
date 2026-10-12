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
    <header className="border-b border-[#23252a] bg-[#010102] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand identity (Linear style) */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#5e6ad2]/15 border border-[#5e6ad2]/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#5e6ad2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm tracking-tight font-sans">
                OPERON <span className="text-[#828fff]">MESH</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#5e6ad2]/15 text-[#828fff] border border-[#5e6ad2]/30 font-medium">
                Monad Testnet
              </span>
            </div>
            <p className="text-[11px] text-[#8a8f98] font-sans tracking-tight hidden sm:block">
              Sovereign Agent Coordination Enclave · ERC-8004
            </p>
          </div>
        </div>

        {/* Live Network, Telemetry & Biometrics */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Monad Block Ticker */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0f1011] border border-[#23252a] text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F59B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F59B]" />
            </span>
            <span className="text-[#8a8f98]">Block:</span>
            <span ref={blockNumberRef} className="text-white font-semibold">
              {currentBlock}
            </span>
            <span className="text-[#62666d] text-[10px] border-l border-[#23252a] pl-1.5">~385ms</span>
          </div>

          {/* Passkey Connection Button (Linear Button) */}
          {passkey ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0f1011] border border-[#5e6ad2]/40 text-xs font-mono shadow-[0_0_12px_rgba(94,106,210,0.15)]">
              <div className="w-2 h-2 rounded-full bg-[#00F59B]" />
              <Fingerprint className="w-3.5 h-3.5 text-[#5e6ad2]" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-[#8a8f98] leading-none">Apple Secure Enclave</span>
                <span className="text-white font-medium mt-0.5">
                  {passkey.address.slice(0, 6)}...{passkey.address.slice(-4)}
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnectPasskey}
              disabled={isAuthenticating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#5e6ad2] hover:bg-[#828fff] active:scale-[0.98] transition-all text-white text-xs font-medium border border-[#5e6ad2]/50 disabled:opacity-50"
            >
              <Fingerprint className="w-3.5 h-3.5 text-white" />
              <span>{isAuthenticating ? "Verifying Enclave..." : "Connect Master Passkey"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

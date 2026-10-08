"use client";

import React from "react";
import { Fingerprint, GitBranch, Shield, Key, ChevronRight, CheckCircle2, Lock, AlertTriangle, ArrowRight } from "lucide-react";
import { PasskeyAccount } from "../lib/webauthn";
import { SessionKeyInfo } from "../lib/sessionKeys";

interface KeyDelegationTopologyProps {
  passkey: PasskeyAccount | null;
  sessions: SessionKeyInfo[];
  circuitBreakerActive: boolean;
}

export const KeyDelegationTopology: React.FC<KeyDelegationTopologyProps> = ({
  passkey,
  sessions,
  circuitBreakerActive,
}) => {
  return (
    <div className={`tactile-card rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 ${
      circuitBreakerActive ? "border-amber-500/40 glow-amber" : ""
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#836EF9]/10 border border-[#836EF9]/30 flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-[#836EF9]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono flex items-center gap-2">
              CRYPTOGRAPHIC KEY DELEGATION TOPOLOGY
              {circuitBreakerActive && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold uppercase animate-pulse">
                  CIRCUIT BREAKER ENGAGED
                </span>
              )}
            </h3>
            <p className="text-[11px] text-neutral-400 font-mono">
              Mera "One Passkey, Many Keys" cryptographic isolation architecture
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-purple-300 bg-[#836EF9]/15 px-2.5 py-1 rounded-md border border-[#836EF9]/30 font-semibold tracking-wider">
          ZERO MASTER KEY EXPOSURE
        </span>
      </div>

      {/* Visual Derivation Hierarchy Tree */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch py-1">
        {/* Tier 1: Master Passkey Root */}
        <div className="p-4 rounded-xl bg-[#0e1018] border border-[#836EF9]/30 flex flex-col justify-between gap-3 shadow-lg relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#836EF9]" />
              TIER 01 · MASTER ROOT
            </span>
            <Fingerprint className="w-4 h-4 text-[#836EF9]" />
          </div>

          <div>
            <div className="font-mono font-bold text-white text-xs truncate">
              {passkey ? `${passkey.address.slice(0, 10)}...${passkey.address.slice(-8)}` : "Awaiting Passkey Connect"}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5 mt-1">
              <Lock className="w-3 h-3 text-[#00F59B]" /> WebAuthn P-256 Biometric Secure Enclave
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono text-neutral-500">
            Signs policy grants only · Never signs raw DEX trades
          </div>
        </div>

        {/* Tier 2: Operon Policy Manager Contract */}
        <div className={`p-4 rounded-xl bg-[#0e1018] border flex flex-col justify-between gap-3 shadow-lg relative ${
          circuitBreakerActive ? "border-amber-500/40 bg-amber-950/10" : "border-white/[0.08]"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#00F59B] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00F59B]" />
              TIER 02 · POLICY GOVERNOR
            </span>
            <Shield className="w-4 h-4 text-[#00F59B]" />
          </div>

          <div>
            <div className="font-mono font-bold text-white text-xs">
              OperonPolicyManager.sol
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-1">
              Onchain Spend Caps · Contract Whitelisting · Biometric Revocation
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
            <span className="text-neutral-500">Circuit Breaker:</span>
            <span className={circuitBreakerActive ? "text-amber-400 font-bold" : "text-[#00F59B] font-bold"}>
              {circuitBreakerActive ? "TRIPPED (HALTED)" : "ARMED (HEALTHY)"}
            </span>
          </div>
        </div>

        {/* Tier 3: Scoped Ephemeral Sub-Keys & Cordon Sub-Agent Tree */}
        <div className="p-4 rounded-xl bg-[#0e1018] border border-white/[0.08] flex flex-col justify-between gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              TIER 03 · CORDON AGENT SUB-TREE
            </span>
            <Key className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="p-2 rounded-lg bg-[#141724] border border-cyan-500/20 text-[11px] font-mono">
              <div className="flex items-center justify-between text-white font-bold">
                <span>Root Orchestrator</span>
                <span className="text-cyan-300">5.0 MON Cap</span>
              </div>
              <span className="text-[10px] text-neutral-400">Master Task Dispatcher · All DEX Targets</span>
            </div>

            {/* Hierarchical Leaf Sub-Agents (Downward Narrowing) */}
            <div className="pl-3 border-l-2 border-cyan-500/30 flex flex-col gap-1.5">
              <div className="p-1.5 rounded-md bg-[#10121d] border border-white/[0.05] text-[10px] font-mono flex items-center justify-between">
                <span className="text-neutral-300">↳ Worker A: Arb Sentinel</span>
                <span className="text-[#00F59B] font-semibold">1.5 MON (Narrowed)</span>
              </div>
              <div className="p-1.5 rounded-md bg-[#10121d] border border-white/[0.05] text-[10px] font-mono flex items-center justify-between">
                <span className="text-neutral-300">↳ Worker B: Kuru Scalper</span>
                <span className="text-[#836EF9] font-semibold">1.0 MON (Narrowed)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono text-neutral-400 flex items-center justify-between">
            <span>Ancestor Debit:</span>
            <span className="text-[#00F59B] font-semibold">Auto-Propagated to Root</span>
          </div>
        </div>
      </div>
    </div>
  );
};

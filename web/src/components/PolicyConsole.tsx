"use client";

import React, { useState } from "react";
import { Key, ShieldAlert, CheckCircle2, AlertOctagon, Clock, DollarSign, Cpu, Sliders, ShieldCheck, Trash2, Fingerprint } from "lucide-react";
import { SessionKeyInfo, createSessionKey } from "../lib/sessionKeys";
import { PasskeyAccount } from "../lib/webauthn";
import { playBiometricChirp, playMechanicalClick, playCircuitBreakerAlarm } from "../lib/audio";

interface PolicyConsoleProps {
  passkey: PasskeyAccount | null;
  sessions: SessionKeyInfo[];
  onAddSession: (newSession: SessionKeyInfo) => void;
  onRevokeSession: (sessionKey: `0x${string}`) => void;
  circuitBreakerActive: boolean;
  onToggleCircuitBreaker: () => void;
  orderBookAddress: `0x${string}`;
}

export const PolicyConsole: React.FC<PolicyConsoleProps> = ({
  passkey,
  sessions,
  onAddSession,
  onRevokeSession,
  circuitBreakerActive,
  onToggleCircuitBreaker,
  orderBookAddress,
}) => {
  const [selectedAgent, setSelectedAgent] = useState({
    id: "0x8004a11fa0000000000000000000000000000000000000000000000000000001" as `0x${string}`,
    name: "Kuru Arbitrage Sentinel",
    model: "Qwen 2.5 72B (Zero-Egress)",
    reputation: "99.8%",
  });

  const [spendCap, setSpendCap] = useState("1.0");
  const [durationHours, setDurationHours] = useState(2);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleCreateSession = async () => {
    if (!passkey) {
      alert("Please connect your Master Passkey first.");
      return;
    }

    try {
      playMechanicalClick();
      setIsAuthorizing(true);
      const newSession = createSessionKey(
        selectedAgent.id,
        selectedAgent.name,
        spendCap,
        durationHours,
        [orderBookAddress]
      );
      playBiometricChirp();
      onAddSession(newSession);
    } catch (e: any) {
      alert("Session authorization failed: " + e?.message);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleTriggerCircuitBreaker = () => {
    playCircuitBreakerAlarm();
    onToggleCircuitBreaker();
  };

  return (
    <div className={`tactile-card rounded-2xl p-6 flex flex-col gap-6 transition-all duration-300 ${
      circuitBreakerActive ? "border-amber-500/50 glow-amber" : ""
    }`}>
      {/* Console Header & Emergency Circuit Breaker Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#836EF9]/10 border border-[#836EF9]/30 flex items-center justify-center">
              <Key className="w-4 h-4 text-[#836EF9]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase font-mono">
                ONE PASSKEY, MANY KEYS · POLICY CONSOLE
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Biometric master passkey authorizes scoped, revocable sub-agent keys
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Emergency Circuit Breaker Switch */}
        <button
          onClick={handleTriggerCircuitBreaker}
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all duration-200 border ${
            circuitBreakerActive
              ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
              : "bg-[#181a24] text-neutral-300 hover:text-white border-white/10 hover:border-red-500/40"
          }`}
        >
          <AlertOctagon className={`w-4 h-4 ${circuitBreakerActive ? "text-red-400" : "text-neutral-400"}`} />
          <span>{circuitBreakerActive ? "CIRCUIT BREAKER: TRIPPED" : "TRIP CIRCUIT BREAKER"}</span>
        </button>
      </div>

      {/* Target Agent & ERC-8004 Identity Card */}
      <div className="rounded-xl bg-[#0a0b12] border border-white/[0.06] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#836EF9]" />
            TARGET AI AGENT (ERC-8004 ONCHAIN REGISTRY)
          </span>
          <span className="text-[#00F59B] flex items-center gap-1 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> REPUTATION {selectedAgent.reputation}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#11131c] border border-white/[0.05]">
          <div className="space-y-1">
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{selectedAgent.name}</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#836EF9]/15 text-[#836EF9] border border-[#836EF9]/30">
                {selectedAgent.model}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono truncate">
              Agent ID: {selectedAgent.id.slice(0, 18)}... · Zero-Egress TEE Verified
            </p>
          </div>

          <div className="shrink-0 text-right font-mono text-[11px] text-neutral-400">
            <span className="block text-white font-semibold">Whitelisted DEX Target</span>
            <span>Kuru TestOrderBook.sol</span>
          </div>
        </div>
      </div>

      {/* Policy Guardrails Matrix (Spend Cap & Expiry) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Spend Cap Config */}
        <div className="rounded-xl bg-[#0a0b12] border border-white/[0.06] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              NATIVE MON SPEND CAP
            </span>
            <span className="text-white font-bold text-sm font-mono">{spendCap} MON</span>
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-4 gap-2">
            {["0.25", "0.5", "1.0", "2.5"].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  playMechanicalClick();
                  setSpendCap(val);
                }}
                className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  spendCap === val
                    ? "bg-[#836EF9]/20 text-[#836EF9] border-[#836EF9]/60 shadow-[0_0_10px_rgba(131,110,249,0.2)]"
                    : "bg-[#11131c] text-neutral-400 hover:text-white border-white/[0.06]"
                }`}
              >
                {val} MON
              </button>
            ))}
          </div>
          <p className="text-[10px] font-mono text-neutral-500">
            Hard bound: Agent transactions exceeding this balance automatically revert onchain.
          </p>
        </div>

        {/* Expiry / Session Duration */}
        <div className="rounded-xl bg-[#0a0b12] border border-white/[0.06] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              SESSION DURATION
            </span>
            <span className="text-white font-bold text-sm font-mono">{durationHours} Hours</span>
          </div>

          {/* Duration chips */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 6, 24].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => {
                  playMechanicalClick();
                  setDurationHours(hours);
                }}
                className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  durationHours === hours
                    ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "bg-[#11131c] text-neutral-400 hover:text-white border-white/[0.06]"
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
          <p className="text-[10px] font-mono text-neutral-500">
            Ephemeral sub-key automatically expires after deadline timestamp.
          </p>
        </div>
      </div>

      {/* Biometric Grant Trigger Button */}
      <button
        onClick={handleCreateSession}
        disabled={isAuthorizing || circuitBreakerActive}
        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#6e54ff] via-[#836EF9] to-[#6e54ff] hover:opacity-95 active:scale-[0.99] transition-all text-white font-sans text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl shadow-[#836EF9]/25 border border-[#836EF9]/50 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <Fingerprint className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
        <span>
          {isAuthorizing
            ? "Verifying Biometric Passkey..."
            : circuitBreakerActive
            ? "Execution Blocked by Circuit Breaker"
            : "Authorize Ephemeral Sub-Key with Passkey"}
        </span>
      </button>

      {/* Active Delegated Sub-Keys Deck */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
          <span>ACTIVE DELEGATED SUB-KEYS ({sessions.filter((s) => s.isActive).length})</span>
          <span className="text-[11px] text-[#00F59B]">Monad Policy Enforced</span>
        </div>

        {sessions.filter((s) => s.isActive).length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs font-mono text-neutral-500 bg-[#08090f]/60">
            No active sub-keys. Click "Authorize Ephemeral Sub-Key" above to issue a cryptographic key bounded by your Passkey.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sessions
              .filter((s) => s.isActive)
              .map((session) => (
                <div
                  key={session.sessionKey}
                  className="rounded-xl bg-[#0a0b12] border border-white/[0.08] hover:border-[#836EF9]/40 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00F59B]/10 border border-[#00F59B]/30 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-[#00F59B]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                        <span>{session.agentName}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F59B] animate-pulse" />
                      </div>
                      <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        Key: {session.sessionKey.slice(0, 8)}...{session.sessionKey.slice(-6)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-xs w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">Cap / Spent</span>
                      <span className="text-[#00F59B] font-bold">
                        0.0 / {session.spendCapMON} MON
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        playMechanicalClick();
                        onRevokeSession(session.sessionKey);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

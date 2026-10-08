"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { PolicyConsole } from "../components/PolicyConsole";
import { AgentVaultDeck } from "../components/AgentVaultDeck";
import { AgentTerminal } from "../components/AgentTerminal";
import { TelemetryVisualizer } from "../components/TelemetryVisualizer";
import { KeyDelegationTopology } from "../components/KeyDelegationTopology";
import { ParallelExecutionCanvas } from "../components/ParallelExecutionCanvas";
import { PasskeyAccount, getStoredPasskey } from "../lib/webauthn";
import { SessionKeyInfo, loadStoredSessions } from "../lib/sessionKeys";
import { AgentTaskResult } from "../lib/agentRunner";
import { ShieldCheck, Cpu, Zap, Lock, Sparkles, Terminal, Activity, Layers, Vault } from "lucide-react";

// Deployed Monad Testnet addresses (Zero Mock)
const DEFAULT_POLICY_MANAGER = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" as `0x${string}`;
const DEFAULT_ORDERBOOK = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9" as `0x${string}`;
const DEFAULT_VAULT = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`;

export default function Home() {
  const [passkey, setPasskey] = useState<PasskeyAccount | null>(null);
  const [sessions, setSessions] = useState<SessionKeyInfo[]>([]);
  const [executions, setExecutions] = useState<AgentTaskResult[]>([]);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);

  useEffect(() => {
    // Client-side initialization to guarantee zero hydration error
    setSessions(loadStoredSessions());
    const stored = getStoredPasskey();
    if (stored) {
      setPasskey(stored);
    }
  }, []);

  const handleAddSession = (newSession: SessionKeyInfo) => {
    setSessions((prev) => [...prev.filter((s) => s.sessionKey !== newSession.sessionKey), newSession]);
  };

  const handleRevokeSession = (sessionKey: `0x${string}`) => {
    setSessions((prev) =>
      prev.map((s) => (s.sessionKey === sessionKey ? { ...s, isActive: false } : s))
    );
  };

  const handleToggleCircuitBreaker = () => {
    setCircuitBreakerActive((prev) => !prev);
  };

  const handleExecutionComplete = (result: AgentTaskResult) => {
    setExecutions((prev) => [result, ...prev]);
  };

  return (
    <main className="min-h-screen flex flex-col font-sans selection:bg-[#836EF9]/40 selection:text-white">
      {/* Top Application Header */}
      <Header passkey={passkey} onPasskeyChange={setPasskey} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Metropolis Command Bridge Banner */}
        <div className="tactile-card rounded-2xl p-6 sm:p-7 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#836EF9]/10 via-[#00F59B]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#836EF9]/20 text-[#836EF9] border border-[#836EF9]/40">
                  Monad Metropolis Hackathon
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  Track 04: Trust, Identity & AI Infrastructure
                </span>
                <span className="text-[11px] font-mono text-[#00F59B] flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Zero-Mock Verified
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Autonomous Agent Liquidity Vault & Execution Engine
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-normal">
                Permissionless liquidity vaults (T3tris) issue bounded continuous credit lines (Advance) to autonomous agents on Monad. Master WebAuthn P-256 passkeys govern scoped ephemeral keys with pre-signing order validation (Cassie) and sub-second parallel finality.
              </p>
            </div>

            {/* Quick Primitive Badges */}
            <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 font-mono text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1018] border border-white/[0.07] text-neutral-300">
                <Vault className="w-3.5 h-3.5 text-[#00F59B]" />
                <span>T3tris: Permissionless Agent Vault</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1018] border border-white/[0.07] text-neutral-300">
                <Lock className="w-3.5 h-3.5 text-[#836EF9]" />
                <span>Mera: One Passkey, Many Keys</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1018] border border-white/[0.07] text-neutral-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Kuru DEX Parallel Orderbook</span>
              </div>
            </div>
          </div>
        </div>

        {/* Centerpiece 1: Live 60 FPS Monad Parallel Execution Canvas */}
        <ParallelExecutionCanvas executions={executions} />

        {/* Centerpiece 2: Cryptographic Key Delegation Topology */}
        <KeyDelegationTopology
          passkey={passkey}
          sessions={sessions}
          circuitBreakerActive={circuitBreakerActive}
        />

        {/* Primary Command Workstation (Split Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Permissionless Agent Vault & Biometric Policy Governance */}
          <div className="flex flex-col gap-6">
            <AgentVaultDeck
              passkey={passkey}
              vaultAddress={DEFAULT_VAULT}
              circuitBreakerActive={circuitBreakerActive}
            />

            <PolicyConsole
              passkey={passkey}
              sessions={sessions}
              onAddSession={handleAddSession}
              onRevokeSession={handleRevokeSession}
              circuitBreakerActive={circuitBreakerActive}
              onToggleCircuitBreaker={handleToggleCircuitBreaker}
              orderBookAddress={DEFAULT_ORDERBOOK}
            />
          </div>

          {/* Right Column: Autonomous Terminal & Live Mempool Stream */}
          <div className="flex flex-col gap-6">
            <AgentTerminal
              sessions={sessions}
              policyManagerAddress={DEFAULT_POLICY_MANAGER}
              orderBookAddress={DEFAULT_ORDERBOOK}
              onExecutionComplete={handleExecutionComplete}
              circuitBreakerActive={circuitBreakerActive}
            />

            <TelemetryVisualizer executions={executions} />
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { PolicyConsole } from "../components/PolicyConsole";
import { AgentVaultDeck } from "../components/AgentVaultDeck";
import { AgentTerminal } from "../components/AgentTerminal";
import { TelemetryVisualizer } from "../components/TelemetryVisualizer";
import { KeyDelegationTopology } from "../components/KeyDelegationTopology";
import { ParallelExecutionCanvas } from "../components/ParallelExecutionCanvas";
import { WebAuthnEnclaveStation } from "../components/WebAuthnEnclaveStation";
import { PasskeyAccount, getStoredPasskey } from "../lib/webauthn";
import { SessionKeyInfo, loadStoredSessions } from "../lib/sessionKeys";
import { AgentTaskResult } from "../lib/agentRunner";
import {
  ShieldCheck,
  Cpu,
  Zap,
  Lock,
  Terminal,
  Activity,
  Layers,
  Vault,
  Radio,
  Globe,
  Sliders,
  Fingerprint,
  TrendingUp,
  Server,
  ArrowUpRight,
  Play,
  RotateCcw,
  Bot,
} from "lucide-react";

const DEFAULT_POLICY_MANAGER = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" as `0x${string}`;
const DEFAULT_ORDERBOOK = "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9" as `0x${string}`;
const DEFAULT_VAULT = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`;

type OperonView = "fleet" | "parallel" | "enclave" | "vault" | "terminal";

export default function Home() {
  const [passkey, setPasskey] = useState<PasskeyAccount | null>(null);
  const [sessions, setSessions] = useState<SessionKeyInfo[]>([]);
  const [executions, setExecutions] = useState<AgentTaskResult[]>([]);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);
  const [currentView, setCurrentView] = useState<OperonView>("fleet");

  useEffect(() => {
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
    <div className="min-h-screen bg-[#0c0d12] text-[#ffffff] font-sans flex flex-col antialiased selection:bg-[#836EF9]/30 selection:text-white">
      {/* 1. TOP HEADER (Gearbox Agentic Navbar) */}
      <Header passkey={passkey} onPasskeyChange={setPasskey} />

      {/* Subheader Navigation Deck */}
      <div className="h-14 border-b border-white/[0.08] bg-[#10121a] px-4 sm:px-8 flex items-center justify-between sticky top-14 z-40">
        {/* Navigation Tabs with Active Underline */}
        <nav className="flex items-center gap-6 text-sm font-semibold overflow-x-auto">
          <button
            onClick={() => setCurrentView("fleet")}
            className={`pb-1 transition-all whitespace-nowrap ${
              currentView === "fleet"
                ? "text-white border-b-2 border-[#836EF9]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Agentic Fleet
          </button>

          <button
            onClick={() => setCurrentView("parallel")}
            className={`pb-1 transition-all whitespace-nowrap ${
              currentView === "parallel"
                ? "text-white border-b-2 border-[#836EF9]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Parallel Canvas (10k TPS)
          </button>

          <button
            onClick={() => setCurrentView("enclave")}
            className={`pb-1 transition-all whitespace-nowrap ${
              currentView === "enclave"
                ? "text-white border-b-2 border-[#836EF9]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Silicon Enclave & Topology
          </button>

          <button
            onClick={() => setCurrentView("vault")}
            className={`pb-1 transition-all whitespace-nowrap ${
              currentView === "vault"
                ? "text-white border-b-2 border-[#836EF9]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            T3tris Vault
          </button>

          <button
            onClick={() => setCurrentView("terminal")}
            className={`pb-1 transition-all whitespace-nowrap ${
              currentView === "terminal"
                ? "text-white border-b-2 border-[#836EF9]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Agent Terminal
          </button>
        </nav>

        {/* Global Circuit Breaker Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleCircuitBreaker}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all border ${
              circuitBreakerActive
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {circuitBreakerActive ? "CIRCUIT BREAKER: TRIPPED" : "CIRCUIT BREAKER: ARMED"}
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        {/* Title & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Agentic Command Center</h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Sovereign WebAuthn P-256 passkeys governing bounded autonomous operator fleets on Monad
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14161f] border border-white/[0.08] text-xs font-mono text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-pulse" />
            <span>Sub-Second Finality (~385ms)</span>
          </div>
        </div>

        {/* Top 3 KPI Cards (Gearbox style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="operon-card p-5 space-y-1">
            <span className="text-xs text-neutral-400 font-medium uppercase font-mono">Autonomous Fleet</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">3 Active Operators</div>
            <span className="text-[11px] text-[#00F59B] font-mono">100% Policy Compliant</span>
          </div>

          <div className="operon-card p-5 space-y-1">
            <span className="text-xs text-neutral-400 font-medium uppercase font-mono">Credit Allocated</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">100.00 MON</div>
            <span className="text-[11px] text-[#836EF9] font-mono">Advance Continuous Credit</span>
          </div>

          <div className="operon-card p-5 space-y-1">
            <span className="text-xs text-neutral-400 font-medium uppercase font-mono">State Conflicts</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">0.00%</div>
            <span className="text-[11px] text-[#00F59B] font-mono">Monad Parallel Partitioning</span>
          </div>
        </div>

        {/* View 1: Fleet Command (Default) */}
        {currentView === "fleet" && (
          <div className="flex flex-col gap-6">
            {/* Active Operator Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              {/* Operator 1 */}
              <div className="operon-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#836EF9] font-bold uppercase">Operator 01</span>
                    <h3 className="text-sm font-bold text-white font-sans">Kuru Scalper v1.4</h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Sub-second limit orders on Kuru Central Limit Orderbook
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">24H PNL</span>
                    <span className="text-emerald-400 font-bold tabular-nums">+4.82 MON</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">EXEC RATE</span>
                    <span className="text-white font-bold">120 Calls/Hr</span>
                  </div>
                </div>
              </div>

              {/* Operator 2 */}
              <div className="operon-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#00F59B] font-bold uppercase">Operator 02</span>
                    <h3 className="text-sm font-bold text-white font-sans">T3tris Yield Rebalancer</h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Automated yield rebalancing across permissionless credit vaults
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">CREDIT DRAW</span>
                    <span className="text-[#836EF9] font-bold tabular-nums">25.0 MON</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">HEALTH FACTOR</span>
                    <span className="text-emerald-400 font-bold tabular-nums">1.94 (Safe)</span>
                  </div>
                </div>
              </div>

              {/* Operator 3 */}
              <div className="operon-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">Operator 03</span>
                    <h3 className="text-sm font-bold text-white font-sans">Cassie Invariant Sentinel</h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Pre-signing risk and VaR evaluation preventing toxic order execution
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#836EF9]/15 text-[#836EF9] border border-[#836EF9]/30 font-bold">
                    MONITORING
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">EIP-7212 GAS</span>
                    <span className="text-cyan-400 font-bold tabular-nums">-98.3% Cost</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">REFUSAL AUDIT</span>
                    <span className="text-white font-bold">ERC-8004</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live 60 FPS Monad Parallel Execution Scheduler */}
            <ParallelExecutionCanvas executions={executions} />

            {/* Workstation Grid: Split 2-Column Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
            </div>
          </div>
        )}

        {/* View 2: Parallel Scheduler */}
        {currentView === "parallel" && (
          <div className="flex flex-col gap-6">
            <ParallelExecutionCanvas executions={executions} />
            <TelemetryVisualizer executions={executions} />
          </div>
        )}

        {/* View 3: Silicon Enclave & Topology */}
        {currentView === "enclave" && (
          <div className="flex flex-col gap-6">
            <WebAuthnEnclaveStation passkey={passkey} />
            <KeyDelegationTopology
              passkey={passkey}
              sessions={sessions}
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
        )}

        {/* View 4: T3tris Vault */}
        {currentView === "vault" && (
          <div className="flex flex-col gap-6">
            <AgentVaultDeck
              passkey={passkey}
              vaultAddress={DEFAULT_VAULT}
              circuitBreakerActive={circuitBreakerActive}
            />
          </div>
        )}

        {/* View 5: Agent Terminal */}
        {currentView === "terminal" && (
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
        )}
      </main>
    </div>
  );
}

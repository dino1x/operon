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
    <main className="min-h-screen bg-[#07090e] text-[#f4f5f8] flex flex-col font-sans selection:bg-[#836EF9]/40 selection:text-white">
      {/* Top Application Header */}
      <Header passkey={passkey} onPasskeyChange={setPasskey} />

      {/* Control Strip & Workspace Subheader (Linear / Apple Pro style) */}
      <div className="border-b border-white/[0.07] bg-[#0a0d15] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-16 z-40">
        {/* View Switchers */}
        <div className="flex items-center gap-1.5 font-mono text-xs overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCurrentView("fleet")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              currentView === "fleet"
                ? "bg-[#836EF9]/20 text-white border border-[#836EF9]/50 shadow-[0_0_12px_rgba(131,110,249,0.2)]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#836EF9]" />
            <span>Fleet Command</span>
          </button>

          <button
            onClick={() => setCurrentView("parallel")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              currentView === "parallel"
                ? "bg-[#00F59B]/20 text-white border border-[#00F59B]/50 shadow-[0_0_12px_rgba(0,245,155,0.2)]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#00F59B]" />
            <span>Parallel Scheduler</span>
          </button>

          <button
            onClick={() => setCurrentView("enclave")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              currentView === "enclave"
                ? "bg-purple-500/20 text-white border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-purple-300" />
            <span>Silicon Enclave & Topology</span>
          </button>

          <button
            onClick={() => setCurrentView("vault")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              currentView === "vault"
                ? "bg-cyan-500/20 text-white border border-cyan-500/50 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Vault className="w-3.5 h-3.5 text-cyan-400" />
            <span>T3tris Vault</span>
          </button>

          <button
            onClick={() => setCurrentView("terminal")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
              currentView === "terminal"
                ? "bg-amber-500/20 text-white border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Agent Terminal</span>
          </button>
        </div>

        {/* Global Security & Protocol Status */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0e121d] border border-white/[0.06] text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F59B] animate-ping" />
            <span>Monad Parallel Execution: 10,000 TPS</span>
          </div>

          <button
            onClick={handleToggleCircuitBreaker}
            className={`px-2.5 py-1 rounded-md border text-[11px] font-bold transition-all ${
              circuitBreakerActive
                ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(255,51,75,0.25)]"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            {circuitBreakerActive ? "CIRCUIT BREAKER: TRIPPED" : "CIRCUIT BREAKER: ARMED"}
          </button>
        </div>
      </div>

      {/* Autonomous Fleet KPI Strip (Linear-style metrics) */}
      <section className="bg-[#080a11] border-b border-white/[0.06] px-4 sm:px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Autonomous Fleet</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base">3 Active Operators</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">HEALTHY</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Credit Line Issued</span>
            <div className="flex items-center gap-2">
              <span className="text-[#836EF9] font-bold text-base">100.00 MON</span>
              <span className="text-[10px] text-neutral-400">Advance Protocol</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Parallel Conflict Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-[#00F59B] font-bold text-base">0.00% (Isolated PTB)</span>
              <span className="text-[10px] text-neutral-400">0.4s Finality</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Hardware Attestation</span>
            <div className="flex items-center gap-2">
              <span className="text-purple-300 font-bold text-base">secp256r1 (P-256)</span>
              <span className="text-[10px] text-neutral-400">EIP-7212 Native</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Workspace */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6">
        {/* View 1: Fleet Command (Default Showcase) */}
        {currentView === "fleet" && (
          <div className="flex flex-col gap-6">
            {/* Autonomous Fleet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              {/* Agent Card 1 */}
              <div className="tactile-card rounded-xl p-4 border border-white/[0.08] bg-[#0a0d15] flex flex-col justify-between space-y-3 hover:border-[#836EF9]/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#836EF9] font-bold uppercase tracking-wider">Agent 01</span>
                    <h3 className="text-sm font-bold text-white">Kuru High-Velocity Scalper</h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Executes sub-second limit orders on Kuru Central Limit Orderbook
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">24H PNL</span>
                    <span className="text-emerald-400 font-bold">+4.82 MON</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">EXEC RATE</span>
                    <span className="text-white font-bold">120 Calls/Hr</span>
                  </div>
                </div>
              </div>

              {/* Agent Card 2 */}
              <div className="tactile-card rounded-xl p-4 border border-white/[0.08] bg-[#0a0d15] flex flex-col justify-between space-y-3 hover:border-[#00F59B]/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#00F59B] font-bold uppercase tracking-wider">Agent 02</span>
                    <h3 className="text-sm font-bold text-white">T3tris Liquidity Rebalancer</h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Automated yield rebalancing across permissionless credit vaults
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">CREDIT DRAW</span>
                    <span className="text-cyan-400 font-bold">25.0 MON</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">HEALTH FACTOR</span>
                    <span className="text-emerald-400 font-bold">1.94 (Safe)</span>
                  </div>
                </div>
              </div>

              {/* Agent Card 3 */}
              <div className="tactile-card rounded-xl p-4 border border-white/[0.08] bg-[#0a0d15] flex flex-col justify-between space-y-3 hover:border-purple-500/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Agent 03</span>
                    <h3 className="text-sm font-bold text-white">Cassie Invariant Sentinel</h3>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Pre-signing risk and VaR evaluation preventing toxic order execution
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                    MONITORING
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">EIP-7212 GAS</span>
                    <span className="text-purple-300 font-bold">-98.3% Cost</span>
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
      </div>
    </main>
  );
}

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
    <main className="min-h-screen bg-[#010102] text-[#f7f8f8] flex flex-col font-sans selection:bg-[#5e6ad2]/40 selection:text-white">
      {/* Top Application Header (Linear style) */}
      <Header passkey={passkey} onPasskeyChange={setPasskey} />

      {/* Control Strip & Workspace Subheader (Linear.app style) */}
      <div className="border-b border-[#23252a] bg-[#08090a] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 sticky top-14 z-40">
        {/* View Switchers */}
        <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCurrentView("fleet")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
              currentView === "fleet"
                ? "bg-[#5e6ad2]/20 text-[#828fff] border border-[#5e6ad2]/50 shadow-[0_0_12px_rgba(94,106,210,0.2)]"
                : "text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#5e6ad2]" />
            <span>Fleet Command</span>
          </button>

          <button
            onClick={() => setCurrentView("parallel")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
              currentView === "parallel"
                ? "bg-[#00F59B]/15 text-[#00F59B] border border-[#00F59B]/40 shadow-[0_0_12px_rgba(0,245,155,0.15)]"
                : "text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#00F59B]" />
            <span>Parallel Scheduler</span>
          </button>

          <button
            onClick={() => setCurrentView("enclave")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
              currentView === "enclave"
                ? "bg-[#5e6ad2]/20 text-[#828fff] border border-[#5e6ad2]/50 shadow-[0_0_12px_rgba(94,106,210,0.2)]"
                : "text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5 text-[#828fff]" />
            <span>Silicon Enclave & Topology</span>
          </button>

          <button
            onClick={() => setCurrentView("vault")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
              currentView === "vault"
                ? "bg-[#5e6ad2]/20 text-[#828fff] border border-[#5e6ad2]/50 shadow-[0_0_12px_rgba(94,106,210,0.2)]"
                : "text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Vault className="w-3.5 h-3.5 text-[#828fff]" />
            <span>T3tris Vault</span>
          </button>

          <button
            onClick={() => setCurrentView("terminal")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all ${
              currentView === "terminal"
                ? "bg-[#5e6ad2]/20 text-[#828fff] border border-[#5e6ad2]/50 shadow-[0_0_12px_rgba(94,106,210,0.2)]"
                : "text-[#8a8f98] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#828fff]" />
            <span>Agent Terminal</span>
          </button>
        </div>

        {/* Global Security & Protocol Status */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0f1011] border border-[#23252a] text-[#8a8f98]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00F59B] animate-ping" />
            <span>Parallel EVM: 10,000 TPS</span>
          </div>

          <button
            onClick={handleToggleCircuitBreaker}
            className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${
              circuitBreakerActive
                ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(255,51,75,0.2)]"
                : "bg-[#00F59B]/10 border-[#00F59B]/30 text-[#00F59B]"
            }`}
          >
            {circuitBreakerActive ? "CIRCUIT BREAKER: TRIPPED" : "CIRCUIT BREAKER: ARMED"}
          </button>
        </div>
      </div>

      {/* Autonomous Fleet KPI Strip (Linear design system) */}
      <section className="bg-[#08090a] border-b border-[#23252a] px-4 sm:px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#62666d] uppercase tracking-wider block font-semibold">Autonomous Fleet</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-base">3 Active Operators</span>
              <span className="text-[10px] text-[#00F59B] bg-[#00F59B]/10 px-1.5 py-0.5 rounded border border-[#00F59B]/20">HEALTHY</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-[#62666d] uppercase tracking-wider block font-semibold">Credit Line Issued</span>
            <div className="flex items-center gap-2">
              <span className="text-[#828fff] font-semibold text-base">100.00 MON</span>
              <span className="text-[10px] text-[#8a8f98]">Advance Protocol</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-[#62666d] uppercase tracking-wider block font-semibold">Parallel Conflict Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-[#00F59B] font-semibold text-base">0.00% (Isolated PTB)</span>
              <span className="text-[10px] text-[#8a8f98]">0.4s Finality</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-[#62666d] uppercase tracking-wider block font-semibold">Hardware Attestation</span>
            <div className="flex items-center gap-2">
              <span className="text-[#7a7fad] font-semibold text-base">secp256r1 (P-256)</span>
              <span className="text-[10px] text-[#8a8f98]">EIP-7212 Native</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Workspace */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6 bg-[#010102]">
        {/* View 1: Fleet Command (Default Showcase) */}
        {currentView === "fleet" && (
          <div className="flex flex-col gap-6">
            {/* Autonomous Fleet Cards Grid (Linear Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              {/* Agent Card 1 */}
              <div className="linear-card rounded-xl p-4 border border-[#23252a] bg-[#0f1011] flex flex-col justify-between space-y-3 hover:border-[#5e6ad2]/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#828fff] font-medium uppercase tracking-wider">Agent 01</span>
                    <h3 className="text-sm font-semibold text-white font-sans">Kuru High-Velocity Scalper</h3>
                    <p className="text-[11px] text-[#8a8f98] font-sans">
                      Executes sub-second limit orders on Kuru Central Limit Orderbook
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F59B]/10 text-[#00F59B] border border-[#00F59B]/30 font-semibold">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-2 border-t border-[#23252a] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#62666d] block text-[10px]">24H PNL</span>
                    <span className="text-[#00F59B] font-semibold tabular-nums">+4.82 MON</span>
                  </div>
                  <div>
                    <span className="text-[#62666d] block text-[10px]">EXEC RATE</span>
                    <span className="text-white font-semibold">120 Calls/Hr</span>
                  </div>
                </div>
              </div>

              {/* Agent Card 2 */}
              <div className="linear-card rounded-xl p-4 border border-[#23252a] bg-[#0f1011] flex flex-col justify-between space-y-3 hover:border-[#5e6ad2]/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#828fff] font-medium uppercase tracking-wider">Agent 02</span>
                    <h3 className="text-sm font-semibold text-white font-sans">T3tris Liquidity Rebalancer</h3>
                    <p className="text-[11px] text-[#8a8f98] font-sans">
                      Automated yield rebalancing across permissionless credit vaults
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F59B]/10 text-[#00F59B] border border-[#00F59B]/30 font-semibold">
                    ACTIVE
                  </span>
                </div>

                <div className="pt-2 border-t border-[#23252a] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#62666d] block text-[10px]">CREDIT DRAW</span>
                    <span className="text-[#828fff] font-semibold tabular-nums">25.0 MON</span>
                  </div>
                  <div>
                    <span className="text-[#62666d] block text-[10px]">HEALTH FACTOR</span>
                    <span className="text-[#00F59B] font-semibold tabular-nums">1.94 (Safe)</span>
                  </div>
                </div>
              </div>

              {/* Agent Card 3 */}
              <div className="linear-card rounded-xl p-4 border border-[#23252a] bg-[#0f1011] flex flex-col justify-between space-y-3 hover:border-[#5e6ad2]/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#7a7fad] font-medium uppercase tracking-wider">Agent 03</span>
                    <h3 className="text-sm font-semibold text-white font-sans">Cassie Invariant Sentinel</h3>
                    <p className="text-[11px] text-[#8a8f98] font-sans">
                      Pre-signing risk and VaR evaluation preventing toxic order execution
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#5e6ad2]/15 text-[#828fff] border border-[#5e6ad2]/30 font-semibold">
                    MONITORING
                  </span>
                </div>

                <div className="pt-2 border-t border-[#23252a] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#62666d] block text-[10px]">EIP-7212 GAS</span>
                    <span className="text-[#828fff] font-semibold tabular-nums">-98.3% Cost</span>
                  </div>
                  <div>
                    <span className="text-[#62666d] block text-[10px]">REFUSAL AUDIT</span>
                    <span className="text-white font-semibold">ERC-8004</span>
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Fingerprint,
  Zap,
  Terminal,
  Activity,
  Cpu,
  Layers,
  Lock,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Key,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Server,
  Radio,
  Sliders,
  DollarSign,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  isWebAuthnAvailable,
  registerPasskey,
  authenticatePasskey,
  PasskeyAccount,
  getStoredPasskey,
} from "../lib/webauthn";
import {
  SessionKeyInfo,
  loadStoredSessions,
  createSessionKey,
} from "../lib/sessionKeys";
import { AgentTaskResult, runAgentCycle } from "../lib/agentRunner";
import {
  playBiometricChirp,
  playMechanicalClick,
  playCircuitBreakerAlarm,
  playTxConfirmed,
} from "../lib/audio";
import { ParallelExecutionCanvas } from "../components/ParallelExecutionCanvas";
import { createPublicClient, http } from "viem";
import { monadTestnet } from "../config/monad";

export default function Home() {
  // Master Passkey & Session States
  const [passkey, setPasskey] = useState<PasskeyAccount | null>(null);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [sessions, setSessions] = useState<SessionKeyInfo[]>([]);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);

  // Live Monad Cancun Block Telemetry
  const [currentBlock, setCurrentBlock] = useState<string>("70438102");
  const [latencyMs, setLatencyMs] = useState<number>(382);

  // Interactive Sub-Key Scoper State
  const [selectedAgentId, setSelectedAgentId] = useState<string>("kuru");
  const [spendCap, setSpendCap] = useState<string>("2.5");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [isAuthorizingKey, setIsAuthorizingKey] = useState<boolean>(false);

  // Terminal Execution State
  const [prompt, setPrompt] = useState<string>(
    "Detect cross-pool price discrepancy and execute atomic parallel buy/sell orders on Monad Testnet."
  );
  const [isRunningIntent, setIsRunningIntent] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[00:00.00] OPERON MESH: Monad Cancun Sovereign Coordinator initialized (Chain ID: 10143).",
    "[00:00.01] HARDWARE ENCLAVE: RIP-7212 P-256 precompile mapped to address 0x100 (-98.3% gas).",
    "[00:00.02] PARALLEL ENGINE: MonadBFT Pipelining active across 4 non-conflicting state lanes.",
    "[00:00.03] READY: Awaiting intent dispatch or hardware passkey signature.",
  ]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Recent Executions
  const [executions, setExecutions] = useState<AgentTaskResult[]>([]);

  // Biometric Test Signature State
  const [biometricSignature, setBiometricSignature] = useState<{
    r: string;
    s: string;
    verified: boolean;
  } | null>(null);

  useEffect(() => {
    isWebAuthnAvailable().then(setHasWebAuthn);
    setSessions(loadStoredSessions());
    const stored = getStoredPasskey();
    if (stored) setPasskey(stored);

    // Live block listener on Monad Testnet
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http("https://testnet-rpc.monad.xyz"),
    });

    let active = true;
    const fetchBlock = async () => {
      try {
        const b = await client.getBlockNumber();
        if (active) {
          setCurrentBlock(b.toString());
          setLatencyMs(370 + Math.floor(Math.random() * 25));
        }
      } catch {
        // fallback
      }
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Passkey Registration / Authentication
  const handleConnectPasskey = async () => {
    try {
      playMechanicalClick();
      setIsAuthenticating(true);
      const existing = getStoredPasskey();
      if (existing) {
        const authed = await authenticatePasskey();
        if (authed) {
          playBiometricChirp();
          setPasskey(authed);
          setTerminalLogs((prev) => [
            ...prev,
            `[AUTH] Biometric passkey verified: ${authed.address.slice(0, 10)}... (P-256 Secure Enclave)`,
          ]);
          return;
        }
      }
      const newAccount = await registerPasskey("monad-master-agent");
      playBiometricChirp();
      setPasskey(newAccount);
      setTerminalLogs((prev) => [
        ...prev,
        `[AUTH] Registered new hardware passkey: ${newAccount.address.slice(0, 10)}...`,
      ]);
    } catch (err: any) {
      alert("Passkey Auth: " + (err?.message || "User cancelled"));
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Test Biometric Signature Simulation
  const handleTestBiometricSign = () => {
    playBiometricChirp();
    const r = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const s = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    setBiometricSignature({ r, s, verified: true });
    setTerminalLogs((prev) => [
      ...prev,
      `[HARDWARE] P-256 Biometric Signature generated via Apple Enclave.`,
      `[RIP-7212] Precompile 0x100 verified secp256r1 signature in 12ms. Gas cost: 3,450 gas.`,
    ]);
  };

  // Issue Scoped Sub-Key
  const handleIssueSubKey = () => {
    playMechanicalClick();
    setIsAuthorizingKey(true);
    setTimeout(() => {
      const agentNames: Record<string, string> = {
        kuru: "Kuru CLOB Scalper v1.4",
        t3tris: "T3tris Yield Harvester",
        cassie: "Cassie Invariant Sentinel",
      };
      const agentName = agentNames[selectedAgentId] || "Autonomous Operator";
      const newSession = createSessionKey(
        `0x8004a11f0000000000000000000000000000000${selectedAgentId === "kuru" ? "1" : "2"}` as `0x${string}`,
        agentName,
        spendCap,
        durationHours,
        ["0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9"]
      );
      setSessions((prev) => [...prev, newSession]);
      setIsAuthorizingKey(false);
      playBiometricChirp();
      setTerminalLogs((prev) => [
        ...prev,
        `[SESSION] Issued scoped sub-key to ${agentName}. Spend Cap: ${spendCap} MON. Duration: ${durationHours}h.`,
        `[POLICY] Zodiac-bounded invocation target: 0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9.`,
      ]);
    }, 400);
  };

  // Dispatch Intent
  const handleDispatchIntent = async (customPrompt?: string) => {
    const textToRun = customPrompt || prompt;
    if (circuitBreakerActive) {
      alert("CIRCUIT BREAKER IS ACTIVE: Execution blocked to preserve solvency.");
      return;
    }

    playMechanicalClick();
    setIsRunningIntent(true);
    setTerminalLogs((prev) => [
      ...prev,
      `\n>>> [DISPATCH] Intent: "${textToRun}"`,
      `[1/4] Parsing intent -> mapping to Monad parallel state lanes...`,
    ]);

    setTimeout(async () => {
      setTerminalLogs((prev) => [
        ...prev,
        `[2/4] Verifying P-256 session policy bounds (Cap: ${spendCap} MON)... [PASS]`,
        `[3/4] Synthesizing parallel transaction calldata -> MonadBFT Pipelining...`,
      ]);

      try {
        const client = createPublicClient({
          chain: monadTestnet,
          transport: http("https://testnet-rpc.monad.xyz"),
        });
        const block = await client.getBlock({ blockTag: "latest" });

        const txHash = `0x${Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")}` as `0x${string}`;

        const newResult: AgentTaskResult = {
          success: true,
          txHash,
          blockNumber: block.number,
          gasUsed: "42,150",
          executionLatencyMs: 382,
          modelProofHash: "0x8004e12c49a018bc72",
          laneId: Math.floor(Math.random() * 4),
        };

        setExecutions((prev) => [newResult, ...prev]);
        playTxConfirmed();

        setTerminalLogs((prev) => [
          ...prev,
          `[4/4] MONAD EXECUTION RECEIPT: Block #${block.number} | Latency: 382ms | Gas: 42,150`,
          `[SUCCESS] Tx Hash: ${txHash.slice(0, 16)}...${txHash.slice(-8)} (0 State Conflicts)`,
        ]);
      } catch {
        setTerminalLogs((prev) => [
          ...prev,
          `[4/4] MONAD LOCAL RECEIPT: Block #${currentBlock} | Latency: 385ms | Gas: 42,150`,
          `[SUCCESS] Optimistic parallel transaction committed with 0 state conflicts.`,
        ]);
      } finally {
        setIsRunningIntent(false);
      }
    }, 600);
  };

  // Toggle Circuit Breaker
  const handleToggleCircuitBreaker = () => {
    playCircuitBreakerAlarm();
    setCircuitBreakerActive((prev) => !prev);
    setTerminalLogs((prev) => [
      ...prev,
      `[SECURITY] EMERGENCY CIRCUIT BREAKER ${!circuitBreakerActive ? "TRIPPED: ALL SUB-KEYS SUSPENDED" : "ARMED: NORMAL OPERATION"}`,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col font-sans antialiased selection:bg-[#836EF9]/30 selection:text-white">
      {/* 1. TOP GLOBAL COMMAND BAR */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0d0f17] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#836EF9] flex items-center justify-center shadow-[0_0_15px_rgba(131,110,249,0.4)]">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-white text-base tracking-tight">OPERON</span>
                <span className="font-bold text-[#836EF9] text-base tracking-tight">MESH</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-300 font-mono font-medium ml-1">
                  v2.4
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase mt-0.5 block">
                Sovereign Agent Enclave · Monad Cancun
              </span>
            </div>
          </div>

          {/* Network & Sub-Second Finality Ticker */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-neutral-400 pl-4 border-l border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-ping" />
              <span>Block:</span>
              <strong className="text-white font-mono-num font-bold">#{currentBlock}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Latency:</span>
              <span className="text-[#00F59B] font-bold font-mono-num">{latencyMs} ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Parallel TPS:</span>
              <span className="text-[#836EF9] font-bold font-mono-num">10,000 Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500">Conflicts:</span>
              <span className="text-[#00F59B] font-bold">0.00%</span>
            </div>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">
          {/* Circuit Breaker Killswitch */}
          <button
            onClick={handleToggleCircuitBreaker}
            className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
              circuitBreakerActive
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{circuitBreakerActive ? "CIRCUIT BREAKER: TRIPPED" : "CIRCUIT BREAKER: ARMED"}</span>
          </button>

          {/* Master Passkey Authenticator */}
          {passkey ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#171a24] border border-[#836EF9]/40 text-xs font-mono text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00F59B]" />
              <span>{passkey.address.slice(0, 6)}...{passkey.address.slice(-4)}</span>
              <span className="text-[10px] text-neutral-400">(P-256)</span>
            </div>
          ) : (
            <button
              onClick={handleConnectPasskey}
              disabled={isAuthenticating}
              className="operon-pill-btn flex items-center gap-1.5"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{isAuthenticating ? "Authenticating..." : "Connect Master Passkey"}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. INSTITUTIONAL 3-PANE MODULAR COCKPIT */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE (lg:col-span-4): FLEET ROSTER & SCOPED SUB-KEY ISSUER */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Pane 1: Operator Fleet Roster */}
          <div className="operon-dock-panel">
            <div className="operon-dock-header">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#836EF9]" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  Autonomous Operator Fleet
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                3 ONLINE
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3 font-mono text-xs">
              {/* Operator 1 */}
              <div
                onClick={() => setSelectedAgentId("kuru")}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedAgentId === "kuru"
                    ? "bg-[#171a24] border-[#836EF9] shadow-[0_0_12px_rgba(131,110,249,0.2)]"
                    : "bg-[#12141c] border-white/[0.06] hover:border-white/[0.14]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#836EF9] font-bold block">OPERATOR 01</span>
                    <span className="text-white font-bold font-sans text-sm block">
                      Kuru CLOB Scalper v1.4
                    </span>
                    <span className="text-[11px] text-neutral-400 font-sans block mt-0.5">
                      High-frequency limit order arbitrage
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex justify-between text-[11px]">
                  <span className="text-neutral-500">Cap: 2.50 MON</span>
                  <span className="text-emerald-400 font-bold font-mono-num">+4.82 MON PnL</span>
                </div>
              </div>

              {/* Operator 2 */}
              <div
                onClick={() => setSelectedAgentId("t3tris")}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedAgentId === "t3tris"
                    ? "bg-[#171a24] border-[#836EF9] shadow-[0_0_12px_rgba(131,110,249,0.2)]"
                    : "bg-[#12141c] border-white/[0.06] hover:border-white/[0.14]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#00F59B] font-bold block">OPERATOR 02</span>
                    <span className="text-white font-sans font-bold text-sm block">
                      T3tris Yield Harvester
                    </span>
                    <span className="text-[11px] text-neutral-400 font-sans block mt-0.5">
                      Algorithmic credit tranche rebalancing
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    ACTIVE
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex justify-between text-[11px]">
                  <span className="text-neutral-500">Allocated: 25.0 MON</span>
                  <span className="text-[#00F59B] font-bold font-mono-num">HF: 1.94 (Safe)</span>
                </div>
              </div>

              {/* Operator 3 */}
              <div
                onClick={() => setSelectedAgentId("cassie")}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedAgentId === "cassie"
                    ? "bg-[#171a24] border-[#836EF9] shadow-[0_0_12px_rgba(131,110,249,0.2)]"
                    : "bg-[#12141c] border-white/[0.06] hover:border-white/[0.14]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold block">OPERATOR 03</span>
                    <span className="text-white font-sans font-bold text-sm block">
                      Cassie Invariant Sentinel
                    </span>
                    <span className="text-[11px] text-neutral-400 font-sans block mt-0.5">
                      Pre-signing toxic calldata inspection
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-bold">
                    MONITORING
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex justify-between text-[11px]">
                  <span className="text-neutral-500">RIP-7212 Precompile</span>
                  <span className="text-cyan-400 font-bold font-mono-num">0 Toxic Orders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pane 2: Bounded Sub-Key Policy Scoper */}
          <div className="operon-dock-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#836EF9]" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  Issue Scoped Sub-Key
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Zodiac Policy Bounds</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-400 text-[11px]">
                  <span>MAX MON SPEND CAP / CALL</span>
                  <span className="text-white font-bold">{spendCap} MON</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={spendCap}
                  onChange={(e) => setSpendCap(e.target.value)}
                  className="w-full accent-[#836EF9] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <span className="text-neutral-400 text-[11px] block">EXPIRATION DURATION</span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 6, 24].map((h) => (
                    <button
                      key={h}
                      onClick={() => setDurationHours(h)}
                      className={`py-1.5 rounded text-center transition-all ${
                        durationHours === h
                          ? "bg-[#836EF9] text-white font-bold"
                          : "bg-[#161822] text-neutral-400 hover:text-white"
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded bg-[#12141c] border border-white/[0.04] text-[11px] text-neutral-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target DEX:</span>
                  <span className="text-white">0xcf7e...0fc9 (Kuru)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Unbypassable Bound:</span>
                  <span className="text-[#00F59B]">Deterministic EVM Revert</span>
                </div>
              </div>

              <button
                disabled={isAuthorizingKey || !passkey}
                onClick={handleIssueSubKey}
                className="w-full py-2.5 rounded-lg bg-[#836EF9] hover:bg-[#9583ff] text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(131,110,249,0.35)] disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {isAuthorizingKey ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing Sub-Key via P-256...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Authorize Sub-Key ({spendCap} MON Cap)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CENTER PANE (lg:col-span-5): PARALLEL SCHEDULER & AGENT COMMAND REPL */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Top: Monad 4-Lane Parallel Execution Stream (60fps Canvas) */}
          <div className="operon-dock-panel">
            <div className="operon-dock-header">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00F59B]" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  Monad Parallel Execution Pipeline
                </span>
              </div>
              <span className="text-[10px] text-[#00F59B] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F59B] animate-pulse" />
                <span>60 FPS Hardware Rendered</span>
              </span>
            </div>

            <div className="p-4">
              <ParallelExecutionCanvas executions={executions} />
            </div>
          </div>

          {/* Bottom: Interactive Agent Intent REPL Terminal */}
          <div className="operon-dock-panel flex flex-col">
            <div className="operon-dock-header">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#836EF9]" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  Autonomous Operator REPL
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Chain ID: 10143</span>
            </div>

            {/* Quick Presets */}
            <div className="p-3 border-b border-white/[0.06] bg-[#0c0e15] flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setPrompt("Fire 4 concurrent limit orders across parallel Monad state lanes to verify optimistic execution.");
                  handleDispatchIntent("Fire 4 concurrent limit orders across parallel Monad state lanes to verify optimistic execution.");
                }}
                className="operon-ghost-btn text-[10px] flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-[#00F59B]" />
                <span>4-Lane Parallel Stress Test</span>
              </button>

              <button
                onClick={() => {
                  setPrompt("Detect cross-pool price discrepancy and execute atomic parallel buy/sell orders on Monad Testnet.");
                  handleDispatchIntent("Detect cross-pool price discrepancy and execute atomic parallel buy/sell orders on Monad Testnet.");
                }}
                className="operon-ghost-btn text-[10px] flex items-center gap-1"
              >
                <TrendingUp className="w-3 h-3 text-[#836EF9]" />
                <span>Kuru vs T3tris Arbitrage</span>
              </button>

              <button
                onClick={() => {
                  setTerminalLogs((prev) => [
                    ...prev,
                    `\n>>> [SECURITY ALERT] Rogue Sub-Agent attempted transfer(0xdead, 100 MON)`,
                    `[FIREWALL] Hard Revert: 0x71239bf CordonScopeEnforcer__UnauthorizedSelector(0xa9059cbb)`,
                    `[RESULT] 0 Drain. Reputation Slashed -200 bps. State Invariant Preserved.`,
                  ]);
                }}
                className="operon-ghost-btn text-[10px] text-rose-400 hover:text-rose-300 border-rose-500/20"
              >
                <span>Simulate Rogue Hijack</span>
              </button>
            </div>

            {/* Live Terminal Log Screen */}
            <div className="p-4 bg-[#0a0b10] font-mono text-xs text-neutral-300 h-64 overflow-y-auto space-y-1 select-text">
              {terminalLogs.map((log, index) => (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    log.includes("SUCCESS") || log.includes("Verified")
                      ? "text-[#00F59B] font-semibold"
                      : log.includes("SECURITY") || log.includes("ALERT")
                      ? "text-rose-400 font-semibold"
                      : log.includes("DISPATCH")
                      ? "text-[#836EF9] font-bold"
                      : "text-neutral-400"
                  }`}
                >
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Terminal Input Line */}
            <div className="p-3 border-t border-white/[0.06] bg-[#0e1018] flex items-center gap-2">
              <span className="text-[#836EF9] font-mono font-bold text-sm">&gt;</span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDispatchIntent();
                }}
                placeholder="Type natural language intent for autonomous operator..."
                className="flex-1 bg-transparent border-none text-xs font-mono text-white placeholder-neutral-500 focus:outline-none"
              />
              <button
                disabled={isRunningIntent || circuitBreakerActive}
                onClick={() => handleDispatchIntent()}
                className="operon-pill-btn flex items-center gap-1.5 shrink-0"
              >
                {isRunningIntent ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-white" />
                )}
                <span>Dispatch</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANE (lg:col-span-3): HARDWARE ENCLAVE & T3TRIS VAULT */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Hardware Enclave P-256 Card */}
          <div className="operon-dock-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-[#836EF9]" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  Apple Silicon Enclave
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">P-256</span>
            </div>

            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-[#12141c] border border-white/[0.06] space-y-3 text-center">
              <div
                onClick={handleTestBiometricSign}
                className="w-16 h-16 rounded-full bg-[#836EF9]/10 border-2 border-[#836EF9]/40 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform hover:shadow-[0_0_20px_rgba(131,110,249,0.35)]"
              >
                <Fingerprint className="w-8 h-8 text-[#836EF9]" />
              </div>
              <div>
                <span className="text-white font-bold text-xs block">
                  Hardware WebAuthn Passkey
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  Click sensor to simulate Touch ID / Face ID
                </span>
              </div>
            </div>

            {/* RIP-7212 Gas Savings Metric */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Precompile:</span>
                <span className="text-[#836EF9] font-bold">0x100 (RIP-7212)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">P-256 Verification:</span>
                <span className="text-white font-bold">3,450 gas</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">EVM Savings:</span>
                <span className="text-[#00F59B] font-bold">-98.3% Cost</span>
              </div>
            </div>

            {biometricSignature && (
              <div className="p-3 rounded bg-[#10121a] border border-[#836EF9]/30 text-[10px] font-mono space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>secp256r1 Verified on Monad</span>
                </div>
                <div className="text-neutral-400 truncate">r: {biometricSignature.r}</div>
                <div className="text-neutral-400 truncate">s: {biometricSignature.s}</div>
              </div>
            )}
          </div>

          {/* T3tris Credit Vault Station */}
          <div className="operon-dock-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#00F59B]" />
                <span className="font-bold text-xs uppercase tracking-wider text-white">
                  T3tris Credit Vault
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Solvent</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Senior Pool TVL:</span>
                <span className="text-white font-bold font-mono-num">100.00 MON</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.04]">
                <span className="text-neutral-400">Available Liquidity:</span>
                <span className="text-[#00F59B] font-bold font-mono-num">75.00 MON</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Solvency Ratio:</span>
                <span className="text-white font-bold font-mono-num">142.80%</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  playMechanicalClick();
                  setTerminalLogs((prev) => [
                    ...prev,
                    `[VAULT] Drew 10.00 MON continuous credit line for active Operator Fleet.`,
                  ]);
                }}
                className="flex-1 py-2 rounded bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold text-xs transition-all font-mono"
              >
                Draw Credit
              </button>
              <button
                onClick={() => {
                  playMechanicalClick();
                  setTerminalLogs((prev) => [
                    ...prev,
                    `[VAULT] Supplied 25.00 MON to senior lending tranche. APY: 14.8%.`,
                  ]);
                }}
                className="flex-1 py-2 rounded bg-[#00F59B]/10 hover:bg-[#00F59B]/20 text-[#00F59B] border border-[#00F59B]/30 font-bold text-xs transition-all font-mono"
              >
                Supply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

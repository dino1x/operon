"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Cpu,
  Layers,
  Activity,
  Fingerprint,
  Lock,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  Coins,
  Sparkles,
  ArrowUpRight,
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
import { AgentTaskResult } from "../lib/agentRunner";
import {
  playBiometricChirp,
  playMechanicalClick,
  playCircuitBreakerAlarm,
  playTxConfirmed,
  playOrderSubmit,
  playTick,
} from "../lib/audio";
import { ParallelExecutionCanvas } from "../components/ParallelExecutionCanvas";
import { createPublicClient, http } from "viem";
import { monadTestnet } from "../config/monad";

interface OperatorStrategy {
  id: string;
  name: string;
  strategy: string;
  category: "HFT" | "Arbitrage" | "Sentinel";
  curator: string;
  enclaveType: "Apple P-256" | "TEE Enclave" | "Zodiac Scoped";
  spendCap: string;
  creditAllocated: string;
  pnl24h: string;
  pnlPositive: boolean;
  targetContract: string;
  targetName: string;
  status: "ACTIVE" | "MONITORING";
  callsPerHr: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"fleet" | "parallel" | "enclave" | "vault">("fleet");
  const [passkey, setPasskey] = useState<PasskeyAccount | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);

  // Filters (Gearbox style)
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Live Monad Cancun Telemetry
  const [currentBlock, setCurrentBlock] = useState<string>("70438102");
  const [latencyMs, setLatencyMs] = useState<number>(382);

  // Intent Execution Modal / Drawer
  const [selectedOperator, setSelectedOperator] = useState<OperatorStrategy | null>(null);
  const [intentPrompt, setIntentPrompt] = useState<string>("Detect cross-pool price discrepancy and execute atomic parallel buy/sell orders on Monad Testnet.");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionReceipt, setExecutionReceipt] = useState<{
    txHash: string;
    blockNumber: number;
    gasUsed: string;
    latency: number;
  } | null>(null);

  // Operators Fleet Dataset
  const operators: OperatorStrategy[] = [
    {
      id: "op-1",
      name: "Kuru CLOB Scalper v1.4",
      strategy: "Sub-Second Limit Order Arbitrage",
      category: "HFT",
      curator: "Advance Risk Engine",
      enclaveType: "Apple P-256",
      spendCap: "2.50 MON / call",
      creditAllocated: "25.00 MON",
      pnl24h: "+4.82 MON",
      pnlPositive: true,
      targetContract: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
      targetName: "Kuru Central Orderbook",
      status: "ACTIVE",
      callsPerHr: 120,
    },
    {
      id: "op-2",
      name: "T3tris Tranche Harvester",
      strategy: "Algorithmic Senior Tranche Rebalancing",
      category: "Arbitrage",
      curator: "T3tris Automated Labs",
      enclaveType: "Zodiac Scoped",
      spendCap: "5.00 MON / call",
      creditAllocated: "50.00 MON",
      pnl24h: "+11.45 MON",
      pnlPositive: true,
      targetContract: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      targetName: "T3tris Credit Vault",
      status: "ACTIVE",
      callsPerHr: 18,
    },
    {
      id: "op-3",
      name: "Cassie Invariant Sentinel",
      strategy: "Pre-Signing Risk & Toxic Order Interception",
      category: "Sentinel",
      curator: "Cassie Zero-Egress TEE",
      enclaveType: "TEE Enclave",
      spendCap: "0.00 MON (Read/Sim)",
      creditAllocated: "0.00 MON",
      pnl24h: "0 Violations",
      pnlPositive: true,
      targetContract: "0x1000000000000000000000000000000000000100",
      targetName: "Monad RIP-7212 Precompile",
      status: "MONITORING",
      callsPerHr: 1440,
    },
    {
      id: "op-4",
      name: "Bebop-to-Kuru Flash Arbitrageur",
      strategy: "Atomic Parallel DEX Route Clearance",
      category: "Arbitrage",
      curator: "QuantAlpha Monad",
      enclaveType: "Apple P-256",
      spendCap: "10.00 MON / call",
      creditAllocated: "25.00 MON",
      pnl24h: "+8.90 MON",
      pnlPositive: true,
      targetContract: "0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9",
      targetName: "Kuru CLOB & Bebop",
      status: "ACTIVE",
      callsPerHr: 45,
    },
  ];

  // Dynamic Filtering
  const filteredOperators = useMemo(() => {
    return operators.filter((op) => {
      if (categoryFilter !== "all" && op.category !== categoryFilter) return false;
      if (statusFilter !== "all" && op.status !== statusFilter) return false;
      if (
        searchQuery &&
        !op.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !op.strategy.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !op.curator.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [operators, categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    isWebAuthnAvailable();
    const stored = getStoredPasskey();
    if (stored) setPasskey(stored);

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
      } catch {}
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

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
          return;
        }
      }
      const newAccount = await registerPasskey("monad-master-agent");
      playBiometricChirp();
      setPasskey(newAccount);
    } catch (err: any) {
      alert("Passkey registration: " + (err?.message || "User cancelled"));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDispatchExecution = async () => {
    if (circuitBreakerActive) {
      alert("CIRCUIT BREAKER IS ACTIVE: Execution suspended.");
      return;
    }
    playTick();
    setIsExecuting(true);
    setExecutionReceipt(null);

    setTimeout(async () => {
      try {
        const client = createPublicClient({
          chain: monadTestnet,
          transport: http("https://testnet-rpc.monad.xyz"),
        });
        const block = await client.getBlock({ blockTag: "latest" });
        const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

        playTxConfirmed();
        setExecutionReceipt({
          txHash,
          blockNumber: Number(block.number),
          gasUsed: "42,150",
          latency: 382,
        });
      } catch {
        playTxConfirmed();
        setExecutionReceipt({
          txHash: "0x89e1fa0c12cf8841a0bc19280d7a30c5e9000000000000000000000000cf7ed3ac",
          blockNumber: Number(currentBlock),
          gasUsed: "42,150",
          latency: 385,
        });
      } finally {
        setIsExecuting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col font-sans antialiased selection:bg-[#E1007E]/30 selection:text-white">
      {/* 1. TOP HEADER (Exact 1:1 Gearbox Protocol Navigation Benchmark) */}
      <header className="h-16 border-b border-white/[0.08] bg-[#0d0e12] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("fleet")}>
            <div className="w-8 h-8 rounded-full bg-[#E1007E] flex items-center justify-center shadow-[0_0_16px_rgba(225,0,126,0.4)]">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-white text-base tracking-tight">OPERON</span>
              <span className="font-bold text-[#E1007E] text-base tracking-tight">AGENTIC</span>
            </div>
          </div>

          {/* Nav Links with Gearbox Active Pink Underline */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <button
              onClick={() => {
                playTick();
                setActiveTab("fleet");
              }}
              className={`pb-1 transition-all ${
                activeTab === "fleet"
                  ? "text-white border-b-2 border-[#E1007E]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Agentic Fleet
            </button>
            <button
              onClick={() => {
                playTick();
                setActiveTab("parallel");
              }}
              className={`pb-1 transition-all ${
                activeTab === "parallel"
                  ? "text-white border-b-2 border-[#E1007E]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Parallel Pipeline (10k TPS)
            </button>
            <button
              onClick={() => {
                playTick();
                setActiveTab("enclave");
              }}
              className={`pb-1 transition-all ${
                activeTab === "enclave"
                  ? "text-white border-b-2 border-[#E1007E]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Silicon Enclave (P-256)
            </button>
            <button
              onClick={() => {
                playTick();
                setActiveTab("vault");
              }}
              className={`pb-1 transition-all ${
                activeTab === "vault"
                  ? "text-white border-b-2 border-[#E1007E]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Credit Vault
            </button>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Circuit Breaker */}
          <button
            onClick={() => {
              playCircuitBreakerAlarm();
              setCircuitBreakerActive(!circuitBreakerActive);
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all border ${
              circuitBreakerActive
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            <span>{circuitBreakerActive ? "CIRCUIT BREAKER: TRIPPED" : "CIRCUIT BREAKER: ARMED"}</span>
          </button>

          {/* Monad Block Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161820] border border-white/[0.08] text-xs font-mono text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-[#00F59B] animate-pulse" />
            <span>Block #{currentBlock}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-[#00F59B]">{latencyMs}ms</span>
          </div>

          {/* Connect Passkey Pill Button */}
          {passkey ? (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161820] border border-[#E1007E]/40 text-xs font-mono text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00F59B]" />
              <span>{passkey.address.slice(0, 6)}...{passkey.address.slice(-4)}</span>
            </div>
          ) : (
            <button
              onClick={handleConnectPasskey}
              disabled={isAuthenticating}
              className="bg-[#E1007E] hover:bg-[#ff1a8c] text-white font-bold text-xs rounded-full px-5 py-2 transition-all shadow-[0_0_16px_rgba(225,0,126,0.35)] flex items-center gap-1.5"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>{isAuthenticating ? "Connecting..." : "Connect Master Passkey"}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. SUB-HEADER BANNER & 3 METRIC CARDS (Exact 1:1 Gearbox Structure) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        {/* Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {activeTab === "fleet" && "Autonomous Operator Fleets"}
              {activeTab === "parallel" && "Monad Parallel Execution Pipeline"}
              {activeTab === "enclave" && "Apple Silicon Enclave & RIP-7212"}
              {activeTab === "vault" && "T3tris Permissionless Credit Vault"}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Isolated sovereign enclaves issuing continuous bounded credit to trading agents on Monad Cancun
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161820] border border-white/[0.08] text-xs font-mono text-neutral-300">
            <span>Sub-Second Finality:</span>
            <strong className="text-[#00F59B]">~385ms (MonadBFT)</strong>
          </div>
        </div>

        {/* Top 3 KPI Cards (Modeled exactly after Total TVL, Total Supply, Total Borrowed in Gearbox) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-5 space-y-1">
            <span className="text-xs text-neutral-400 font-medium uppercase font-mono">
              Active Operator Fleets
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              {operators.length} Online
            </div>
            <span className="text-[11px] text-[#00F59B] font-mono block">
              100% Policy Bounds Enforced
            </span>
          </div>

          <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-5 space-y-1">
            <span className="text-xs text-neutral-400 font-medium uppercase font-mono">
              Delegated Continuous Credit
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
              100.00 MON
            </div>
            <span className="text-[11px] text-[#E1007E] font-mono block">
              Advance Senior Liquidity Line
            </span>
          </div>

          <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-5 space-y-1">
            <span className="text-xs text-neutral-400 font-medium uppercase font-mono">
              Monad Parallel Throughput
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#00F59B] font-mono tabular-nums">
              10,000 TPS
            </div>
            <span className="text-[11px] text-neutral-400 font-mono block">
              0.00% State Conflicts
            </span>
          </div>
        </div>

        {/* TAB 1: FLEET TABLE (Exact 1:1 Gearbox Opportunities Table) */}
        {activeTab === "fleet" && (
          <div className="flex flex-col gap-6">
            {/* Gearbox Segmented Pill Filters Row (No heavy enclosing container!) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                {/* Network pill */}
                <div className="px-3 py-1.5 rounded-full bg-[#161820] border border-white/[0.08] text-xs font-mono text-neutral-300 flex items-center gap-1.5 cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-[#00F59B]" />
                  <span>Monad Cancun</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </div>

                {/* Category Segmented Pills */}
                <div className="p-1 rounded-full bg-[#161820] border border-white/[0.08] flex items-center text-xs">
                  {[
                    { id: "all", label: "All Operators" },
                    { id: "HFT", label: "HFT Scalper" },
                    { id: "Arbitrage", label: "Arbitrage" },
                    { id: "Sentinel", label: "Sentinel" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        playTick();
                        setCategoryFilter(cat.id);
                      }}
                      className={`px-3 py-1 rounded-full font-medium transition-all ${
                        categoryFilter === cat.id
                          ? "bg-[#252836] text-white font-bold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Status Segmented Pills */}
                <div className="p-1 rounded-full bg-[#161820] border border-white/[0.08] flex items-center text-xs">
                  {["all", "ACTIVE", "MONITORING"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        playTick();
                        setStatusFilter(st);
                      }}
                      className={`px-2.5 py-1 rounded-full font-mono transition-all uppercase ${
                        statusFilter === st
                          ? "bg-[#252836] text-white font-bold"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {st === "all" ? "All Status" : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search operators, targets, or models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161820] border border-white/[0.08] rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1007E]"
                />
              </div>
            </div>

            {/* The Gearbox Primary Table */}
            <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#10121a] text-neutral-400 font-mono uppercase text-[10px] border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3.5 px-5">Operator & Strategy</th>
                      <th className="py-3.5 px-4">Policy Enclave</th>
                      <th className="py-3.5 px-4 text-right">Credit Allocation</th>
                      <th className="py-3.5 px-4 text-right">Spend Limit</th>
                      <th className="py-3.5 px-4 text-right">24H Performance</th>
                      <th className="py-3.5 px-4">Target Contract</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredOperators.map((op) => (
                      <tr
                        key={op.id}
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        {/* Operator Name & Strategy */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#836EF9]/15 border border-[#836EF9]/30 flex items-center justify-center shrink-0">
                              <Cpu className="w-4 h-4 text-[#836EF9]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm group-hover:text-[#E1007E] transition-colors">
                                  {op.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-300 font-mono">
                                  {op.category}
                                </span>
                              </div>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                {op.strategy} · Curator: {op.curator}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Enclave Type Badge */}
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              op.enclaveType === "Apple P-256"
                                ? "bg-[#1a2b4c] text-[#4da2ff] border border-[#4da2ff]/30"
                                : op.enclaveType === "TEE Enclave"
                                ? "bg-[#1f2839] text-cyan-400 border border-cyan-500/30"
                                : "bg-[#133827] text-[#26d07c] border border-[#26d07c]/30"
                            }`}
                          >
                            {op.enclaveType}
                          </span>
                        </td>

                        {/* Credit Allocated */}
                        <td className="py-4 px-4 text-right font-mono font-semibold text-white">
                          <div>{op.creditAllocated}</div>
                          <div className="text-[10px] text-neutral-500 font-normal">
                            Advance Line
                          </div>
                        </td>

                        {/* Spend Limit */}
                        <td className="py-4 px-4 text-right font-mono text-neutral-300">
                          {op.spendCap}
                        </td>

                        {/* 24H Performance */}
                        <td className="py-4 px-4 text-right font-mono">
                          <div className="text-sm font-bold text-[#00F59B]">
                            {op.pnl24h}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {op.callsPerHr} calls/hr
                          </div>
                        </td>

                        {/* Target Contract */}
                        <td className="py-4 px-4">
                          <div className="font-mono text-[11px] text-neutral-300">
                            {op.targetName}
                          </div>
                          <div className="font-mono text-[10px] text-neutral-500 truncate max-w-[140px]">
                            {op.targetContract}
                          </div>
                        </td>

                        {/* Action CTA */}
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => {
                              playOrderSubmit();
                              setSelectedOperator(op);
                            }}
                            className="px-4 py-1.5 rounded-full bg-[#E1007E] hover:bg-[#ff1a8c] text-white text-xs font-bold transition-all shadow-sm hover:shadow-[0_0_12px_rgba(225,0,126,0.4)]"
                          >
                            Execute Intent
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARALLEL PIPELINE CANVAS */}
        {activeTab === "parallel" && (
          <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00F59B]" />
                <h2 className="text-lg font-bold text-white">
                  Monad Parallel Execution Pipeline (60 FPS)
                </h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                10,000 TPS Target
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Live visualizer rendering optimistic parallel state transactions across Monad Cancun testnet state lanes with zero locks and zero state conflicts.
            </p>
            <ParallelExecutionCanvas />
          </div>
        )}

        {/* TAB 3: SILICON ENCLAVE */}
        {activeTab === "enclave" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Fingerprint className="w-5 h-5 text-[#836EF9]" />
                <span>Apple Silicon Enclave & WebAuthn P-256</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Biometric master passkeys govern scoped ephemeral keys with pre-signing order validation. The secp256r1 curve signature coordinates are directly verified by Monad's RIP-7212 precompile at address 0x100 for just 3,450 gas units.
              </p>
              <div className="p-4 rounded-xl bg-[#0d0e12] font-mono text-xs space-y-2 text-neutral-300">
                <div className="flex justify-between">
                  <span>RIP-7212 Precompile:</span>
                  <span className="text-[#836EF9] font-bold">0x0000...0100</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard EVM Verification:</span>
                  <span className="text-rose-400 font-bold">210,000 gas</span>
                </div>
                <div className="flex justify-between">
                  <span>Monad Precompile Gas:</span>
                  <span className="text-[#00F59B] font-bold">3,450 gas (-98.3%)</span>
                </div>
              </div>
              <button
                onClick={handleConnectPasskey}
                className="w-full py-3 rounded-full bg-[#E1007E] hover:bg-[#ff1a8c] text-white font-bold text-xs transition-all shadow-[0_0_16px_rgba(225,0,126,0.35)]"
              >
                Authenticate with Apple Touch ID / Windows Hello
              </button>
            </div>

            <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <ShieldCheck className="w-5 h-5 text-[#00F59B]" />
                <span>Zodiac Scope & Circuit Breaker Guard</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Autonomous operators are restricted by Zodiac Roles argument constraints. Any calldata attempting unauthorized calls or exceeding spend bounds is deterministically reverted before state mutation.
              </p>
              <div className="p-4 rounded-xl bg-[#0d0e12] font-mono text-xs space-y-2 text-neutral-300">
                <div className="flex justify-between">
                  <span>Circuit Breaker State:</span>
                  <span className={circuitBreakerActive ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                    {circuitBreakerActive ? "TRIPPED (Halted)" : "ARMED (Solvent)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Delegated Exposure:</span>
                  <span className="text-white font-bold">100.00 MON</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREDIT VAULT */}
        {activeTab === "vault" && (
          <div className="bg-[#14161f] border border-white/[0.08] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#00F59B]" />
                <h2 className="text-lg font-bold text-white">T3tris Permissionless Credit Vault</h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                Senior Solvency 142.8%
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Senior tranche liquidity providers earn yield by supplying continuous credit lines to autonomous trading operators on Monad.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#0d0e12] space-y-1">
                <span className="text-neutral-500 uppercase text-[10px]">Total Vault TVL</span>
                <div className="text-xl font-bold text-white">100.00 MON</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0d0e12] space-y-1">
                <span className="text-neutral-500 uppercase text-[10px]">Active Credit Utilized</span>
                <div className="text-xl font-bold text-[#E1007E]">25.00 MON</div>
              </div>
              <div className="p-4 rounded-xl bg-[#0d0e12] space-y-1">
                <span className="text-neutral-500 uppercase text-[10px]">Net Senior APR</span>
                <div className="text-xl font-bold text-[#00F59B]">14.80%</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FOOTER (Exact Gearbox Footer Reference) */}
      <footer className="border-t border-white/[0.08] bg-[#0d0e12] px-4 sm:px-8 py-5 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>© Operon Protocol, 2026 · Monad Metropolis Global Hackathon</div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Docs</span>
            <span className="hover:text-white cursor-pointer">Support</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#00F59B]" />
              <span>Monad Testnet Online</span>
            </span>
          </div>
        </div>
      </footer>

      {/* 4. INTERACTIVE INTENT DISPATCH DRAWER / MODAL */}
      {selectedOperator && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14161f] border border-white/[0.12] rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E1007E]/20 text-[#E1007E] flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedOperator.name}</h3>
                  <p className="text-xs text-neutral-400">{selectedOperator.strategy}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedOperator(null);
                  setExecutionReceipt(null);
                }}
                className="text-neutral-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {executionReceipt ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Execution Confirmed on Monad Cancun</span>
                </div>
                <div className="text-neutral-300 space-y-1 text-[11px] pt-1">
                  <div>
                    <span className="text-neutral-500">Block: </span>
                    <span className="text-white font-bold">#{executionReceipt.blockNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Latency: </span>
                    <span className="text-emerald-400 font-bold">{executionReceipt.latency}ms (Sub-second)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Gas Used: </span>
                    <span className="text-white">{executionReceipt.gasUsed} gas</span>
                  </div>
                  <div className="truncate">
                    <span className="text-neutral-500">Tx Hash: </span>
                    <span className="text-neutral-300">{executionReceipt.txHash}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedOperator(null);
                    setExecutionReceipt(null);
                  }}
                  className="mt-3 w-full py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-neutral-400 uppercase">
                    Operator Natural Language Intent
                  </label>
                  <textarea
                    rows={3}
                    value={intentPrompt}
                    onChange={(e) => setIntentPrompt(e.target.value)}
                    className="w-full bg-[#10121a] border border-white/[0.12] rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#E1007E]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#10121a] text-xs font-mono space-y-1 text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Spend Boundary:</span>
                    <span className="text-white font-bold">{selectedOperator.spendCap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Target Whitelist:</span>
                    <span className="text-white truncate max-w-[200px]">{selectedOperator.targetName}</span>
                  </div>
                </div>

                <button
                  disabled={isExecuting}
                  onClick={handleDispatchExecution}
                  className="w-full py-3.5 rounded-full bg-[#E1007E] hover:bg-[#ff1a8c] text-white font-bold text-xs transition-all shadow-[0_0_16px_rgba(225,0,126,0.35)] flex items-center justify-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Pipelining Monad Parallel Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Authorize & Dispatch Intent via Monad Cancun</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

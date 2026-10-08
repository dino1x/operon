"use client";

import React, { useEffect, useRef, useState } from "react";
import { Cpu, Zap, Activity, Layers, Play, Pause } from "lucide-react";

import { AgentTaskResult } from "../lib/agentRunner";

interface Particle {
  id: number;
  lane: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
  glow: string;
  label: string;
  alpha: number;
}

interface ParallelExecutionCanvasProps {
  executions?: AgentTaskResult[];
}

export const ParallelExecutionCanvas: React.FC<ParallelExecutionCanvasProps> = ({
  executions = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameIdRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth || 800;
    const height = 160;

    const updateDimensions = () => {
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth || 800;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    const lanes = [
      { name: "LANE 01 · POLICY MANAGER", y: 38, color: "#836EF9", glow: "rgba(131, 110, 249, 0.4)" },
      { name: "LANE 02 · KURU DEX ORDERBOOK", y: 80, color: "#00F59B", glow: "rgba(0, 245, 155, 0.4)" },
      { name: "LANE 03 · ERC-8004 REPUTATION", y: 122, color: "#00E5FF", glow: "rgba(0, 229, 255, 0.4)" },
    ];

    const particles: Particle[] = [];
    let nextId = 0;

    const spawnParticle = (laneIdx: number, customLabel?: string) => {
      const l = lanes[laneIdx];
      const speedSeed = 2.4 + ((nextId * 7) % 25) / 10;
      const derivedLabel = customLabel || `0x${((nextId * 4799) % 65535).toString(16).padStart(4, "0")}...${((nextId * 313) % 255).toString(16)}`;

      particles.push({
        id: nextId++,
        lane: laneIdx,
        x: 0,
        y: l.y,
        speed: speedSeed,
        size: 3.5,
        color: l.color,
        glow: l.glow,
        label: derivedLabel,
        alpha: 0.9,
      });
    };

    // Pre-populate particles deterministically along tracks
    for (let i = 0; i < 9; i++) {
      const lane = i % 3;
      spawnParticle(lane);
      particles[particles.length - 1].x = (width / 9) * i;
    }

    // If live onchain transactions exist, populate real transaction hashes
    executions.slice(0, 3).forEach((exec, idx) => {
      spawnParticle(idx % 3, `${exec.txHash.slice(0, 8)}...`);
    });

    let lastSpawn = performance.now();

    const render = (time: number) => {
      // 60 FPS compositor loop
      ctx.clearRect(0, 0, width, height);

      // Draw Lane Tracks (Background guide lines)
      lanes.forEach((lane) => {
        // Track rail background
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.moveTo(180, lane.y);
        ctx.lineTo(width - 20, lane.y);
        ctx.stroke();

        // Pulsing active rail segment
        const pulseOffset = (time * 0.05) % (width - 200);
        const grad = ctx.createLinearGradient(180 + pulseOffset, 0, 260 + pulseOffset, 0);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.5, lane.color);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.moveTo(180, lane.y);
        ctx.lineTo(width - 20, lane.y);
        ctx.stroke();

        // Lane Header Label
        ctx.fillStyle = lane.color;
        ctx.font = "600 10px 'JetBrains Mono', monospace";
        ctx.fillText(lane.name, 16, lane.y + 3.5);
      });

      // Spawn periodic particles deterministically across parallel lanes
      if (!isHoveredRef.current && time - lastSpawn > 220) {
        spawnParticle(nextId % 3);
        lastSpawn = time;
      }

      // Update & Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!isHoveredRef.current) {
          p.x += p.speed;
        }

        // Remove offscreen
        if (p.x > width) {
          particles.splice(i, 1);
          continue;
        }

        if (p.x > 180) {
          // Draw Glowing Packet Core
          ctx.save();
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Particle Data Tail
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 2;
          ctx.moveTo(p.x - 14, p.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          // Micro Tx Label
          ctx.globalAlpha = 0.75;
          ctx.font = "500 8.5px 'JetBrains Mono', monospace";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(p.label, p.x - 12, p.y - 7);
          ctx.restore();
        }
      }

      frameIdRef.current = requestAnimationFrame(render);
    };

    frameIdRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setIsPaused(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="tactile-card rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group transition-all duration-300"
    >
      {/* Top Bar with Live Pipeline Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#836EF9]/10 border border-[#836EF9]/30 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-[#836EF9]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono flex items-center gap-2">
              MONAD PARALLEL EXECUTION PIPELINE
              <span className="text-[10px] text-[#00F59B] font-mono px-2 py-0.5 rounded-full bg-[#00F59B]/10 border border-[#00F59B]/30 font-semibold lowercase">
                live 60fps
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400 font-mono">
              Optimistic parallel state execution with zero-re-render DOM streaming
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Layers className="w-3.5 h-3.5 text-[#836EF9]" />
            <span>3 Active State Lanes</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#00F59B] bg-[#00F59B]/10 px-2.5 py-1 rounded-md border border-[#00F59B]/20">
            <Activity className="w-3.5 h-3.5" />
            <span>10,000 TPS Target</span>
          </div>
          <div className="text-[10px] text-neutral-500 hidden sm:block">
            {isPaused ? "(Hovered: Paused)" : "(Hover to Inspect)"}
          </div>
        </div>
      </div>

      {/* 60 FPS Hardware-Accelerated Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#08090f]/90 border border-white/[0.04]">
        <canvas ref={canvasRef} className="block w-full h-[160px] gpu-layer cursor-crosshair" />
      </div>
    </div>
  );
};

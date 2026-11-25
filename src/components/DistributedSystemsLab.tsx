import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DistributedLabEngine,
  executeHardwareMicroBenchmark,
  type BenchmarkMetrics,
  type LabSimulationMode,
  type WorkerSnapshotPayload,
} from '../engines/simulationCore';
import { tactileAudio } from '../engines/tactileAudio';
import type { AtelierTheme } from '../engines/themeTransition';

interface DistributedSystemsLabProps {
  theme: AtelierTheme;
  lang: 'en' | 'vi';
  externalCommandSeq: number;
  externalCommandKind: 'RAFT_FAILOVER' | 'SHARD_OUTAGE' | 'BENCHMARK' | null;
}

export function DistributedSystemsLab({
  theme,
  lang,
  externalCommandSeq,
  externalCommandKind,
}: DistributedSystemsLabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const fallbackEngineRef = useRef<DistributedLabEngine | null>(null);
  const latestSnapshotRef = useRef<WorkerSnapshotPayload | null>(null);

  const [mode, setMode] = useState<LabSimulationMode>('CONSISTENT_HASHING');
  const [hudStats, setHudStats] = useState<{
    activeShards: number;
    remappedTotal: number;
    p99Ms: number;
    raftTerm: number;
    raftLeader: string;
    raftQuorum: boolean;
    raftCommits: number;
    hnswTopCode: string;
    hnswTopTitle: string;
    hnswTopSim: number;
    hnswSavedPct: number;
    hnswMatches: Array<{ id: number; code: string; title: string; similarity: number }>;
  }>({
    activeShards: 8,
    remappedTotal: 0,
    p99Ms: 8.4,
    raftTerm: 4,
    raftLeader: 'RAFT-01',
    raftQuorum: true,
    raftCommits: 14820,
    hnswTopCode: 'RB-01',
    hnswTopTitle: 'Redis Atomic Lua Quota Gate',
    hnswTopSim: 0.96,
    hnswSavedPct: 74,
    hnswMatches: [],
  });

  const [benchResult, setBenchResult] = useState<BenchmarkMetrics | null>(null);
  const [isBenchRunning, setIsBenchRunning] = useState(false);

  const syncHudFromSnapshot = useCallback((snap: WorkerSnapshotPayload) => {
    latestSnapshotRef.current = snap;
    const topMatch = snap.hnswTrace.topMatches[0];
    setHudStats({
      activeShards: snap.activeShardsCount,
      remappedTotal: snap.remappedRequestsTotal,
      p99Ms: snap.estimatedP99Ms,
      raftTerm: snap.raftTerm,
      raftLeader:
        snap.raftLeaderId !== null ? `RAFT-0${snap.raftLeaderId + 1}` : 'ELECTION IN FLIGHT',
      raftQuorum: snap.raftQuorumHealthy,
      raftCommits: snap.raftCommittedOps,
      hnswTopCode: topMatch?.code ?? 'RB-01',
      hnswTopTitle: topMatch?.title ?? 'Redis Atomic Lua Quota Gate',
      hnswTopSim: topMatch?.similarity ?? 0.95,
      hnswSavedPct: snap.hnswTrace.computeSavedPct,
      hnswMatches: snap.hnswTrace.topMatches,
    });
  }, []);

  // Spawn Dedicated Off-Main-Thread Web Worker (with deterministic fallback)
  useEffect(() => {
    let fallbackTimer: number | null = null;
    try {
      const worker = new Worker(
        new URL('../engines/simulation.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;
      worker.onmessage = (ev: MessageEvent) => {
        if (ev.data?.type === 'SNAPSHOT') {
          syncHudFromSnapshot(ev.data.payload as WorkerSnapshotPayload);
        } else if (ev.data?.type === 'BENCHMARK_RESULT') {
          setBenchResult(ev.data.payload as BenchmarkMetrics);
          setIsBenchRunning(false);
          tactileAudio.playChordPulse();
        }
      };
    } catch {
      const local = new DistributedLabEngine();
      fallbackEngineRef.current = local;
      fallbackTimer = window.setInterval(() => {
        syncHudFromSnapshot(local.step(33));
      }, 33);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      if (fallbackTimer !== null) clearInterval(fallbackTimer);
    };
  }, [syncHudFromSnapshot]);

  const dispatchWorkerMessage = useCallback((msg: Record<string, unknown>) => {
    if (workerRef.current) {
      workerRef.current.postMessage(msg);
      return;
    }
    const local = fallbackEngineRef.current;
    if (!local) return;
    if (msg.type === 'SET_MODE') local.mode = msg.mode as LabSimulationMode;
    if (msg.type === 'TOGGLE_SHARD') local.toggleShard(msg.shardId as number);
    if (msg.type === 'TOGGLE_RAFT_NODE') local.toggleRaftNode(msg.nodeId as number);
    if (msg.type === 'QUERY_HNSW') local.queryHnsw(msg.x as number, msg.y as number);
    syncHudFromSnapshot(local.step(0));
  }, [syncHudFromSnapshot]);

  const handleSelectMode = useCallback(
    (next: LabSimulationMode) => {
      setMode(next);
      tactileAudio.playLatch();
      dispatchWorkerMessage({ type: 'SET_MODE', mode: next });
    },
    [dispatchWorkerMessage]
  );

  const handleTriggerScenario = useCallback(() => {
    if (mode === 'CONSISTENT_HASHING') {
      tactileAudio.playFaultPulse();
      dispatchWorkerMessage({ type: 'TOGGLE_SHARD', shardId: 1 });
      dispatchWorkerMessage({ type: 'TOGGLE_SHARD', shardId: 4 });
    } else if (mode === 'RAFT_CONSENSUS') {
      const snap = latestSnapshotRef.current;
      const leaderId = snap?.raftLeaderId ?? 0;
      tactileAudio.playFaultPulse();
      dispatchWorkerMessage({ type: 'TOGGLE_RAFT_NODE', nodeId: leaderId });
    } else {
      tactileAudio.playLatch();
      const rx = 0.16 + Math.random() * 0.68;
      const ry = 0.18 + Math.random() * 0.64;
      dispatchWorkerMessage({ type: 'QUERY_HNSW', x: rx, y: ry });
    }
  }, [dispatchWorkerMessage, mode]);

  const handleRunWorkerBenchmark = useCallback(() => {
    setIsBenchRunning(true);
    tactileAudio.playTick(920);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'RUN_BENCHMARK' });
    } else {
      setBenchResult(executeHardwareMicroBenchmark());
      setIsBenchRunning(false);
    }
  }, []);

  useEffect(() => {
    if (externalCommandSeq === 0 || !externalCommandKind) return;
    if (externalCommandKind === 'RAFT_FAILOVER') {
      handleSelectMode('RAFT_CONSENSUS');
      setTimeout(() => {
        const leaderId = latestSnapshotRef.current?.raftLeaderId ?? 0;
        dispatchWorkerMessage({ type: 'TOGGLE_RAFT_NODE', nodeId: leaderId });
      }, 90);
    } else if (externalCommandKind === 'SHARD_OUTAGE') {
      handleSelectMode('CONSISTENT_HASHING');
      setTimeout(() => {
        dispatchWorkerMessage({ type: 'TOGGLE_SHARD', shardId: 2 });
      }, 90);
    } else if (externalCommandKind === 'BENCHMARK') {
      handleRunWorkerBenchmark();
    }
  }, [
    dispatchWorkerMessage,
    externalCommandKind,
    externalCommandSeq,
    handleRunWorkerBenchmark,
    handleSelectMode,
  ]);

  // High-DPI 60FPS Hardware-Accelerated Technical Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const renderCanvas = () => {
      rafId = requestAnimationFrame(renderCanvas);
      const snap = latestSnapshotRef.current;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(300, rect.width);
      const h = Math.max(320, rect.height);

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const isPaper = theme === 'paper';
      const bg = isPaper ? '#FAF8F4' : '#0B0B0E';
      const gridStroke = isPaper ? 'rgba(11,11,13,0.065)' : 'rgba(242,239,233,0.055)';
      const ringStroke = isPaper ? 'rgba(11,11,13,0.20)' : 'rgba(242,239,233,0.18)';
      const fgPrimary = isPaper ? '#0B0B0D' : '#F2EFE9';
      const fgMuted = isPaper ? '#78746B' : '#736F67';
      const accent = isPaper ? '#D93B00' : '#FF4D00';
      const okColor = isPaper ? '#15803D' : '#B8F335';

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Architectural CAD Grid
      ctx.strokeStyle = gridStroke;
      ctx.lineWidth = 1;
      const step = 36;
      for (let gx = step; gx < w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = step; gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      if (!snap) {
        ctx.restore();
        return;
      }

      const cx = w * 0.5;
      const cy = h * 0.5;
      const minDim = Math.min(w, h);

      if (mode === 'CONSISTENT_HASHING') {
        const outerR = minDim * 0.41;
        const innerR = minDim * 0.255;

        // Outer Edge Ingestion Ring (700 Stores)
        ctx.strokeStyle = ringStroke;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner Consistent Hash Token Ring
        ctx.strokeStyle = ringStroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.stroke();

        // Virtual token ticks on ring
        for (const shard of snap.shards) {
          if (!shard.alive) continue;
          ctx.strokeStyle = isPaper ? 'rgba(11,11,13,0.25)' : 'rgba(242,239,233,0.24)';
          for (const tok of shard.virtualTokens) {
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(tok) * (innerR - 4), cy + Math.sin(tok) * (innerR - 4));
            ctx.lineTo(cx + Math.cos(tok) * (innerR + 4), cy + Math.sin(tok) * (innerR + 4));
            ctx.stroke();
          }
        }

        // Live In-Flight Packets
        for (const pkt of snap.packets) {
          const r = innerR + ((pkt.radius - 0.56) / 0.44) * (outerR - innerR);
          const px = cx + Math.cos(pkt.angle) * r;
          const py = cy + Math.sin(pkt.angle) * r;
          ctx.fillStyle = pkt.remapped ? accent : okColor;
          ctx.beginPath();
          ctx.arc(px, py, pkt.remapped ? 3.1 : 2.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Physical Shard Nodes (Clickable)
        for (const shard of snap.shards) {
          const sx = cx + Math.cos(shard.angle) * innerR;
          const sy = cy + Math.sin(shard.angle) * innerR;

          ctx.fillStyle = shard.alive ? bg : isPaper ? '#FEE2E2' : '#261010';
          ctx.strokeStyle = shard.alive ? okColor : accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = shard.alive ? fgPrimary : accent;
          ctx.font = '600 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(shard.alive ? `S0${shard.id + 1}` : 'DEAD', sx, sy);

          // Outer telemetry label
          const lx = cx + Math.cos(shard.angle) * (innerR + 34);
          const ly = cy + Math.sin(shard.angle) * (innerR + 34);
          ctx.fillStyle = fgMuted;
          ctx.font = '500 9.5px "JetBrains Mono", monospace';
          ctx.fillText(shard.alive ? `${shard.keySharePct}%` : 'REROUTED', lx, ly);
        }

        // Center Telemetry Core
        ctx.fillStyle = fgPrimary;
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${snap.activeShardsCount}/8 SHARDS`, cx, cy - 8);
        ctx.fillStyle = fgMuted;
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillText('0% PACKET LOSS', cx, cy + 10);
      } else if (mode === 'RAFT_CONSENSUS') {
        const scale = minDim * 0.44;

        // Mesh edges between alive nodes
        ctx.strokeStyle = ringStroke;
        ctx.lineWidth = 1;
        for (let i = 0; i < snap.raftNodes.length; i++) {
          for (let j = i + 1; j < snap.raftNodes.length; j++) {
            const a = snap.raftNodes[i];
            const b = snap.raftNodes[j];
            if (!a.alive || !b.alive) continue;
            ctx.beginPath();
            ctx.moveTo(cx + a.x * scale, cy + a.y * scale);
            ctx.lineTo(cx + b.x * scale, cy + b.y * scale);
            ctx.stroke();
          }
        }

        // Live RPC Pulses (Heartbeats & Election Votes)
        for (const pulse of snap.raftPulses) {
          const a = snap.raftNodes[pulse.fromId];
          const b = snap.raftNodes[pulse.toId];
          if (!a || !b) continue;
          const px = cx + (a.x + (b.x - a.x) * pulse.progress) * scale;
          const py = cy + (a.y + (b.y - a.y) * pulse.progress) * scale;
          ctx.fillStyle =
            pulse.kind === 'HEARTBEAT'
              ? okColor
              : pulse.kind === 'REQUEST_VOTE'
              ? accent
              : fgPrimary;
          ctx.beginPath();
          ctx.arc(px, py, pulse.kind === 'HEARTBEAT' ? 3.2 : 4.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Raft Pentagon Nodes
        for (const node of snap.raftNodes) {
          const nx = cx + node.x * scale;
          const ny = cy + node.y * scale;
          const r = 28;

          // Election timeout progress arc
          if (node.alive && node.role !== 'LEADER') {
            const ratio = Math.min(1, node.electionElapsedMs / node.electionTimeoutMs);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(nx, ny, r + 6, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
            ctx.stroke();
          } else if (node.alive && node.role === 'LEADER') {
            ctx.strokeStyle = okColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(nx, ny, r + 7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.fillStyle = !node.alive
            ? isPaper
              ? '#FEE2E2'
              : '#231012'
            : node.role === 'LEADER'
            ? accent
            : bg;
          ctx.strokeStyle = !node.alive
            ? accent
            : node.role === 'LEADER'
            ? accent
            : fgPrimary;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(nx, ny, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle =
            node.alive && node.role === 'LEADER'
              ? '#FFFFFF'
              : !node.alive
              ? accent
              : fgPrimary;
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, nx, ny - 4);
          ctx.font = '500 8.5px "JetBrains Mono", monospace';
          ctx.fillText(!node.alive ? 'OFFLINE' : node.role, nx, ny + 9);
        }

        // Center Quorum Readout
        const aliveRaftCount = snap.raftNodes.filter((n) => n.alive).length;
        ctx.fillStyle = aliveRaftCount < 3 ? accent : snap.raftQuorumHealthy ? okColor : accent;
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          aliveRaftCount < 3
            ? 'NO QUORUM (<3/5) · CP HALTED'
            : snap.raftQuorumHealthy
            ? `TERM ${snap.raftTerm} · QUORUM HEALTHY`
            : `ELECTION IN FLIGHT (${aliveRaftCount}/5 ALIVE)`,
          cx,
          cy
        );
      } else {
        // Mode 3: HNSW Multi-Layer 384-d Vector Graph
        const trace = snap.hnswTrace;
        const padX = 28;
        const padY = 24;
        const mapX = (nx: number) => padX + nx * (w - padX * 2);
        const mapY = (ny: number) => padY + ny * (h - padY * 2);

        // Base Layer-0 & Layer-1 proximity graph edges
        ctx.strokeStyle = isPaper ? 'rgba(11,11,13,0.09)' : 'rgba(242,239,233,0.08)';
        ctx.lineWidth = 1;
        for (const node of snap.hnswNodes) {
          for (const nbId of node.neighborsL0) {
            if (nbId < node.id) continue;
            const other = snap.hnswNodes[nbId];
            ctx.beginPath();
            ctx.moveTo(mapX(node.x), mapY(node.y));
            ctx.lineTo(mapX(other.x), mapY(other.y));
            ctx.stroke();
          }
        }

        // Highlight Greedy Multi-Layer HNSW Beam Traversal Path!
        for (const stepEdge of trace.visitedPath) {
          const a = snap.hnswNodes[stepEdge.fromId];
          const b = snap.hnswNodes[stepEdge.toId];
          ctx.strokeStyle = stepEdge.layer === 2 ? accent : okColor;
          ctx.lineWidth = stepEdge.layer === 2 ? 2.4 : 1.9;
          ctx.beginPath();
          ctx.moveTo(mapX(a.x), mapY(a.y));
          ctx.lineTo(mapX(b.x), mapY(b.y));
          ctx.stroke();
        }

        const topIds = new Set(trace.topMatches.map((m) => m.id));
        const qx = mapX(trace.queryX);
        const qy = mapY(trace.queryY);

        // Dashed cosine vectors from Query Point to Top-3 Nearest Runbooks
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.4;
        for (const m of trace.topMatches) {
          const target = snap.hnswNodes[m.id];
          ctx.beginPath();
          ctx.moveTo(qx, qy);
          ctx.lineTo(mapX(target.x), mapY(target.y));
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw Semantic Runbook Nodes
        for (const node of snap.hnswNodes) {
          const nx = mapX(node.x);
          const ny = mapY(node.y);
          const isTop = topIds.has(node.id);
          const radius = isTop ? 7 : node.layer === 2 ? 5.5 : 3.8;

          ctx.fillStyle = isTop ? okColor : node.layer === 2 ? accent : fgPrimary;
          ctx.beginPath();
          ctx.arc(nx, ny, radius, 0, Math.PI * 2);
          ctx.fill();

          if (isTop || node.layer === 2) {
            ctx.fillStyle = isTop ? fgPrimary : fgMuted;
            ctx.font = `${isTop ? '700' : '500'} 9.5px "JetBrains Mono", monospace`;
            ctx.textAlign = 'left';
            ctx.fillText(node.code, nx + 9, ny - 5);
          }
        }

        // Draw Query Reticle Q(x, y) with high-contrast badge plate
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(qx, qy, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(qx - 16, qy);
        ctx.lineTo(qx + 16, qy);
        ctx.moveTo(qx, qy - 16);
        ctx.lineTo(qx, qy + 16);
        ctx.stroke();

        const tagText = 'QUERY_VEC[384d]';
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        const tw = ctx.measureText(tagText).width + 10;
        const bx = Math.min(w - tw - 8, Math.max(8, qx - tw * 0.5));
        const by = qy + 16;
        ctx.fillStyle = bg;
        ctx.fillRect(bx, by, tw, 16);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, tw, 16);
        ctx.fillStyle = accent;
        ctx.textAlign = 'center';
        ctx.fillText(tagText, bx + tw * 0.5, by + 11);
      }

      ctx.restore();
    };

    rafId = requestAnimationFrame(renderCanvas);
    return () => cancelAnimationFrame(rafId);
  }, [mode, theme]);

  const handleCanvasClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const snap = latestSnapshotRef.current;
    if (!canvas || !snap) return;

    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const minDim = Math.min(w, h);

    if (mode === 'CONSISTENT_HASHING') {
      const innerR = minDim * 0.255;
      for (const shard of snap.shards) {
        const sx = cx + Math.cos(shard.angle) * innerR;
        const sy = cy + Math.sin(shard.angle) * innerR;
        if (Math.hypot(x - sx, y - sy) <= 26) {
          tactileAudio.playFaultPulse();
          dispatchWorkerMessage({ type: 'TOGGLE_SHARD', shardId: shard.id });
          return;
        }
      }
    } else if (mode === 'RAFT_CONSENSUS') {
      const scale = minDim * 0.44;
      for (const node of snap.raftNodes) {
        const nx = cx + node.x * scale;
        const ny = cy + node.y * scale;
        if (Math.hypot(x - nx, y - ny) <= 34) {
          tactileAudio.playFaultPulse();
          dispatchWorkerMessage({ type: 'TOGGLE_RAFT_NODE', nodeId: node.id });
          return;
        }
      }
    } else {
      const padX = 28;
      const padY = 24;
      const qx = (x - padX) / Math.max(1, w - padX * 2);
      const qy = (y - padY) / Math.max(1, h - padY * 2);
      tactileAudio.playLatch();
      dispatchWorkerMessage({ type: 'QUERY_HNSW', x: qx, y: qy });
    }
  };

  const cursorHint =
    mode === 'CONSISTENT_HASHING'
      ? 'TOGGLE SHARD'
      : mode === 'RAFT_CONSENSUS'
      ? 'TOGGLE NODE'
      : 'INJECT VECTOR';

  return (
    <div className="hairline-box bg-[var(--bg-elevated)]">
      {/* Mode Control Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 hairline-b">
        <div className="lg:col-span-8 flex flex-wrap">
          {(
            [
              {
                id: 'CONSISTENT_HASHING',
                idx: '01',
                title: lang === 'vi' ? 'Băm Nhất Quán & Failover' : 'Consistent Hashing Ring',
                sub: '8 SHARDS × 12 VNODES',
              },
              {
                id: 'RAFT_CONSENSUS',
                idx: '02',
                title: lang === 'vi' ? 'Đồng Thuận Raft Quorum' : 'Raft Consensus Quorum',
                sub: 'LEADER ELECTION & CP GUARD',
              },
              {
                id: 'HNSW_VECTOR',
                idx: '03',
                title: lang === 'vi' ? 'Đồ Thị Vector HNSW 384-d' : 'HNSW 384-d Vector Graph',
                sub: 'MULTI-LAYER ANN BEAM SEARCH',
              },
            ] as const
          ).map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`lab-tab-${tab.id}`}
                data-cursor="SWITCH ENGINE"
                onClick={() => handleSelectMode(tab.id)}
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#FFFFFF' : 'var(--fg-primary)',
                }}
                className="flex-1 min-w-[200px] text-left px-4 py-3.5 hairline-r transition-colors cursor-pointer"
              >
                <div className="font-mono-tech text-[10px] opacity-80">[{tab.idx}] · {tab.sub}</div>
                <div className="font-semibold text-sm mt-0.5 tracking-tight">{tab.title}</div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-4 flex items-center justify-between px-4 py-3 gap-3 bg-[var(--bg-panel)]">
          <span className="font-mono-tech text-[10px] text-[var(--fg-muted)] uppercase">
            THREAD: DEDICATED WEB WORKER
          </span>
          <button
            type="button"
            data-testid="lab-trigger-fault"
            data-cursor="INJECT EVENT"
            onClick={handleTriggerScenario}
            className="px-3 py-1.5 border border-[var(--accent)] text-[var(--accent)] font-mono-tech text-[11px] font-semibold uppercase hover:bg-[var(--accent)] hover:!text-white transition-colors cursor-pointer"
          >
            {mode === 'CONSISTENT_HASHING'
              ? lang === 'vi'
                ? 'Ngắt 2 Shard Thử Tải'
                : 'Inject Dual-Shard Outage'
              : mode === 'RAFT_CONSENSUS'
              ? lang === 'vi'
                ? 'Hạ Gục Node Leader'
                : 'Assassinate Raft Leader'
              : lang === 'vi'
              ? 'Phóng Vector Ngẫu Nhiên'
              : 'Randomize Query Vector'}
          </button>
        </div>
      </div>

      {/* Main Split Viewport: Interactive Canvas + Live Precision Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 relative hairline-r min-h-[420px] sm:min-h-[460px]">
          <canvas
            ref={canvasRef}
            data-testid="distributed-lab-canvas"
            data-cursor={cursorHint}
            onClick={handleCanvasClick}
            className="w-full h-[420px] sm:h-[460px] block cursor-crosshair"
          />
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none font-mono-tech text-[10px] text-[var(--fg-secondary)] bg-[var(--bg-glass)] backdrop-blur-md px-3 py-1.5 hairline-box">
            <span>
              {mode === 'CONSISTENT_HASHING'
                ? lang === 'vi'
                  ? 'TƯƠNG TÁC: Click trực tiếp vào bất kỳ node S01–S08 trên vòng để tắt/bật shard và quan sát định tuyến lại.'
                  : 'INTERACTION: Click any S01–S08 ring node to kill/heal a shard and watch zero-loss virtual-token remapping.'
                : mode === 'RAFT_CONSENSUS'
                ? lang === 'vi'
                  ? 'TƯƠNG TÁC: Click vào node LEADER để gây phân mảnh mạng và kích hoạt bầu cử nhiệm kỳ mới.'
                  : 'INTERACTION: Click the LEADER node (or 3 nodes to break quorum) to observe live Raft election & CP safety.'
                : lang === 'vi'
                ? 'TƯƠNG TÁC: Click bất kỳ tọa độ nào trên mặt phẳng ngữ nghĩa để truy vết đường đi HNSW 3 tầng.'
                : 'INTERACTION: Click anywhere on the semantic plane to trace Layer-2 -> Layer-1 -> Layer-0 HNSW beam hops.'}
            </span>
            <span style={{ color: 'var(--signal-ok)' }}>60 FPS · ZERO GC</span>
          </div>
        </div>

        {/* Right Telemetry & Worker Micro-Benchmark Column */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-[var(--bg-panel)]">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between hairline-b pb-2.5">
              <span className="font-mono-tech text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">
                LIVE STATE TELEMETRY
              </span>
              <span
                style={{ color: 'var(--signal-ok)' }}
                className="font-mono-tech text-[11px] font-semibold"
              >
                ● INVARIANT INTACT
              </span>
            </div>

            {mode === 'CONSISTENT_HASHING' && (
              <div className="space-y-3 font-mono-tech text-xs">
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">ACTIVE SHARD NODES</span>
                  <strong className="text-[var(--fg-primary)]">{hudStats.activeShards} / 8 ONLINE</strong>
                </div>
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">REMAPPED KEYS (ZERO LOSS)</span>
                  <strong style={{ color: 'var(--accent)' }}>{hudStats.remappedTotal.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">ESTIMATED RING P99</span>
                  <strong style={{ color: 'var(--signal-ok)' }}>{hudStats.p99Ms} ms</strong>
                </div>
                <p className="font-sans text-xs leading-relaxed text-[var(--fg-secondary)] pt-1">
                  {lang === 'vi'
                    ? 'Mô hình hóa cách 700+ cửa hàng bán lẻ phân tải khóa phiên và hạn ngạch voucher qua FNV-1a Virtual Nodes: khi 1 node Redis sập, chỉ 1/N không gian khóa dịch chuyển sang node kế tiếp theo chiều kim đồng hồ.'
                    : 'Models how 700+ retail edge stores partition session & voucher quota keys across FNV-1a virtual ring tokens: when a shard drops, only 1/N keys migrate clockwise with zero full-cluster cache flush.'}
                </p>
              </div>
            )}

            {mode === 'RAFT_CONSENSUS' && (
              <div className="space-y-3 font-mono-tech text-xs">
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">ELECTED LEADER</span>
                  <strong style={{ color: 'var(--accent)' }}>{hudStats.raftLeader}</strong>
                </div>
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">MONOTONIC TERM</span>
                  <strong className="text-[var(--fg-primary)]">TERM #{hudStats.raftTerm}</strong>
                </div>
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">QUORUM COMMITTED LOGS</span>
                  <strong style={{ color: hudStats.raftQuorum ? 'var(--signal-ok)' : 'var(--accent)' }}>
                    {hudStats.raftCommits.toLocaleString()} OPS
                  </strong>
                </div>
                <p className="font-sans text-xs leading-relaxed text-[var(--fg-secondary)] pt-1">
                  {lang === 'vi'
                    ? 'Đảm bảo tính nhất quán tuyến tính (Linearizability): nếu số node sống tụt xuống dưới 3/5, Leader tự động hạ quyền để ngăn chặn tuyệt đối lỗi ghi hai nhánh (Split-Brain).'
                    : 'Enforces linearizable state-machine safety: randomized follower election timers prevent split votes, and minority partitions (<3/5) automatically step down to guarantee zero split-brain writes.'}
                </p>
              </div>
            )}

            {mode === 'HNSW_VECTOR' && (
              <div className="space-y-2.5 font-mono-tech text-xs">
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">TOP-1 SEMANTIC MATCH</span>
                  <strong style={{ color: 'var(--signal-ok)' }}>
                    {hudStats.hnswTopCode} ({(hudStats.hnswTopSim * 100).toFixed(1)}%)
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 hairline-b">
                  <span className="text-[var(--fg-secondary)]">BRUTE-FORCE PRUNED</span>
                  <strong style={{ color: 'var(--accent)' }}>-{hudStats.hnswSavedPct}% DISTANCE OPS</strong>
                </div>
                <div className="space-y-1.5 pt-1">
                  {hudStats.hnswMatches.map((m, idx) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-[11px] px-2.5 py-1.5 hairline-box bg-[var(--bg-elevated)]"
                    >
                      <span className="truncate pr-2">
                        0{idx + 1}. <strong>{m.code}</strong> · {m.title}
                      </span>
                      <span style={{ color: 'var(--signal-ok)' }}>{m.similarity.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Client Hardware Worker Micro-Benchmark Box */}
          <div className="p-5 hairline-t bg-[var(--bg-elevated)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                WEB WORKER HARDWARE BENCHMARK
              </span>
              <button
                type="button"
                data-testid="btn-worker-benchmark"
                data-cursor="EXECUTE SIMD"
                onClick={handleRunWorkerBenchmark}
                disabled={isBenchRunning}
                style={{
                  backgroundColor: 'var(--fg-primary)',
                  color: 'var(--bg-primary)',
                }}
                className="px-3 py-1 font-mono-tech text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
              >
                {isBenchRunning
                  ? 'COMPUTING...'
                  : lang === 'vi'
                  ? 'Đo Tốc Độ Máy Bạn'
                  : 'Run On Your CPU'}
              </button>
            </div>

            {benchResult ? (
              <div
                data-testid="worker-benchmark-output"
                className="grid grid-cols-3 gap-2 font-mono-tech text-[10px]"
              >
                <div className="p-2 hairline-box bg-[var(--bg-panel)]">
                  <span className="text-[var(--fg-muted)] block">384d DOT/S</span>
                  <strong className="text-xs text-[var(--fg-primary)]">
                    {(benchResult.vectorDotOpsPerSec / 1000).toFixed(0)}K/s
                  </strong>
                </div>
                <div className="p-2 hairline-box bg-[var(--bg-panel)]">
                  <span className="text-[var(--fg-muted)] block">FNV-1a RING</span>
                  <strong className="text-xs text-[var(--fg-primary)]">
                    {(benchResult.consistentHashLookupsPerSec / 1_000_000).toFixed(1)}M/s
                  </strong>
                </div>
                <div className="p-2 hairline-box bg-[var(--bg-panel)]">
                  <span className="text-[var(--fg-muted)] block">CAS LOCKS</span>
                  <strong style={{ color: 'var(--signal-ok)' }} className="text-xs">
                    {(benchResult.casTransitionsPerSec / 1_000_000).toFixed(1)}M/s
                  </strong>
                </div>
              </div>
            ) : (
              <p className="font-mono-tech text-[11px] text-[var(--fg-muted)]">
                {lang === 'vi'
                  ? 'Chạy thực tế tích vô hướng Float32Array 384 chiều, băm vòng FNV-1a và chuyển trạng thái CAS trên luồng Worker riêng.'
                  : 'Executes real 384-d Float32Array cosine products, FNV-1a hash lookups & CAS loops off the main UI thread.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

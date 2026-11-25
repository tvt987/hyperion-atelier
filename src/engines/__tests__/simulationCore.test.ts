import { describe, expect, it } from 'vitest';
import {
  DistributedLabEngine,
  executeHardwareMicroBenchmark,
} from '../simulationCore';

describe('DistributedLabEngine & Hardware Micro-Benchmark Suite', () => {
  it('maintains 100% consistent-hashing ring coverage and remaps in-flight packets on multi-shard failure', () => {
    const engine = new DistributedLabEngine();
    const initial = engine.step(16);
    expect(initial.activeShardsCount).toBe(8);
    expect(initial.zeroDroppedInvariant).toBe(true);

    // Kill 3 shards and verify surviving 5 shards absorb 100% of ring ownership
    engine.toggleShard(0);
    engine.toggleShard(3);
    engine.toggleShard(5);

    const afterOutage = engine.step(16);
    expect(afterOutage.activeShardsCount).toBe(5);
    expect(afterOutage.zeroDroppedInvariant).toBe(true);
    const totalShare = afterOutage.shards
      .filter((s) => s.alive)
      .reduce((acc, s) => acc + s.keySharePct, 0);
    expect(totalShare).toBeGreaterThan(99.0);
    expect(totalShare).toBeLessThanOrEqual(100.5);
  });

  it('prevents killing the final surviving shard to preserve ring availability invariant', () => {
    const engine = new DistributedLabEngine();
    for (let i = 0; i < 8; i++) {
      engine.toggleShard(i);
    }
    const snap = engine.step(16);
    expect(snap.activeShardsCount).toBe(1);
    expect(snap.zeroDroppedInvariant).toBe(true);
  });

  it('elects a new Raft Quorum Leader in a higher term after assassinating the initial leader', () => {
    const engine = new DistributedLabEngine();
    engine.mode = 'RAFT_CONSENSUS';
    const initial = engine.step(16);
    expect(initial.raftLeaderId).toBe(0);
    const initialTerm = initial.raftTerm;

    // Partition Leader RAFT-01
    engine.toggleRaftNode(0);

    let electedSnap = engine.step(50);
    for (let tick = 0; tick < 120; tick++) {
      electedSnap = engine.step(40);
      if (electedSnap.raftLeaderId !== null && electedSnap.raftLeaderId !== 0) {
        break;
      }
    }

    expect(electedSnap.raftLeaderId).not.toBeNull();
    expect(electedSnap.raftLeaderId).not.toBe(0);
    expect(electedSnap.raftTerm).toBeGreaterThan(initialTerm);
    expect(electedSnap.raftQuorumHealthy).toBe(true);
  });

  it('halts Raft leadership when minority partition (<3/5 alive) breaks quorum (CP split-brain guard)', () => {
    const engine = new DistributedLabEngine();
    engine.toggleRaftNode(1);
    engine.toggleRaftNode(2);
    engine.toggleRaftNode(3);

    const snap = engine.step(50);
    expect(snap.raftQuorumHealthy).toBe(false);
    expect(snap.raftLeaderId).toBeNull();
  });

  it('executes multi-layer HNSW 384-d greedy beam search and prunes brute-force comparisons', () => {
    const engine = new DistributedLabEngine();
    const trace = engine.queryHnsw(0.24, 0.72);
    expect(trace.topMatches).toHaveLength(3);
    expect(trace.topMatches[0].similarity).toBeGreaterThanOrEqual(trace.topMatches[1].similarity);
    expect(trace.computeSavedPct).toBeGreaterThanOrEqual(18);
  });

  it('runs real Float32Array vector dot-products, FNV-1a ring hashes, and CAS loops', () => {
    const metrics = executeHardwareMicroBenchmark();
    expect(metrics.vectorDotOpsPerSec).toBeGreaterThan(1000);
    expect(metrics.consistentHashLookupsPerSec).toBeGreaterThan(10000);
    expect(metrics.casTransitionsPerSec).toBeGreaterThan(10000);
  });
});

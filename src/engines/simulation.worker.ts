/// <reference lib="webworker" />
import {
  DistributedLabEngine,
  executeHardwareMicroBenchmark,
  type LabSimulationMode,
} from './simulationCore';

export type WorkerInboundMessage =
  | { type: 'SET_MODE'; mode: LabSimulationMode }
  | { type: 'TOGGLE_SHARD'; shardId: number }
  | { type: 'TOGGLE_RAFT_NODE'; nodeId: number }
  | { type: 'QUERY_HNSW'; x: number; y: number }
  | { type: 'RUN_BENCHMARK' }
  | { type: 'PAUSE'; paused: boolean };

const engine = new DistributedLabEngine();
let paused = false;
let lastTs = performance.now();

function broadcastSnapshot(dt = 16.67) {
  const snapshot = engine.step(dt);
  self.postMessage({ type: 'SNAPSHOT', payload: snapshot });
}

const intervalId = setInterval(() => {
  if (paused) {
    lastTs = performance.now();
    return;
  }
  const now = performance.now();
  const dt = Math.min(50, Math.max(8, now - lastTs));
  lastTs = now;
  broadcastSnapshot(dt);
}, 33); // Smooth 30Hz physics snapshot stream decoupled from 60/120Hz canvas interpolation

self.onmessage = (ev: MessageEvent<WorkerInboundMessage>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'SET_MODE':
      engine.mode = msg.mode;
      broadcastSnapshot(0);
      break;
    case 'TOGGLE_SHARD':
      engine.toggleShard(msg.shardId);
      broadcastSnapshot(0);
      break;
    case 'TOGGLE_RAFT_NODE':
      engine.toggleRaftNode(msg.nodeId);
      broadcastSnapshot(0);
      break;
    case 'QUERY_HNSW':
      engine.queryHnsw(msg.x, msg.y);
      broadcastSnapshot(0);
      break;
    case 'RUN_BENCHMARK': {
      const result = executeHardwareMicroBenchmark();
      self.postMessage({ type: 'BENCHMARK_RESULT', payload: result });
      break;
    }
    case 'PAUSE':
      paused = msg.paused;
      break;
    default:
      break;
  }
};

export { intervalId };

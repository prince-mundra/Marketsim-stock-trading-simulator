import { getStockSnapshot, updateSimulatedPrices } from '../services/stockPriceService.js';

export function attachStockSocket(io) {
  io.on('connection', async (socket) => {
    socket.emit('market:status', {
      mode: 'PAPER_TRADING',
      dataSource: 'SIMULATED',
      message: 'All prices are simulated for practice only.',
    });
    try {
      const snapshot = await getStockSnapshot();
      socket.emit('price:snapshot', snapshot);
    } catch {
      console.error('[socket-snapshot] Unable to load simulated prices.');
    }
  });
}

export function startPriceEngine(io, intervalMs = 5000) {
  let inFlight = false;
  const timer = setInterval(async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      const prices = await updateSimulatedPrices();
      if (prices.length) io.emit('price:update', { timestamp: new Date().toISOString(), dataSource: 'SIMULATED', prices });
    } catch {
      console.error('[price-engine] Simulated price update failed.');
    } finally {
      inFlight = false;
    }
  }, intervalMs);
  timer.unref?.();
  return timer;
}

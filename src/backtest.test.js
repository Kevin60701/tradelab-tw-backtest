import test from 'node:test';
import assert from 'node:assert/strict';
import { runBacktest, DEFAULTS } from './backtest.js';
import { generateBars, STOCKS } from './data.js';

test('合成日線資料可重現且 OHLC 關係正確', () => {
  const a = generateBars(STOCKS[0], 30), b = generateBars(STOCKS[0], 30);
  assert.deepEqual(a, b); assert.equal(a.length, 30);
  for (const bar of a) { assert.ok(bar.high >= Math.max(bar.open, bar.close)); assert.ok(bar.low <= Math.min(bar.open, bar.close)); }
});
test('空資料安全回傳初始資金與零交易', () => {
  const result = runBacktest([]);
  assert.equal(result.metrics.finalCapital, DEFAULTS.initialCapital); assert.equal(result.metrics.tradeCount, 0);
});
test('回測使用歷史資料並輸出有限資產曲線與完整交易', () => {
  const result = runBacktest(generateBars(STOCKS[0], 260));
  assert.equal(result.equity.length, 260); assert.ok(result.trades.length > 0);
  assert.ok(result.equity.every(x => Number.isFinite(x.value) && x.value >= 0));
  assert.equal(result.metrics.tradeCount, result.trades.length);
  assert.ok(result.trades.every(t => t.entryDate <= t.exitDate && Number.isFinite(t.pnl)));
});
test('突破判斷不會讀取當日以後資料', () => {
  const bars = [10, 10, 10, 10, 12, 11, 10.5, 11].map((close, i) => ({ date: `d${i}`, open: close, high: close + .1, low: close - .1, close }));
  const first = runBacktest(bars, { lookback: 3, pullbackPct: 10, stopLossPct: 50, takeProfitPct: 50, feeRate: 0, taxRate: 0 });
  const changedFuture = bars.map(x => ({ ...x })); changedFuture[7].high = 99;
  const second = runBacktest(changedFuture, { lookback: 3, pullbackPct: 10, stopLossPct: 50, takeProfitPct: 50, feeRate: 0, taxRate: 0 });
  assert.equal(first.trades[0]?.signalDate, 'd4'); assert.equal(second.trades[0]?.signalDate, 'd4');
});

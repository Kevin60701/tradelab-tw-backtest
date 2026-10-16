export const DEFAULTS = { lookback: 20, pullbackPct: 2, stopLossPct: 5, takeProfitPct: 12, initialCapital: 1_000_000, feeRate: 0.001425, taxRate: 0.003 };

// 僅使用當日以前的收盤價判定突破；突破後等待回檔觸及突破價附近，於收盤確認買入。
// 同一根 K 棒若停損與停利都觸及，採保守的停損優先。最後一筆持倉於資料結尾平倉。
export function runBacktest(bars, params = {}) {
  const p = { ...DEFAULTS, ...params };
  if (!Array.isArray(bars) || bars.length < 2) return { trades: [], equity: [], metrics: emptyMetrics(p.initialCapital) };
  const trades = [], equity = []; let cash = p.initialCapital, position = null, candidate = null;
  const fee = p.feeRate, tax = p.taxRate;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (position) {
      let exitPrice = null, reason = '';
      if (bar.low <= position.stop) { exitPrice = Math.min(bar.open, position.stop); reason = '停損'; }
      else if (bar.high >= position.target) { exitPrice = Math.max(bar.open, position.target); reason = '停利'; }
      else if (i === bars.length - 1) { exitPrice = bar.close; reason = '回測結束'; }
      if (exitPrice !== null) {
        const gross = (exitPrice - position.entry) * position.shares;
        const costs = (position.entry * position.shares + exitPrice * position.shares) * fee + Math.max(0, gross) * tax;
        const pnl = gross - costs; cash += position.entry * position.shares + pnl;
        trades.push({ ...position, exitDate: bar.date, exitPrice, gross, costs, pnl, returnPct: pnl / (position.entry * position.shares) * 100, reason }); position = null;
      }
    }
    if (!position && candidate && i > candidate.index) {
      if (bar.low <= candidate.level * (1 + p.pullbackPct / 100) && bar.close >= candidate.level * (1 - p.pullbackPct / 100)) {
        const entry = bar.close, budget = cash, shares = Math.floor(budget / (entry * (1 + fee)));
        if (shares > 0) {
          const cost = entry * shares * (1 + fee); cash -= cost;
          position = { entryDate: bar.date, entry, shares, stop: entry * (1 - p.stopLossPct / 100), target: entry * (1 + p.takeProfitPct / 100), signalDate: candidate.date, breakoutLevel: candidate.level };
        }
        candidate = null;
      } else if (i - candidate.index > Math.max(5, Math.floor(p.lookback / 2))) candidate = null;
    }
    if (!position && !candidate && i >= p.lookback) {
      const priorHigh = Math.max(...bars.slice(i - p.lookback, i).map(x => x.high));
      if (bar.close > priorHigh) candidate = { index: i, date: bar.date, level: priorHigh };
    }
    equity.push({ date: bar.date, value: cash + (position ? position.shares * bar.close : 0) });
  }
  return { trades, equity, metrics: calculateMetrics(trades, equity, p.initialCapital) };
}
function emptyMetrics(initial) { return { totalReturn: 0, annualizedReturn: 0, maxDrawdown: 0, winRate: 0, profitFactor: 0, tradeCount: 0, finalCapital: initial }; }
export function calculateMetrics(trades, equity, initialCapital) {
  const finalCapital = equity.at(-1)?.value ?? initialCapital;
  let peak = initialCapital, maxDrawdown = 0;
  for (const point of equity) { peak = Math.max(peak, point.value); maxDrawdown = Math.max(maxDrawdown, peak ? (peak - point.value) / peak : 0); }
  const wins = trades.filter(t => t.pnl > 0), losses = trades.filter(t => t.pnl < 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0), grossLoss = -losses.reduce((s, t) => s + t.pnl, 0);
  const totalReturn = (finalCapital / initialCapital - 1) * 100;
  const years = Math.max(1 / 252, equity.length / 252);
  const annualizedReturn = (Math.pow(Math.max(0, finalCapital / initialCapital), 1 / years) - 1) * 100;
  return { totalReturn, annualizedReturn, maxDrawdown: maxDrawdown * 100, winRate: trades.length ? wins.length / trades.length * 100 : 0, profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0, tradeCount: trades.length, finalCapital };
}

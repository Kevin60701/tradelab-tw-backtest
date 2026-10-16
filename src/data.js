// 固定亂數種子產生的合成日線 OHLC 資料，非真實行情。
export const STOCKS = [
  { symbol: '2330', name: '台積電', color: '#55d6be', start: 612, drift: 0.0012, vol: 0.018 },
  { symbol: '2454', name: '聯發科', color: '#a78bfa', start: 1080, drift: 0.0008, vol: 0.023 },
  { symbol: '2603', name: '長榮', color: '#f6ad55', start: 168, drift: 0.0006, vol: 0.028 },
  { symbol: '2317', name: '鴻海', color: '#60a5fa', start: 148, drift: 0.0009, vol: 0.019 },
];
function rng(seed) { let x = seed >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
export function generateBars(stock, count = 260) {
  const random = rng(Number(stock.symbol) * 31 + 2026); let close = stock.start; const bars = [];
  const date = new Date(Date.UTC(2025, 0, 2));
  while (bars.length < count) {
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) {
      const open = close * (1 + (random() - 0.5) * stock.vol * 0.55);
      const change = stock.drift + (random() - 0.49) * stock.vol * 1.6;
      close = Math.max(10, open * (1 + change));
      const high = Math.max(open, close) * (1 + random() * stock.vol * 0.42);
      const low = Math.min(open, close) * (1 - random() * stock.vol * 0.42);
      bars.push({ date: date.toISOString().slice(0, 10), open, high, low, close, volume: Math.round(8000 + random() * 72000) });
    }
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return bars;
}

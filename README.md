# TradeLab｜台股策略回測工作台

以 React、Vite 與 JavaScript 製作的單頁互動式回測儀表板。適合作為「用 Vibe Coding 做出互動網頁」作業展示。

> **資料揭露：**內建行情為固定亂數種子產生的合成 OHLC 日線，不是真實台股歷史價格或即時報價。此專案僅供教育與策略研究，不構成投資建議。

## 功能

- 深色科技風單頁儀表板，繁體中文介面、響應式排版。
- 四檔示範標的：2330 台積電、2454 聯發科、2603 長榮、2317 鴻海；切換近半年、一年、三年資料區間。
- 突破前高後回檔買進策略，支援觀察天數、回檔幅度、停損與停利參數調整。
- 回測從歷史 OHLC 逐日執行。突破判斷僅取當日之前的最高價；突破後才等待回檔訊號，並於當日收盤確認進場，不讀取未來資料。
- 以起始資金 NT$1,000,000 計算，納入買賣手續費各 0.1425% 與獲利證交稅 0.3%。同根 K 棒同時觸及停損與停利時採保守停損優先。未平倉於回測末日收盤出場。
- 顯示資產曲線、總報酬、年化報酬、最大回撤、勝率、獲利因子與交易明細，可匯出 CSV。

## 本機執行

需要 Node.js 18+。

```bash
npm install
npm run dev
```

## 測試與正式建置

```bash
npm test
npm run build
npm run preview
```

測試涵蓋合成資料可重現性與 OHLC 關係、空資料處理、回測交易輸出，以及突破訊號不受未來 K 棒影響。

## GitHub Pages 部署

1. 建立 GitHub repository，名稱使用 `tradelab-tw-backtest`；若採其他名稱，請同步修改 `vite.config.js` 中 GitHub Pages 的 `base` 路徑。
2. 將此專案推送至 repository 的 `main` 分支。
3. 進入 **Settings → Pages**，將 **Build and deployment** 的來源設為 **GitHub Actions**。
4. 每次推送到 `main` 時，`.github/workflows/deploy.yml` 會安裝依賴、執行測試與正式建置，並發布 `dist`。
5. 到 **Actions** 確認 `Deploy to GitHub Pages` 工作成功，再由 Pages 顯示的網址驗證頁面與路由資源。

部署只會在 GitHub Actions 真正成功後才算完成；本地建置成功不代表網站已公開。
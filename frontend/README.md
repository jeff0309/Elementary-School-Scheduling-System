# 國小科任排課系統 (Frontend)

這是使用 React + Vite 建置的前端專案，負責呈現排課系統的操作介面。

## 環境變數設定

在開始開發或部署之前，請先確認已設定正確的環境變數。可以參考 `.env.example` 檔案建立 `.env`：

```bash
cp .env.example .env
```

`.env` 檔案中需要包含以下環境變數（主要用於本地端開發）：
- `VITE_GAS_URL`：Google Apps Script 部署後的 Web App 網址。

## GitHub Pages 自動部署

本專案已設定 GitHub Actions 工作流程 (`.github/workflows/deploy.yml`)，當程式碼推送到 `main` 分支時，會自動編譯前端並幫你部署到 GitHub Pages。自動部署過程會動態讀取你設定在 GitHub 上的環境變數。

**部署前的必要準備步驟：**

1. 進入你的 GitHub 儲存庫設定 (Settings)。
2. 導航至 **Secrets and variables > Actions**。
3. 點選 **New repository secret**，新增一個名為 `VITE_GAS_URL` 的 Secret，並將內容填入你的 Google Apps Script Web App 網址。
4. 進入 Repository 設定中的 **Actions > General**，確認 **Workflow permissions** 已經勾選 `Read and write permissions`。
5. (重要) 推送程式碼觸發 Actions 若成功執行後，前往設定中的 **Pages**，將 **Build and deployment > Source** 設定為 `Deploy from a branch`，並選擇 `gh-pages` 分支的 `/ (root)` 資料夾。
6. (重要) 如果你是將專案部署在子路徑 (例如 `https://<username>.github.io/<repo-name>/`) 而不是根目錄上，請記得在推送到遠端前，先於 `frontend/vite.config.js` 中加上 `base: '/<repo-name>/'` 參數以避免載入不到靜態資源。

推送包含上述設定的專案到 `main` 分支後，就能自動觸發建構與發布流程！

## 常用指令

- `npm run dev`: 啟動本地端開發伺服器
- `npm run build`: 編譯用於正式發布的靜態檔案
- `npm run preview`: 預覽編譯後的成果

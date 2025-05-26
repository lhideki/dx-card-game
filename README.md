# 課題解決DXカードゲーム

## 概要
「課題解決DXカードゲーム」は、DX用語カードを駆使してビジネス上の課題解決を目指すWebアプリです。各カードには効果とコストが設定されており、選択したカードを基にGemini APIが状況を評価します。戦略的にカードを使いながら、より良い解決策を導き出してください。

## 必要環境
- Node.js (推奨バージョン18以上)

## セットアップ
1. 依存パッケージのインストール
   ```bash
   npm install
   ```
2. Gemini APIキーの設定
   プロジェクトルートに`.env.local`を作成し、次の内容を記述します。
   ```env
   GEMINI_API_KEY=あなたのAPIキー
   ```
3. 開発サーバーの起動
   ```bash
   npm run dev
   ```
   起動後、ブラウザで`http://localhost:5173`(デフォルト)にアクセスしてください。

## ビルド
本番用ビルドは以下で実行できます。
```bash
npm run build
```
ビルド結果は`dist`ディレクトリに出力され、`npm run preview`で確認できます。

## ファイル構成
- `App.tsx` – ゲーム全体のロジック
- `components/` – 各種Reactコンポーネント
- `constants.ts` – カード・テーマなどの定義
- `services/geminiService.ts` – Gemini APIとの通信処理

カードセットやテーマを追加・編集することで、独自のゲームルールを作成することも可能です。

## Google Cloud Runへのデプロイ

このアプリをGoogle Cloud Runに公開するには、Dockerイメージをビルドしてデプロイします。

1. Dockerイメージのビルドと登録
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/dx-card-game .
   ```
2. Cloud Runへデプロイ
   ```bash
   gcloud run deploy dx-card-game \
      --image gcr.io/PROJECT_ID/dx-card-game \
      --platform managed \
      --region asia-northeast1 \
      --allow-unauthenticated \
      --set-env-vars GEMINI_API_KEY=あなたのAPIキー
   ```

デプロイ後、表示されるサービスURLからアプリにアクセスできます。

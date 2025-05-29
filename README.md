# 課題解決 DX カードゲーム

## 概要

「課題解決 DX カードゲーム」は、DX 用語カードを駆使してビジネス上の課題解決を目指す Web アプリです。各カードには効果とコストが設定されており、選択したカードを基に Gemini API が状況を評価します。戦略的にカードを使いながら、より良い解決策を導き出してください。

## 必要環境

-   Node.js (推奨バージョン 18 以上)
-   Docker
-   gcloud CLI

## セットアップ

1. 依存パッケージのインストール
    ```bash
    npm install
    ```
2. Gemini API キーの設定
   プロジェクトルートに`.env.local`を作成し、次の内容を記述します。
    ```env
    GEMINI_API_KEY=あなたのAPIキー
    ```
3. 開発サーバーの起動
    ```bash
    npm run dev
    ```
    起動後、ブラウザで`http://localhost:3000`にアクセスしてください。

## ビルド

本番用ビルドは以下で実行できます。

```bash
npm run build
```

ビルド後は `npm start` で生成された`.next` ディレクトリを用いてアプリを起動できます。

## ファイル構成

-   `components/Game.tsx` – ゲーム全体のロジック
-   `components/` – 各種 React コンポーネント
-   `constants.ts` – カード・テーマなどの定義
-   `services/geminiService.ts` – Gemini API との通信処理

カードセットやテーマを追加・編集することで、独自のゲームルールを作成することも可能です。

## Dockerfile

Cloud Run へデプロイするための基本的な Dockerfile 例です。コンテナ実行時に Cloud Run から渡される`PORT`変数を利用して Next.js を起動します。
本リポジトリには下記内容の`Dockerfile`が同梱されています。

```Dockerfile
# Use Node.js 18 to install dependencies and build the Next.js app
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
```

### ローカルでの Docker 動作確認

```bash
docker build -t dx-card-game .
docker run -p 8080:8080 -e PORT=8080 dx-card-game
```

## Google Cloud Run へのデプロイ

以下は Google Cloud Run でデプロイする一例です。事前に`gcloud` CLI と Google Cloud プロジェクトの設定を済ませてください。

### 環境準備

-   Docker と gcloud CLI をインストール
-   `gcloud auth login` で認証
-   `gcloud config set project {YOUR_PROJECT_ID}` でプロジェクトを設定

### Artifact Registry 用の Docker 設定

```bash
gcloud auth configure-docker us-docker.pkg.dev
```

### レジストリへプッシュ

```bash
gcloud builds submit --tag us-west1-docker.pkg.dev/{YOUR_PROJECT_ID}/dx-card-game/app:latest .
```

### Cloud Run へデプロイ (任意)

```bash
gcloud run deploy dx \
    --image us-west1-docker.pkg.dev/{YOUR_PROJECT_ID}/dx-card-game/app:latest \
    --region us-west1 \
    --allow-unauthenticated
    --set-env-vars GEMINI_API_KEY=YOUR_API_KEY
```

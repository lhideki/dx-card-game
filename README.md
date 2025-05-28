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
   起動後、ブラウザで`http://localhost:3000`にアクセスしてください。

## ビルド
本番用ビルドは以下で実行できます。
```bash
npm run build
```
ビルド後は`npm start`でアプリを起動できます。

## ファイル構成
 - `components/Game.tsx` – ゲーム全体のロジック
- `components/` – 各種Reactコンポーネント
- `constants.ts` – カード・テーマなどの定義
- `services/geminiService.ts` – Gemini APIとの通信処理

カードセットやテーマを追加・編集することで、独自のゲームルールを作成することも可能です。

## AWS App Runnerでのデプロイ例

このアプリをAWS App Runnerで動かす場合、以下のようなDockerfileを用意してビルドします。

```Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV HOSTNAME=0.0.0.0
CMD ["npm", "start"]
```

ビルド後、App Runnerのサービス設定で上記コンテナイメージを指定し、`HOSTNAME` 環境変数を`0.0.0.0`に設定してください。これによりヘルスチェックが通りやすくなります。

### ローカルでのDocker動作確認
```bash
docker build -t dx-card-game .
docker run -p 3000:3000 dx-card-game
```
## Google Cloud Runへのデプロイ

以下はGoogle Cloud Runでデプロイする一例です。事前に`gcloud` CLIとGoogle Cloudプロジェクトの設定を済ませてください。

1. DockerイメージをビルドしてContainer Registryへ送信
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/dx-card-game
   ```
2. Cloud Runサービスを作成してデプロイ
   ```bash
   gcloud run deploy dx-card-game \
     --image gcr.io/PROJECT_ID/dx-card-game \
     --platform managed \
     --region asia-northeast1 \
     --allow-unauthenticated
   ```
   デプロイ完了後、表示されるURLからアプリにアクセスできます。

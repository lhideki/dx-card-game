# 課題解決DXカードゲーム

## 概要
「課題解決DXカードゲーム」は、DX用語カードを駆使してビジネス上の課題解決を目指すWebアプリです。各カードには効果とコストが設定されており、選択したカードを基にGemini APIが状況を評価します。戦略的にカードを使いながら、より良い解決策を導き出してください。

## 必要環境
- Node.js (推奨バージョン18以上)
- Docker
- gcloud CLI

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
ビルド後は `npm start` で生成された`.next` ディレクトリを用いてアプリを起動できます。

## ファイル構成
- `components/Game.tsx` – ゲーム全体のロジック
- `components/` – 各種Reactコンポーネント
- `constants.ts` – カード・テーマなどの定義
- `services/geminiService.ts` – Gemini APIとの通信処理

カードセットやテーマを追加・編集することで、独自のゲームルールを作成することも可能です。

## Dockerfile

Cloud Runへデプロイするための基本的なDockerfile例です。コンテナ実行時にCloud Runから渡される`PORT`変数を利用してNext.jsを起動します。
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

### ローカルでのDocker動作確認
```bash
docker build -t dx-card-game .
docker run -p 8080:8080 -e PORT=8080 dx-card-game
```

## Google Cloud Runへのデプロイ

以下はGoogle Cloud Runでデプロイする一例です。事前に`gcloud` CLIとGoogle Cloudプロジェクトの設定を済ませてください。

1. DockerイメージをビルドしてArtifact Registryへ送信
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/dx-card-game
   ```
2. Cloud Runサービスを作成してデプロイ
   ```bash
   gcloud run deploy dx-card-game \
     --image gcr.io/PROJECT_ID/dx-card-game \
     --platform managed \
     --region asia-northeast1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=YOUR_API_KEY
   ```
   デプロイ完了後、表示されるURLからアプリにアクセスできます。

### YAMLによるデプロイ

本リポジトリにはCloud Runサービス定義`cloudrun.yaml`を同梱しています。`YOUR_API_KEY`
を実際の値に変更したうえで、以下のコマンドで適用できます。

```bash
gcloud run services replace cloudrun.yaml
```

`cloudrun.yaml`の内容は次のとおりです。

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: dx
  namespace: '537832106570'
  labels:
    managed-by: google-ai-studio
    cloud.googleapis.com/location: us-west1
  annotations:
    serving.knative.dev/creator: hideki@inoue-kobo.com
    serving.knative.dev/lastModifier: hideki@inoue-kobo.com
    generativelanguage.googleapis.com/type: applet
    run.googleapis.com/ingress: all
    run.googleapis.com/invoker-iam-disabled: 'true'
    run.googleapis.com/build-enable-automatic-updates: 'false'
spec:
  template:
    metadata:
      labels:
        run.googleapis.com/startupProbeType: Default
      annotations:
        run.googleapis.com/sessionAffinity: 'false'
        autoscaling.knative.dev/minScale: '0'
        autoscaling.knative.dev/maxScale: '3'
        run.googleapis.com/base-images: '{"":"us-central1-docker.pkg.dev/serverless-runtimes/google-22/runtimes/nodejs22"}'
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      serviceAccountName: 537832106570-compute@developer.gserviceaccount.com
      containers:
      - image: us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy
        ports:
        - name: http1
          containerPort: 8080
        env:
        - name: API_KEY
          value: YOUR_API_KEY
        resources:
          limits:
            memory: 512Mi
            cpu: 1000m
        volumeMounts:
        - name: applet
          mountPath: /app/dist
        startupProbe:
          timeoutSeconds: 240
          periodSeconds: 240
          failureThreshold: 1
          tcpSocket:
            port: 8080
      volumes:
      - name: applet
        csi:
          driver: gcsfuse.run.googleapis.com
          readOnly: true
          volumeAttributes:
            bucketName: ai-studio-bucket-537832106570-us-west1
            mountOptions: only-dir=services/dx/version-5/compiled
      runtimeClassName: run.googleapis.com/linux-base-image-update
  traffic:
  - percent: 100
    latestRevision: true
```


### us-docker.pkg.devへのコンテナプッシュ手順

以下の手順で `us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy` にイメージをプッシュできます。

1. **環境準備**
   - Docker と gcloud CLI をインストール
   - `gcloud auth login` で認証
   - `gcloud config set project YOUR_PROJECT_ID` でプロジェクトを設定

2. **Artifact Registry 用の Docker 設定**
   ```bash
   gcloud auth configure-docker us-docker.pkg.dev
   ```

3. **イメージのビルドとタグ付け**
   ```bash
   docker build -t us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG .
   ```

4. **レジストリへプッシュ**
   ```bash
   docker push us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG
   ```
   Cloud Build を利用する場合:
   ```bash
   gcloud builds submit --tag us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG .
   ```

5. **Cloud Run へデプロイ (任意)**
   ```bash
   gcloud run deploy dx \
     --image us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG \
     --region us-west1 \
     --allow-unauthenticated
   ```
```


### us-docker.pkg.devへのコンテナプッシュ手順

以下の手順で `us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy` にイメージをプッシュできます。

1. **環境準備**
   - Docker と gcloud CLI をインストール
   - `gcloud auth login` で認証
   - `gcloud config set project YOUR_PROJECT_ID` でプロジェクトを設定

2. **Artifact Registry 用の Docker 設定**
   ```bash
   gcloud auth configure-docker us-docker.pkg.dev
   ```

3. **イメージのビルドとタグ付け**
   ```bash
   docker build -t us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG .
   ```

4. **レジストリへプッシュ**
   ```bash
   docker push us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG
   ```
   Cloud Build を利用する場合:
   ```bash
   gcloud builds submit --tag us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG .
   ```

5. **Cloud Run へデプロイ (任意)**
   ```bash
   gcloud run deploy dx \
     --image us-docker.pkg.dev/cloudrun/container/aistudio/applet-proxy:TAG \
     --region us-west1 \
     --allow-unauthenticated
   ```

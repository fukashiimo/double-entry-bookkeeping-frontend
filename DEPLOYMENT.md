# 🚀 フロントエンド デプロイメントガイド

## 📋 前提条件

1. **Node.js**: v18以上がインストールされていること
2. **npm**: パッケージマネージャー
3. **Git**: バージョン管理
4. **Vercel/Netlifyアカウント**: デプロイ先（推奨: Vercel）

## 🏗️ ローカル開発環境のセットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
```bash
# .env.localファイルを作成
cp .env.example .env.local
```

`.env.local`ファイルに以下を設定：
```env
VITE_SUPABASE_URL=https://snwmoptdzwlrtfhdawrm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNud21vcHRkendscnRmaGRhd3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzE0NDksImV4cCI6MjA3MjgwNzQ0OX0.jY7hPj9jN0Wv0B5_H_GMe4pPracv3SYd-fstAw-ottE
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションは `http://localhost:5173` で起動します。

## 🌐 Vercel へのデプロイ（推奨）

### 1. Vercel CLIのインストール
```bash
npm install -g vercel
```

### 2. Vercelにログイン
```bash
vercel login
```

### 3. プロジェクトのデプロイ
```bash
# プロジェクトルートで実行
vercel

# 初回デプロイ時は以下の質問に答える
# ? Set up and deploy "~/path/to/project"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? double-entry-bookkeeping-frontend
# ? In which directory is your code located? ./
```

### 4. 環境変数の設定
Vercel Dashboardで環境変数を設定：
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. Settings > Environment Variables
4. 以下の変数を追加：
   - `VITE_SUPABASE_URL`: `https://snwmoptdzwlrtfhdawrm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. 再デプロイ
```bash
vercel --prod
```

## 🌐 Netlify へのデプロイ

### 1. ビルド設定ファイルの作成
`netlify.toml`ファイルを作成：
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. GitHubリポジトリにプッシュ
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### 3. Netlifyでサイトを作成
1. [Netlify Dashboard](https://app.netlify.com) にアクセス
2. "New site from Git" をクリック
3. GitHubを選択
4. リポジトリ `double-entry-bookkeeping-frontend` を選択
5. ビルド設定を確認：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. "Deploy site" をクリック

### 4. 環境変数の設定
1. Netlify Dashboard > Site settings > Environment variables
2. 以下の変数を追加：
   - `VITE_SUPABASE_URL`: `https://snwmoptdzwlrtfhdawrm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. 再デプロイ
環境変数設定後、手動で再デプロイを実行

## 🧪 動作確認

### ローカル環境
```bash
# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:5173 にアクセス
```

### 本番環境
デプロイ後、提供されたURLにアクセスして以下を確認：
- [ ] アプリケーションが正常に読み込まれる
- [ ] 勘定科目設定ページが動作する
- [ ] 仕訳入力フォームが動作する
- [ ] ダッシュボードが表示される

## 🔧 ビルドとテスト

### ビルド
```bash
npm run build
```

### プレビュー
```bash
npm run preview
```

### リンター
```bash
npm run lint
```

## 📊 監視とログ

### Vercel
1. [Vercel Dashboard](https://vercel.com/dashboard)
2. プロジェクト > Functions タブでログを確認

### Netlify
1. [Netlify Dashboard](https://app.netlify.com)
2. プロジェクト > Functions タブでログを確認

## 🚨 トラブルシューティング

### よくある問題

1. **環境変数が読み込まれない**
   - `.env.local`ファイルが正しい場所にあるか確認
   - 変数名が`VITE_`で始まっているか確認
   - 開発サーバーを再起動

2. **ビルドエラー**
   - Node.jsのバージョンを確認（v18以上）
   - `npm install`を再実行
   - `node_modules`を削除して再インストール

3. **API接続エラー**
   - SupabaseのURLとキーが正しいか確認
   - ネットワーク接続を確認
   - ブラウザの開発者ツールでエラーを確認

4. **CORS エラー**
   - Supabaseの設定でフロントエンドのドメインが許可されているか確認

## 📈 パフォーマンス最適化

### Vite設定の最適化
`vite.config.ts`で以下を設定：
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mantine/core', '@mantine/hooks'],
        },
      },
    },
  },
})
```

### 画像最適化
- WebP形式の使用
- 適切なサイズでの画像提供
- 遅延読み込みの実装

## 🔒 セキュリティ

### 推奨事項
1. **環境変数**: 機密情報は環境変数で管理
2. **HTTPS**: 本番環境では必ずHTTPSを使用
3. **CSP**: Content Security Policyの設定
4. **依存関係**: 定期的なセキュリティアップデート

## 📞 サポート

問題が発生した場合:
1. [Vite Docs](https://vitejs.dev/)
2. [React Docs](https://react.dev/)
3. [Mantine Docs](https://mantine.dev/)
4. GitHub Issues で報告

## 🚀 自動デプロイの設定

### GitHub Actions（Vercel）
Vercelは自動的にGitHubと連携してデプロイします。

### GitHub Actions（Netlify）
`.github/workflows/deploy.yml`を作成：
```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```



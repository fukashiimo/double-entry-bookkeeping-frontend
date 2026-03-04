# 🚀 フロントエンド デプロイメントガイド

## 📋 概要

このプロジェクトは **GitHub Pages** を使用してデプロイされています。
`main` ブランチにpushすると、GitHub Actionsが自動的にビルド・デプロイを実行します。

- **本番URL**: https://dbbudget.app
- **デプロイ方式**: GitHub Actions → GitHub Pages

## 🚀 デプロイ方法

### 自動デプロイ（推奨）

1. コードを修正
2. `main` ブランチにcommit & push
3. GitHub Actionsが自動実行（約2-3分）
4. デプロイ完了

```bash
git add .
git commit -m "変更内容"
git push origin main
```

### デプロイ状況の確認

GitHub Actionsの実行状況は以下で確認できます：
https://github.com/fukashiimo/double-entry-bookkeeping-frontend/actions

## 🏗️ ローカル開発環境

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションは `http://localhost:5173` で起動します。

### 3. ビルド確認
```bash
npm run build
npm run preview
```

## ⚙️ GitHub Pages 設定

### リポジトリ設定（Settings > Pages）

| 項目 | 設定値 |
|------|--------|
| Source | GitHub Actions |
| Custom domain | dbbudget.app |

### ワークフロー設定

`.github/workflows/deploy.yml` で以下を実行：
1. `npm ci` - 依存関係インストール
2. `npm run build` - ビルド
3. GitHub Pagesへデプロイ

## 🧪 動作確認チェックリスト

デプロイ後、以下を確認：
- [ ] アプリケーションが正常に読み込まれる
- [ ] ログイン/ログアウトが動作する
- [ ] 勘定科目設定ページが動作する
- [ ] 仕訳入力フォームが動作する
- [ ] ダッシュボードが表示される
- [ ] テーマ色の変更が保持される

## 🚨 トラブルシューティング

### デプロイ後に反映されない

1. **GitHub Actionsの確認**
   - Actionsページで最新のワークフローが成功しているか確認
   - 失敗している場合はログを確認

2. **ブラウザキャッシュ**
   - `Cmd + Shift + R`（Mac）でハードリロード
   - シークレットモードで確認

### ビルドエラー

1. Node.jsのバージョンを確認（v20推奨）
2. `npm install`を再実行
3. TypeScriptエラーを修正

### 404エラー

- SPAルーティング用の`404.html`が`public/`フォルダに存在するか確認
- `CNAME`ファイルが`public/`フォルダに存在するか確認

## 📁 重要なファイル

| ファイル | 説明 |
|----------|------|
| `.github/workflows/deploy.yml` | GitHub Actionsワークフロー |
| `public/CNAME` | カスタムドメイン設定 |
| `public/404.html` | SPAルーティング用 |
| `vite.config.ts` | Viteビルド設定 |

## 🔧 ビルドコマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# リンター
npm run lint
```

## 📞 サポート

問題が発生した場合:
1. [Vite Docs](https://vitejs.dev/)
2. [GitHub Pages Docs](https://docs.github.com/en/pages)
3. GitHub Issues で報告

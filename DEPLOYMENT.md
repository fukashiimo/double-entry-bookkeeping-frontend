# 🚀 フロントエンド デプロイメントガイド

## 📋 概要

このプロジェクトは **GitHub Pages** を使用してデプロイされています。

- **本番URL**: https://dbbudget.app
- **デプロイ方式**: main ブランチへの push → GitHub Actions → GitHub Pages

## 🚀 デプロイ方法

**main ブランチに push するだけで自動デプロイされます。**

```bash
git add .
git commit -m "変更内容"
git push origin main
```

GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルド＆デプロイします。通常1〜2分で本番に反映されます。

### デプロイ状況の確認

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

### 3. ビルド確認（デプロイ前に必ず実行）
```bash
npm run build
```

## ⚙️ GitHub Pages 設定

### リポジトリ設定（Settings > Pages）

| 項目 | 設定値 |
|------|--------|
| Source | GitHub Actions |
| Custom domain | dbbudget.app |

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
   - https://github.com/fukashiimo/double-entry-bookkeeping-frontend/actions でビルドが成功しているか確認

2. **ブラウザキャッシュ**
   - `Cmd + Shift + R`（Mac）でハードリロード
   - シークレットモードで確認

### ビルドエラー

1. ローカルで `npm run build` を実行してエラーを確認
2. TypeScriptエラーを修正してから push する

### 404エラー

- SPAルーティング用の `public/404.html` が存在するか確認
- `public/CNAME` が存在するか確認

## 📁 重要なファイル

| ファイル | 説明 |
|----------|------|
| `.github/workflows/deploy.yml` | GitHub Actions デプロイワークフロー |
| `public/CNAME` | カスタムドメイン設定 |
| `public/404.html` | SPAルーティング用 |
| `vite.config.ts` | Viteビルド設定 |

## 🔧 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド（デプロイ前確認用）
npm run preview  # ビルド結果をローカルでプレビュー
npm run lint     # ESLint 実行
```

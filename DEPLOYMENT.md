# 🚀 フロントエンド デプロイメントガイド

## 📋 概要

このプロジェクトは **GitHub Pages** を使用してデプロイされています。

- **本番URL**: https://dbbudget.app
- **デプロイ方式**: `npm run deploy` → gh-pagesブランチ → GitHub Pages

## 🚀 デプロイ方法

### 1. コードを修正してコミット
```bash
git add .
git commit -m "変更内容"
git push origin main
```

### 2. デプロイ実行
```bash
npm run deploy
```

これで本番環境に反映されます（通常1-2分）。

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
| Source | Deploy from a branch |
| Branch | gh-pages / (root) |
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

1. **ブラウザキャッシュ**
   - `Cmd + Shift + R`（Mac）でハードリロード
   - シークレットモードで確認

2. **GitHub Pagesの設定確認**
   - Source: 「Deploy from a branch」になっているか
   - Branch: 「gh-pages」になっているか

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
| `public/CNAME` | カスタムドメイン設定 |
| `public/404.html` | SPAルーティング用 |
| `vite.config.ts` | Viteビルド設定 |
| `package.json` | deploy スクリプト定義 |

## 🔧 ビルドコマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# デプロイ
npm run deploy

# リンター
npm run lint
```

## 📞 サポート

問題が発生した場合:
1. [Vite Docs](https://vitejs.dev/)
2. [GitHub Pages Docs](https://docs.github.com/en/pages)
3. GitHub Issues で報告

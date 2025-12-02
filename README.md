# 📊 Double Entry Bookkeeping Frontend

複式簿記システム用のフロントエンドアプリ（React + Supabase）

## 🚀 特徴

- **React + TypeScript**: モダンなフロントエンド開発
- **Mantine UI**: 美しいUIコンポーネント
- **Supabase統合**: リアルタイムデータベース連携
- **リアルタイム更新**: データ変更を即座に反映
- **レスポンシブデザイン**: モバイル対応

## 📁 プロジェクト構成

```
double-entry-bookkeeping-frontend/
├── src/
│   ├── components/          # Reactコンポーネント
│   │   ├── JournalEntry/   # 仕訳関連コンポーネント
│   │   └── Layout/         # レイアウトコンポーネント
│   ├── hooks/              # カスタムフック
│   │   ├── useAccounts.ts  # 勘定科目管理
│   │   ├── useJournalEntries.ts # 仕訳管理
│   │   └── useRealtime.ts  # リアルタイム機能
│   ├── lib/                # ライブラリ設定
│   │   └── supabase.ts     # Supabaseクライアント
│   ├── pages/              # ページコンポーネント
│   │   ├── Dashboard.tsx   # ダッシュボード
│   │   ├── JournalList.tsx # 仕訳一覧
│   │   └── AccountSettings.tsx # 勘定科目設定
│   └── theme/              # テーマ設定
├── public/                 # 静的ファイル
└── package.json           # 依存関係
```

## 🔧 セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集してSupabaseの値を設定
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

## 🌐 デプロイメント

詳細なデプロイ方法は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### クイックデプロイ

#### Vercel（推奨）
```bash
# Vercel CLIをインストール
npm install -g vercel

# デプロイ
vercel

# 環境変数を設定
# Vercel Dashboard > Settings > Environment Variables
```

#### Netlify
```bash
# ビルド
npm run build

# Netlifyにデプロイ
# 1. Netlify Dashboardでサイトを作成
# 2. distフォルダをドラッグ&ドロップ
# 3. 環境変数を設定
```

### 環境変数
```env
VITE_SUPABASE_URL=https://snwmoptdzwlrtfhdawrm.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 💰 Google AdSense 設定

1) `index.html` の AdSense スクリプトの `client` を Publisher ID に置き換え

```html
<!-- head 内 -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

2) `public/ads.txt` の Publisher ID を置き換え

```text
google.com, pub-XXXXXXXXXXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

3) （任意）手動広告ユニットを使う場合は `src/components/Ads/AdSenseUnit.tsx` を配置し、`slot` に広告枠IDを設定して使用

```tsx
import AdSenseUnit from './components/Ads/AdSenseUnit'

<AdSenseUnit slot="1234567890" />
```

注意:
- GitHub Pages のプロジェクトページ（`username.github.io/repo`）では `ads.txt` をルートに置けません。独自ドメイン、またはユーザーページ（`username.github.io`）での運用を推奨します。
- `public/robots.txt` はクロール許可になっています。審査・運用開始前提の設定です。

## 📚 機能

### ダッシュボード
- 貸借対照表の表示
- 収益・費用の円グラフ
- 収支サマリー
- リアルタイムデータ更新

### 仕訳入力
- 日付選択
- 勘定科目選択（検索可能）
- 金額入力
- 摘要入力
- リアルタイム保存

### 仕訳一覧
- 仕訳の一覧表示
- 日付順ソート
- 検索・フィルタリング

### 勘定科目設定
- 勘定科目の追加・編集・削除
- タイプ別グループ化
- リアルタイム更新

## 🔄 リアルタイム機能

Supabaseのリアルタイム機能を使用して、データの変更を即座に反映：

```typescript
// 勘定科目の変更を監視
const accountsSubscription = supabase
  .channel('accounts:changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'accounts' },
    (payload) => {
      // UIを更新
    }
  )
  .subscribe()
```

## 🔒 セキュリティ

- **RLS**: Supabaseの行レベルセキュリティ
- **CORS**: 適切なCORS設定
- **APIキー**: 匿名キーのみ使用（公開可能）

## 📊 データフロー

1. **データ取得**: Supabase Edge Functions API
2. **データ表示**: Reactコンポーネント
3. **データ更新**: リアルタイムWebSocket
4. **データ保存**: Supabase PostgreSQL

## 🚨 トラブルシューティング

### よくある問題

1. **API接続エラー**
   - Supabase URLとAPIキーを確認
   - CORS設定を確認

2. **リアルタイム機能が動作しない**
   - WebSocket接続を確認
   - ネットワーク設定を確認

3. **データが表示されない**
   - データベーススキーマを確認
   - RLSポリシーを確認

## 📈 パフォーマンス

- **コード分割**: 動的インポート
- **メモ化**: React.memo, useMemo
- **仮想化**: 大量データの効率的表示
- **キャッシュ**: Supabaseクライアントキャッシュ

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 作者

**fukashiimo**
- GitHub: [@fukashiimo](https://github.com/fukashiimo)

## 🙏 謝辞

- [React](https://reactjs.org) - UIライブラリ
- [Mantine](https://mantine.dev) - UIコンポーネント
- [Supabase](https://supabase.com) - バックエンドサービス
- [Vite](https://vitejs.dev) - ビルドツール
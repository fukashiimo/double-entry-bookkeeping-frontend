# Double Entry Bookkeeping Frontend

複式簿記家計簿アプリのフロントエンド。React + TypeScript + Mantine UI で構築した SPA。  
本番 URL: https://dbbudget.app（GitHub Pages）

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| フレームワーク | React 18 + TypeScript |
| ビルド | Vite 7 |
| ルーティング | React Router v6 |
| UI | Mantine UI v7 + @tabler/icons-react |
| グラフ | Recharts |
| バックエンド | @supabase/supabase-js v2 |
| 日付 | dayjs |

## ディレクトリ構成

```
src/
├── App.tsx                        # ルート定義・AuthProvider / ThemeProvider
├── pages/
│   ├── Reports.tsx                # サマリー・貸借対照表・損益計算書（ホーム）
│   ├── JournalList.tsx            # 仕訳一覧（検索・フィルタ・CSV 出力）
│   ├── AccountSettings.tsx        # 勘定科目・補助科目管理
│   ├── Calendar.tsx               # 月次カレンダー（日別収支）
│   ├── Settings.tsx               # テーマ・カラー設定
│   ├── MyPage.tsx                 # プロフィール・プラン確認
│   ├── Pricing.tsx                # プラン・料金表
│   └── Login.tsx                  # ログイン（OAuth）
├── components/
│   ├── JournalEntry/
│   │   └── JournalEntryForm.tsx   # 仕訳入力フォーム（3 モード）
│   ├── Layout/
│   │   └── MainLayout.tsx         # AppShell・ナビゲーション
│   ├── Auth/
│   │   └── ProtectedRoute.tsx     # 認証ガード
│   └── MonthlyCalendar.tsx        # カレンダーコンポーネント
├── hooks/
│   ├── useAccounts.ts             # 勘定科目 CRUD
│   ├── useJournalEntries.ts       # 仕訳 CRUD
│   ├── useDashboard.ts            # レポート・集計データ取得
│   ├── useSubaccounts.ts          # 補助科目 CRUD
│   ├── useEntitlements.ts         # プランティア確認（Free / Pro）
│   └── useRealtime.ts             # Supabase Realtime 購読
├── contexts/
│   ├── AuthContext.tsx             # OAuth 認証（Google / Apple / Microsoft）
│   └── ThemeContext.tsx            # プライマリカラー管理
├── lib/
│   └── supabase.ts                # Supabase クライアント・型定義
└── theme/                         # Mantine テーマ設定
```

## 主要コマンド

```bash
npm run dev      # 開発サーバー起動（localhost:5173）
npm run build    # TypeScript チェック + Vite ビルド
npm run lint     # ESLint
npm run preview  # ビルド結果のプレビュー
npm run deploy   # GitHub Pages へデプロイ（gh-pages）
```

## 環境変数（`.env`）

```env
VITE_SUPABASE_URL=https://iivyylojvqgucmbyfrqw.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## 認証

- Supabase Auth + OAuth（Google / Apple / Microsoft）
- `AuthContext`（`src/contexts/AuthContext.tsx`）でセッション・ユーザー状態を管理
- `ProtectedRoute` で未認証ユーザーをログインページへリダイレクト
- API 呼び出し時は `session.access_token` を `Authorization: Bearer` ヘッダーに付与

## データフロー

```
フック（useAccounts 等）
  → fetch: VITE_SUPABASE_URL/functions/v1/{endpoint}
  → Supabase Edge Functions（バックエンドリポジトリ）
  → PostgreSQL
```

リアルタイム更新は `useRealtime` が Supabase WebSocket チャンネルで `accounts` / `journal_entries` テーブルを監視する。

## プランティア（Free / Pro）

- `useEntitlements` で `isPro` フラグを取得
- **Free**: 当年のデータのみ参照可・広告あり（`profiles.ads_enabled = true`）
- **Pro**: 複数年データアクセス可・広告なし
- Stripe 決済連携、`profiles.plan_tier` で管理

## 勘定科目タイプ

`Account.type` は以下 5 種類のみ：

| 値 | 財務諸表 | 借方 | 貸方 |
|---|---|---|---|
| `資産` | 貸借対照表（左） | +増加 | -減少 |
| `負債` | 貸借対照表（右） | -減少 | +増加 |
| `純資産` | 貸借対照表（右） | -減少 | +増加 |
| `収益` | 損益計算書（右） | -減少 | +増加 |
| `費用` | 損益計算書（左） | +増加 | -減少 |

## 仕訳入力フォームのモード

`JournalEntryForm.tsx` は 3 つの入力モードを持つ：
- **振替伝票**: 借方・貸方を個別に指定する標準モード
- **仕訳帳**: 複数行の仕訳を一括入力
- **簡単入力**: 収入・支出を直感的に入力するシンプルモード

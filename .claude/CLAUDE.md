# フロントエンド開発ルール

## コーディング規約

### TypeScript
- `any` を使わない。型が不明な場合は `unknown` を使い、型ガードで絞り込む
- 新しい型は `src/lib/supabase.ts` の既存の型定義（`Account`, `JournalEntry`, `Subaccount`）に合わせる
- コンポーネントの props には必ず型を定義する

### React
- 関数コンポーネントのみ使用（クラスコンポーネント不使用）
- データ取得ロジックは `src/hooks/` にカスタムフックとして切り出す
- ページコンポーネントは `src/pages/`、再利用可能な UI は `src/components/` に置く

### UI
- UI コンポーネントは **Mantine UI v7** を優先する（独自 CSS は最小限に）
- アイコンは **@tabler/icons-react** を使う
- グラフは **Recharts** を使う

## 認証・API 呼び出し

```typescript
// 認証トークンの取得
const { session } = useAuth()  // AuthContext から

// Edge Functions への fetch
const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accounts`, {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  },
})
```

- API 呼び出しは必ず `session.access_token` を付与する（RLS が JWT でフィルタリングするため）
- 直接 `supabase.from()` でテーブルを触るのではなく、Edge Functions 経由でアクセスする

## プランティア制御

```typescript
const { isPro } = useEntitlements()
// Free ユーザーには当年のデータのみ表示
// Pro ユーザーには複数年のデータを表示
```

機能制限は `isPro` フラグで制御する。`profiles.plan_tier` を直接参照しない。

## Realtime

`useRealtime` フックで Supabase の WebSocket チャンネルを購読する。  
コンポーネント内で直接 `supabase.channel()` を使わない。

## ルーティング

`src/App.tsx` でルートを定義している。  
ホームパス（`/`）は `/reports` にリダイレクトする。  
新しいページを追加する場合は `App.tsx` にルートを追加し、`MainLayout.tsx` のナビに項目を追加する。

## テーマ・カラー

プライマリカラーは `ThemeContext` で管理する。  
使用可能な色: `orange`, `pastelPink`, `pastelBlue`, `pastelGreen`, `pastelYellow`, `pastelPurple`

## デプロイ

**main ブランチへの push で GitHub Actions が自動でビルド＆デプロイする。**

```bash
git push origin main   # これだけでデプロイされる
```

- ワークフロー: `.github/workflows/deploy.yml`
- 本番 URL: https://dbbudget.app（独自ドメイン、GitHub Pages）
- `npm run deploy`（gh-pages）は廃止済み。使わないこと

## やってはいけないこと

- `src/lib/supabase.ts` の Supabase URL / Anon Key をハードコードで変更しない（環境変数を使う）
- `profiles` テーブルを直接 `supabase.from('profiles')` で更新しない（billing 系 Function 経由で操作する）
- Mantine の `sx` prop（v6 の書き方）を使わない。v7 の `style` prop か CSS Modules を使う

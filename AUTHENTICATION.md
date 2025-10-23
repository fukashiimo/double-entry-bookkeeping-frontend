# 認証機能の実装

このドキュメントでは、OAuth 2.0を使用したソーシャルログイン機能の実装について説明します。

## 📋 実装された機能

### ✅ サポートされている認証プロバイダー

- **Google** - Googleアカウントでログイン
- **Apple** - Appleアカウントでログイン
- **Microsoft** - Microsoftアカウントでログイン

### ✅ 実装された機能

1. **ログイン/ログアウト**
   - OAuth 2.0プロトコルを使用した安全な認証
   - セッション管理
   - 自動リダイレクト

2. **ルート保護**
   - 未認証ユーザーは自動的にログインページにリダイレクト
   - 認証済みユーザーのみがアプリケーションにアクセス可能

3. **ユーザー情報表示**
   - ヘッダーにユーザーアバター表示
   - ログアウトメニュー

## 📁 ファイル構成

```
src/
├── contexts/
│   └── AuthContext.tsx          # 認証コンテキストとフック
├── components/
│   ├── Auth/
│   │   └── ProtectedRoute.tsx   # 認証保護ルートコンポーネント
│   └── Layout/
│       └── MainLayout.tsx       # ログアウト機能付きレイアウト
├── pages/
│   └── Login.tsx                # ログインページ
└── App.tsx                      # 認証プロバイダーの統合
```

## 🔧 実装の詳細

### 1. AuthContext (認証コンテキスト)

`src/contexts/AuthContext.tsx`

認証状態を管理するReact Contextを提供します。

**主な機能：**
- ユーザーセッションの管理
- 認証状態の監視
- ログイン/ログアウト関数の提供

**使用例：**
```tsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, signOut } = useAuth()
  
  return (
    <div>
      <p>ようこそ、{user?.email}さん</p>
      <button onClick={signOut}>ログアウト</button>
    </div>
  )
}
```

### 2. ProtectedRoute (保護ルート)

`src/components/Auth/ProtectedRoute.tsx`

認証が必要なページを保護するコンポーネントです。

**動作：**
- ユーザーが認証されていない場合、ログインページにリダイレクト
- 認証確認中はローディング表示
- 認証済みの場合、子コンポーネントを表示

### 3. Login (ログインページ)

`src/pages/Login.tsx`

OAuth 2.0プロバイダーのログインボタンを提供します。

**機能：**
- Google、Apple、Microsoftのログインボタン
- ローディング状態の表示
- エラーハンドリング

### 4. MainLayout (メインレイアウト)

`src/components/Layout/MainLayout.tsx`

ヘッダーにユーザー情報とログアウトメニューを追加しました。

**機能：**
- ユーザーアバター表示
- ログアウトメニュー
- ユーザーメール表示

## 🚀 使用方法

### 開発環境での起動

```bash
cd double-entry-bookkeeping-frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173/double-entry-bookkeeping-frontend/` にアクセス

### 認証フローのテスト

1. アプリケーションにアクセス
2. 未認証の場合、ログインページにリダイレクト
3. 好きなプロバイダーのボタンをクリック
4. プロバイダーの認証画面でログイン
5. 認証成功後、ダッシュボードにリダイレクト
6. ヘッダーのアバターからログアウト可能

## ⚙️ 設定

### 環境変数

Supabaseの設定は `src/lib/supabase.ts` に記載されています：

```typescript
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-key'
```

### リダイレクトURL

認証後のリダイレクトURLは `AuthContext.tsx` で設定されています：

```typescript
redirectTo: `${window.location.origin}/double-entry-bookkeeping-frontend/`
```

本番環境やローカル環境に応じて適宜変更してください。

## 🔐 Supabase設定手順

OAuth 2.0認証を有効にするには、Supabaseダッシュボードで各プロバイダーを設定する必要があります。

詳細な設定手順は `OAUTH_SETUP.md` を参照してください。

### 簡易手順

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. Authentication → Providers に移動
4. 各プロバイダー（Google、Apple、Microsoft）を有効化
5. 各プロバイダーから取得したクライアントIDとシークレットを設定

## 🧪 テストアカウント

開発環境でテストする場合：

1. 実際のGoogle/Apple/Microsoftアカウントを使用
2. テスト用のアカウントを作成することを推奨
3. 各プロバイダーの開発者コンソールでテストユーザーを追加可能

## 🚨 よくある問題

### 問題1: ログイン後にリダイレクトされない

**原因**: リダイレクトURLが正しく設定されていない

**解決策**:
1. Supabaseダッシュボードで許可されたリダイレクトURLを確認
2. `AuthContext.tsx` のredirectTo設定を確認

### 問題2: プロバイダーのボタンをクリックしてもログインできない

**原因**: Supabaseでプロバイダーが正しく設定されていない

**解決策**:
1. Supabase Dashboardでプロバイダーが有効になっているか確認
2. クライアントIDとシークレットが正しく設定されているか確認
3. `OAUTH_SETUP.md` の設定手順を再確認

### 問題3: ログアウト後もログイン状態が残る

**原因**: ブラウザのキャッシュまたはSupabaseのセッション

**解決策**:
1. ブラウザのキャッシュをクリア
2. `supabase.auth.signOut()` が正しく呼ばれているか確認

## 📊 セキュリティ

### 実装されているセキュリティ機能

1. **OAuth 2.0プロトコル** - 業界標準の認証プロトコル
2. **トークンの安全な保管** - Supabaseが自動的にトークンを管理
3. **HTTPS通信** - 本番環境では必須
4. **Row Level Security (RLS)** - データベースレベルでのアクセス制御

### セキュリティのベストプラクティス

1. 本番環境では必ずHTTPSを使用
2. クライアントシークレットは公開しない
3. 必要最小限のスコープのみを要求
4. 定期的にアクセストークンを更新

## 🎨 カスタマイズ

### ログインページのデザイン変更

`src/pages/Login.tsx` を編集してデザインをカスタマイズできます。

### プロバイダーの追加

他のOAuth 2.0プロバイダー（GitHub、Discord等）を追加する場合：

1. `AuthContext.tsx` に新しいログイン関数を追加
2. `Login.tsx` に新しいボタンを追加
3. Supabaseダッシュボードでプロバイダーを有効化

例：GitHubの追加
```typescript
const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/double-entry-bookkeeping-frontend/`,
    },
  })
  if (error) throw error
}
```

## 📚 参考資料

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [React Context API](https://react.dev/reference/react/useContext)
- [Mantine UI Components](https://mantine.dev/)

## 🎉 まとめ

OAuth 2.0による認証機能が実装され、以下が可能になりました：

✅ Google、Apple、Microsoftアカウントでのログイン  
✅ セキュアな認証フロー  
✅ 自動的なセッション管理  
✅ ルートの保護  
✅ ユーザー情報の表示とログアウト機能  

これにより、ユーザーは既存のアカウントで簡単かつ安全にログインできるようになります。




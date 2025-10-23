# OAuth 2.0 認証セットアップガイド

このドキュメントでは、Google、Apple、Microsoftアカウントでのログイン機能を設定する方法を説明します。

## 📋 前提条件

- Supabaseプロジェクトが作成されていること
- 各プロバイダーの開発者アカウント

## 🔐 Supabase認証設定

### 1. Supabaseダッシュボードにアクセス

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. サイドバーから「Authentication」→「Providers」に移動

### 2. リダイレクトURLの確認

Supabaseの認証設定で、以下のリダイレクトURLを確認してください：

```
https://your-project-id.supabase.co/auth/v1/callback
```

このURLを各プロバイダーの設定で使用します。

## 🔵 Google OAuth 2.0 設定

### 1. Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成またはexistingプロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動

### 2. OAuth 2.0 クライアントIDの作成

1. 「認証情報を作成」→「OAuth クライアント ID」をクリック
2. アプリケーションの種類：「ウェブアプリケーション」を選択
3. 名前を入力（例：複式簿記システム）
4. 承認済みのリダイレクトURIに以下を追加：
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
5. 「作成」をクリック
6. クライアントIDとクライアントシークレットをコピー

### 3. Supabaseでの設定

1. Supabase Dashboard → Authentication → Providers
2. 「Google」を選択
3. 以下を入力：
   - **Enabled**: ON
   - **Client ID**: Google Cloud Consoleで取得したクライアントID
   - **Client Secret**: Google Cloud Consoleで取得したクライアントシークレット
4. 「Save」をクリック

## 🍎 Apple OAuth 2.0 設定

### 1. Apple Developer アカウントの準備

1. [Apple Developer](https://developer.apple.com/) にアクセス
2. Apple Developer Programに登録（年間$99）
3. 「Certificates, Identifiers & Profiles」に移動

### 2. App IDの作成

1. 「Identifiers」→「+」をクリック
2. 「App IDs」を選択して「Continue」
3. 「App」を選択して「Continue」
4. 説明とBundle IDを入力
5. 「Sign in with Apple」にチェックを入れる
6. 「Continue」→「Register」

### 3. Services IDの作成

1. 「Identifiers」→「+」をクリック
2. 「Services IDs」を選択して「Continue」
3. 説明とIdentifierを入力
4. 「Sign in with Apple」にチェックを入れる
5. 「Configure」をクリック
6. 以下を設定：
   - **Primary App ID**: 先ほど作成したApp ID
   - **Domains and Subdomains**: `your-project-id.supabase.co`
   - **Return URLs**: `https://your-project-id.supabase.co/auth/v1/callback`
7. 「Save」→「Continue」→「Register」

### 4. Keyの作成

1. 「Keys」→「+」をクリック
2. Key名を入力
3. 「Sign in with Apple」にチェックを入れる
4. 「Configure」をクリック
5. Primary App IDを選択
6. 「Save」→「Continue」→「Register」
7. Keyファイル(.p8)をダウンロード
8. Key IDをメモ

### 5. Supabaseでの設定

1. Supabase Dashboard → Authentication → Providers
2. 「Apple」を選択
3. 以下を入力：
   - **Enabled**: ON
   - **Client ID**: Services IDのIdentifier
   - **Secret Key**: .p8ファイルの内容
   - **Key ID**: Apple Developer Portalで取得したKey ID
   - **Team ID**: Apple Developer アカウントのTeam ID
4. 「Save」をクリック

## 🔷 Microsoft Azure OAuth 2.0 設定

### 1. Azure Portalでアプリを登録

1. [Azure Portal](https://portal.azure.com/) にアクセス
2. 「Azure Active Directory」→「アプリの登録」に移動
3. 「新規登録」をクリック
4. 以下を入力：
   - **名前**: 複式簿記システム
   - **サポートされているアカウントの種類**: 任意の組織ディレクトリ内のアカウントと個人用Microsoftアカウント
   - **リダイレクトURI**: Web → `https://your-project-id.supabase.co/auth/v1/callback`
5. 「登録」をクリック

### 2. クライアントシークレットの作成

1. 登録したアプリを選択
2. 「証明書とシークレット」に移動
3. 「新しいクライアントシークレット」をクリック
4. 説明と有効期限を設定
5. 「追加」をクリック
6. シークレットの値をコピー（後で確認できません）

### 3. APIのアクセス許可

1. 「APIのアクセス許可」に移動
2. 「アクセス許可の追加」をクリック
3. 「Microsoft Graph」→「委任されたアクセス許可」
4. 以下を選択：
   - `email`
   - `openid`
   - `profile`
5. 「アクセス許可の追加」をクリック

### 4. Supabaseでの設定

1. Supabase Dashboard → Authentication → Providers
2. 「Azure (Microsoft)」を選択
3. 以下を入力：
   - **Enabled**: ON
   - **Client ID**: Azure Portalのアプリケーション(クライアント)ID
   - **Client Secret**: Azure Portalで作成したクライアントシークレット
   - **Azure Tenant**: `common`（個人アカウントと組織アカウント両方をサポートする場合）
4. 「Save」をクリック

## 🧪 テスト

### ローカル環境でのテスト

1. 開発サーバーを起動：
   ```bash
   cd double-entry-bookkeeping-frontend
   npm run dev
   ```

2. ブラウザで `http://localhost:5173/double-entry-bookkeeping-frontend/` にアクセス

3. ログインページが表示されることを確認

4. 各プロバイダーのボタンをクリックしてログインをテスト

### 本番環境でのテスト

1. フロントエンドをビルド：
   ```bash
   npm run build
   ```

2. GitHub Pagesにデプロイ：
   ```bash
   npm run deploy
   ```

3. デプロイされたURLにアクセス

4. 各プロバイダーでログインをテスト

## 🔒 セキュリティのベストプラクティス

### 1. リダイレクトURLの制限

- 本番環境とローカル環境のURLのみを許可
- ワイルドカードの使用を避ける

### 2. スコープの最小化

- 必要最小限の権限のみを要求
- ユーザーのプライバシーを尊重

### 3. トークンの管理

- アクセストークンとリフレッシュトークンを安全に保管
- Supabaseが自動的に管理するため、手動での保存は不要

### 4. HTTPS の使用

- 本番環境では必ずHTTPSを使用
- ローカル開発環境以外ではHTTPを使用しない

## 🚨 トラブルシューティング

### よくある問題

#### 1. リダイレクトURIのミスマッチ

**エラー**: `redirect_uri_mismatch`

**解決策**: 
- SupabaseのリダイレクトコールバックURLを各プロバイダーに正確に登録
- URLの末尾のスラッシュに注意

#### 2. クライアントIDまたはシークレットが無効

**エラー**: `invalid_client`

**解決策**:
- Supabase Dashboardで正しいクライアントIDとシークレットを設定
- スペースや改行が含まれていないか確認

#### 3. スコープが不足

**エラー**: `insufficient_scope`

**解決策**:
- 各プロバイダーで必要なスコープ（email, profile等）を許可

#### 4. Apple Sign Inが機能しない

**解決策**:
- Apple Developer アカウントが有効か確認
- Services IDとApp IDが正しく設定されているか確認
- .p8キーファイルの内容が正確にコピーされているか確認

## 📚 参考リンク

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In](https://developer.apple.com/sign-in-with-apple/)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

## 🎉 完了！

これでOAuth 2.0による認証機能の設定が完了しました。ユーザーはGoogle、Apple、Microsoftアカウントでログインできるようになります。




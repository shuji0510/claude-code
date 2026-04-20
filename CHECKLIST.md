# Vercel OAuth Incident (Context.ai) — Response Checklist

Vercel 社員が利用していた第三者 AI ツール「Context.ai」の Google Workspace
OAuth アプリが侵害され、社内システムへの不正アクセスが発生。Sensitive 未設定の
環境変数が閲覧された可能性がある。Mandiant と調査中。ShinyHunters 関与の説あり。

## IOC (Indicator of Compromise)

- OAuth Client ID: `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj`
- OAuth Client Host: `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj.apps.googleusercontent.com`
- 関連サービス: Context.ai

## 前提

Vercel に保存した API キー / DB 認証情報のうち Sensitive マーク未設定のものは
「漏洩した前提」で行動する。Claude Code / OpenAI などの AI API キーを保管して
いる場合は最優先で対応。

## 即時対応 (5 ステップ)

1. [ ] Vercel Activity Log で不審操作を確認
2. [ ] Sensitive 未設定の環境変数を全ローテーション
3. [ ] 再登録時は必ず Sensitive で登録
4. [ ] 直近のデプロイを監査、不審なら削除
5. [ ] Deployment Protection を Standard 以上に設定

## 影響範囲の確認

### Vercel

- Dashboard → Settings → Environment Variables
  - 鍵アイコンが無い変数を全て列挙 → ローテ + Sensitive 再登録
- Dashboard → Settings → Audit Log
  - 不審な Token 発行 / チームメンバー変更 / デプロイがないか

### AI プロバイダ コンソール

各キーの Last used / 使用量スパイクを確認。不審なら即 Revoke → 新規発行。

- Anthropic Console → API Keys
- OpenAI Platform → API keys → Usage
- Google AI Studio / Gemini
- Groq / Mistral / DeepSeek 他

### GitHub

- https://github.com/settings/security-log で不審操作
- Org Owner は Audit log (Org settings → Logs → Audit log)
- Fine-grained PAT / OAuth App の棚卸し

### Google Workspace (管理者)

1. https://admin.google.com にログイン (特権管理者)
2. セキュリティ → API の制御 → アプリのアクセス制御
3. OAuth app ID `110671459871-30f1spbu0hptbs60cb4vsmv79i7bbvqj` を検索
4. 該当すれば Block / Trust 解除、ユーザーへのアクセス状況を監査
5. 管理者コンソール → レポート → 監査ログ → Token で当該 Client ID の認可履歴

## 優先対応対象

- Claude Code × Vercel 利用者 (`ANTHROPIC_API_KEY` 最優先)
- OpenAI / Gemini / Groq など AI API キーを Vercel に保管している全員
- Next.js 個人プロジェクト運用者 (`.env` 誤コミット要確認)
- SaaS 本番を Vercel で運用している組織 (Audit Log + チーム棚卸し)

## ローカル スキャン

リポジトリ / 開発機の残留漏洩を確認:

```sh
./scan-secrets.sh [対象ディレクトリ]
```

スキャン内容:

1. IOC OAuth app ID の working tree / git history 混入
2. git 追跡下の `.env` ファイル
3. AI プロバイダ / クラウド / 秘密鍵の典型パターン
4. Sensitive 化すべき環境変数名の出現
5. `vercel.json` / `.vercel/project.json` の存在通知

ヒット時は以下を実施:

- 該当キーを発行元コンソールで Revoke
- 新規発行後は Vercel に Sensitive 登録
- git 履歴混入時は `git filter-repo` で履歴除去 + 強制 push
  (共有ブランチは事前に周知)
- GitHub Push Protection / Secret Scanning を有効化

## 恒久対策

- 環境変数は初期から Sensitive 運用
- OAuth 連携アプリの定期棚卸し (四半期ごと)
- AI 連携 SaaS は権限最小化 + 監査ログ保全
- リポジトリ Push Protection / Secret Scanning の強制化
- Deployment Protection の Standard 以上維持

## 参考

- Vercel 公式 Bulletin を都度確認
- Mandiant / ShinyHunters 関連 IOC は追加公開される可能性あり

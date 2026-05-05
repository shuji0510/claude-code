# Claude Code Skills

このリポジトリには、`@claudecode_love` の記事「Claude Skills 67選」で紹介されていた
スキル（および同等機能のスキル）を `.claude/skills/` 配下にまとめてインストールしてあります。
記事元: <https://x.com/claudecode_love/status/2045082723027751079>
（参考: 元の英語版 <https://x.com/polydao/status/2044317956893471081>）

合計 121 スキルがインストール済みです（記事原文のラインナップに加え、
`mattpocock/skills` などのリポジトリで提供されている関連スキルも一括取り込み）。

## 取り込み元リポジトリ

| 出典 | 内容 |
|---|---|
| `anthropics/skills` | 公式スキル（office, frontend, theme-factory 等） |
| `mattpocock/skills` | 設計・開発系 (TDD, grill-me, triage, to-prd 等) |
| `obra/superpowers` | デフォルトのエンジニアリング脳レイヤー |
| `wshobson/agents` | Stripe Integration |
| `coreyhaines31/marketingskills` | Marketing / CRO / SEO 30 種以上 |
| `AgriciDaniel/claude-seo` | テクニカル SEO 監査 |
| `Microck/ordinary-claude-skills` | Domain Name Brainstormer |
| `hungv47/meta-skills` | マルチエージェント (agents-panel, fresh-eyes 等) |
| `tommasinigiovanni/conclave` | Model-chat Debate |
| `ComposioHQ/awesome-claude-skills` | 補助系 (lead-research, resume, langsmith 等) |

正確な紐付けは `skills-lock.json` を参照してください。

## 記事推奨の導入順序とマッピング

### 1. Meta Skills（最初に入れるスキルを作るスキル）
- `skill-creator` — 評価とベンチで Skill を改善
- `write-a-skill` — 段階的開示・バンドル付き Skill の書き方ガイド
- 既存検索は <https://skillsmp.com> を併用

### 2. Planning & Design（手戻り 80% 削減）
- `grill-me` — 容赦ない質問で意思決定ツリーを潰す
- `to-prd` — 会話から PRD を生成し Issue 化（記事の "Write a PRD"）
- `to-issues` — PRD を独立着手可能な Issue に分解（記事の "PRD to Issues"）
- `task-breakdown` — 仕様→ビルド可能タスクへ分解（記事の "PRD to Plan"）
- `discover` — 軽量〜深掘りの要件発見
- `grill-with-docs` — ドメインモデル・ADR と突き合わせて grill

### 3. Code Development（規律ある開発パートナー化）
- `tdd` / `test-driven-development` — Red-Green-Refactor 強制
- `triage` — Issue を状態機械で整理（記事の "Triage Issue"）
- `diagnose` — 再現→最小化→仮説→計装の 4 段階デバッグ
- `systematic-debugging` — 体系的デバッグ手法（superpowers）
- `improve-codebase-architecture` — リファクタ機会と戦略を提示
- `requesting-code-review` / `receiving-code-review` — コードレビュー
- `verification-before-completion` — 完了前検証
- `using-superpowers` — superpowers 一式のベースレイヤー
- `subagent-driven-development` / `dispatching-parallel-agents` — 並列開発
- `executing-plans` / `writing-plans` — 計画立案・実行
- `finishing-a-development-branch` — ブランチ仕上げ
- `using-git-worktrees` — worktree 運用
- `zoom-out` — 全体像へ視点を引く
- `caveman` — 圧縮モード（トークン削減）
- `brainstorming` — アイデア発散

### 4. Tooling & Setup（一度入れたら触らない系）
- `stripe-integration` — 安全な決済フロー
- `webapp-testing` — Playwright での Web アプリテスト
- `mcp-builder` — MCP サーバ構築
- `claude-api` — Claude API / Anthropic SDK 最適化
- `langsmith-fetch` — LangChain/LangGraph デバッグ

> 記事掲載の `setup-pre-commit` / `git-guardrails-claude-code` /
> `dependency-auditor` は記事の npx パスでは現存しません。
> 必要に応じて公式スキル `webapp-testing` や `block-no-verify-hook`
> （wshobson/agents）等で代替できます。

### 5. Writing & Knowledge
- `doc-coauthoring` — 構造化された共同執筆
- `internal-comms` — 社内コミュニケーション全般
- `writing-skills` — 文章作成

### 6. UI / Design / Frontend
- `frontend-design` — モダン UI 生成
- `theme-factory` — テキストプロンプトからテーマ生成
- `web-artifacts-builder` — React/Tailwind/shadcn の高度な artifact
- `brand-guidelines` — ブランドシステム適用
- `canvas-design` / `algorithmic-art` / `image` / `slack-gif-creator` — 画像系

### 7. Business / Sales / Marketing（30+ スキル）
Marketing / CRO / SEO はジャンル別に揃えてあります:

- 戦略系: `product-marketing-context`, `marketing-ideas`, `marketing-psychology`,
  `competitor-profiling`, `competitor-alternatives`, `customer-research`,
  `pricing-strategy`, `launch-strategy`, `revops`, `sales-enablement`,
  `lead-magnets`, `lead-research-assistant`, `referral-program`,
  `community-marketing`, `churn-prevention`, `free-tool-strategy`
- コンテンツ・コピー: `copywriting`, `copy-editing`, `content-strategy`,
  `social-content`, `email-sequence`, `cold-email`, `ad-creative`,
  `paid-ads`, `video`
- CRO: `ab-test-setup`, `analytics-tracking`, `signup-flow-cro`,
  `onboarding-cro`, `paywall-upgrade-cro`, `popup-cro`, `page-cro`,
  `form-cro`
- SEO: `seo`, `seo-audit`, `seo-content`, `seo-page`, `seo-plan`, `seo-flow`,
  `seo-cluster`, `seo-competitor-pages`, `seo-programmatic`, `programmatic-seo`,
  `seo-technical`, `seo-schema`, `schema-markup`, `seo-images`, `seo-image-gen`,
  `seo-sitemap`, `seo-hreflang`, `seo-local`, `seo-maps`, `seo-geo`,
  `seo-google`, `seo-dataforseo`, `seo-backlinks`, `seo-ecommerce`,
  `seo-drift`, `seo-sxo`, `ai-seo`, `aso-audit`, `directory-submissions`,
  `site-architecture`
- ブランド: `domain-name-brainstormer`
- その他: `tailored-resume-generator`, `twitter-algorithm-optimizer`,
  `meeting-insights-analyzer`, `youtube-downloader`,
  `raffle-winner-picker`, `skill-share`

### 8. Office & Documents
- `pdf` — PDF 操作（読取・結合・分割・OCR・フォーム）
- `docx` — Word（変更履歴・テーブル・テンプレ）
- `pptx` — PowerPoint デッキ
- `xlsx` — Excel・CSV・TSV（数式・チャート・ピボット）
- `doc-coauthoring` — 共同執筆ワークフロー

### 9. Multi-Agent
- `agents-panel` — 多人数エージェント討論／合議（記事の "Stochastic Consensus"）
- `conclave` — 複数 Claude のディベート（記事の "Model-chat / Debate"）
- `fresh-eyes` — 独立レビュアでの実装後検証
- `dispatching-parallel-agents` — サブエージェント並列実行

> 記事掲載の `firecrawl-skill` は元リポジトリ
> (mendableai/firecrawl) に SKILL.md が存在しないため未取り込み。
> 必要なら別途スクレイピング用 MCP / API クライアントを追加してください。

## インストール状況の再現

このリポジトリの `skills-lock.json` を使えば、別環境でも
同じスキル群を一括復元できます:

```sh
npx -y skills@latest experimental_install
```

## 個別の追加・削除

```sh
# 追加（プロジェクトローカルにコピー、Claude Code 用）
npx -y skills@latest add <repo>/<path> --agent claude-code --copy --skill <name>

# 一覧
npx -y skills@latest list

# 削除
npx -y skills@latest remove --skill <name> --agent claude-code -y
```

## 重要な注意

スキルはエージェントと同等の権限で実行されます。導入したスキルは
内容（特に `scripts/` 以下や `SKILL.md` 内のコマンド）を必ず
レビューしてから本番ワークフローで利用してください。

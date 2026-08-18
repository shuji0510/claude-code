# 第2回プチ生成AIセミナー 参加特典

Gemini × Google Workspace で日常業務を自動化するためのコード & プロンプト集です。

## 📁 収録内容

### 特典① GAS コード一式 (`gas/` フォルダ)
| ファイル | 用途 |
| --- | --- |
| `gmail_auto_reply.gs`        | Gmailの受信メールに対して、Geminiが返信ドラフトを自動作成 |
| `sheets_gemini_analyze.gs`   | スプレッドシートで `=GEMINI("...")` をカスタム関数として使う |
| `forms_summary_daily.gs`     | Googleフォームの回答を毎朝サマリーレポートとしてメール送信 |
| `slides_generator.gs`        | プロンプトから10ページ構成のGoogleスライドを自動生成 |
| `meet_transcript_todo.gs`    | Meetの文字起こしから決定事項とToDoを抽出しGoogle Chatへ通知 |
| `common_gemini_client.gs`    | Gemini APIを呼び出す共通ラッパー（他のスクリプトから利用） |

### 特典② プロンプト集 (`prompts/` フォルダ)
| ファイル | 内容 |
| --- | --- |
| `01_gmail_reply.md`       | Gmail返信テンプレ 15種 |
| `02_sheets_analysis.md`   | Sheets分析プロンプト 20種 |
| `03_meeting_minutes.md`   | 議事録テンプレ 5種 |
| `04_slide_deck.md`        | スライド構成テンプレ 10種 |

## 🚀 セットアップ手順（5分）

1. **Google AI Studio でAPIキー取得**
   - <https://aistudio.google.com/app/apikey> にアクセス
   - 「Create API key」→ プロジェクトを選択
   - キーをコピーしておく

2. **GASプロジェクトにAPIキーを保存**
   - スプレッドシートまたはドキュメントを開く
   - 「拡張機能 > Apps Script」
   - 左メニュー「プロジェクトの設定」→「スクリプト プロパティ」
   - 「スクリプト プロパティを追加」
     - `プロパティ` : `GEMINI_API_KEY`
     - `値` : （上でコピーしたAPIキー）
   - 保存

3. **`common_gemini_client.gs` を必ず一緒にコピー**
   - すべてのGASはこの共通ラッパー(`callGemini(prompt)`)を利用しています

4. **トリガー設定（自動実行が必要なもの）**
   - `forms_summary_daily.gs` → 時間主導型 / 毎日 9:00
   - `meet_transcript_todo.gs` → Driveの変更検知 / または時間主導型
   - `gmail_auto_reply.gs` → 手動実行 or メニューから起動

## 📝 ライセンス

社内利用・改変OK。二次配布はご遠慮ください。

## ❓ サポート

セミナー参加者向けSlackコミュニティ「TORERUN」でご質問受付中。

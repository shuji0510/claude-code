# 第2回プチ生成AIセミナー 成果物一覧

**タイトル**: Gemini × Google Workspaceで日常業務を自動化する2時間
**開催**: 2026年4月20日（月）15:00〜17:00
**主催**: 株式会社HJP Corporation

## 📦 成果物

| 分類 | ファイル | 説明 |
| --- | --- | --- |
| プレゼン | `seminar2_gemini_workspace.pptx` | 22ページ / 16:9 / スピーカーノート埋め込み ※ローカル生成物（生成方法は下記参照） |
| プレゼン | `SPEAKER_NOTES.md` | スライドごとのスピーカーノート（印刷用） |
| プレゼン生成 | `build_pptx.py` | 上記PPTXを再現するPythonスクリプト |
| 参加特典 | `bonus/README.md` | 特典の使い方 |
| 特典①GAS | `bonus/gas/common_gemini_client.gs` | Gemini API共通ラッパー |
| 特典①GAS | `bonus/gas/gmail_auto_reply.gs` | Gmail返信ドラフト自動作成 |
| 特典①GAS | `bonus/gas/sheets_gemini_analyze.gs` | `=GEMINI(...)`カスタム関数 |
| 特典①GAS | `bonus/gas/forms_summary_daily.gs` | フォーム回答の毎朝要約 |
| 特典①GAS | `bonus/gas/slides_generator.gs` | プロンプト→スライド自動生成 |
| 特典①GAS | `bonus/gas/meet_transcript_todo.gs` | Meet文字起こし→ToDo抽出 |
| 特典②Prompt | `bonus/prompts/01_gmail_reply.md` | Gmail返信テンプレ 15種 |
| 特典②Prompt | `bonus/prompts/02_sheets_analysis.md` | Sheets分析プロンプト 20種 |
| 特典②Prompt | `bonus/prompts/03_meeting_minutes.md` | 議事録テンプレ 5種 |
| 特典②Prompt | `bonus/prompts/04_slide_deck.md` | スライド構成テンプレ 10種 |

## 📊 PPTXの再生成方法

`build_pptx.py` はローカル環境から一括生成用として利用できます:

```bash
pip install python-pptx
python3 build_pptx.py
# → seminar2_gemini_workspace.pptx (22 slides / speaker notes 付き)
```

生成時間は約1秒、出力サイズは約110KB です。

## 🎁 参加者へのお渡し

1. セミナー終了後24時間以内に、参加時アドレス宛にダウンロードURLをお送りします。
2. `bonus/` フォルダ配下を zip 化して配布します（`seminar2_bonus_pack.zip`）。
3. GASコードのAPIキー設定は `bonus/README.md` の手順に従ってください。

## 🗺 セミナー全体像

| 回 | 日程 | テーマ |
| --- | --- | --- |
| 第1回 | 2026/3/16 | Gemini × NotebookLM「自社専用AI構築」編 |
| **第2回** | **2026/4/20** | **Gemini × Google Workspace「日常業務の自動化」編 ★本資料★** |
| 第3回 | 2026/5/18（予定） | Sheets × Gemini × CRM「営業DX」編 |
| 第4回 | 2026/6/15（予定） | GAS × 生成AI「バックオフィス」編 |

# 自治体補助金 自動収集システム

J-Grants 公開 API と自治体独自サイトから、現在公募中の補助金・助成金・奨励金を
毎日自動収集し、**Google スプレッドシート** に追記するツール。

## ファイル構成

```
.
├── README.md
├── requirements.txt
├── config/
│   ├── sources.yaml              # 監視対象（地域・自治体サイト・出力先）
│   ├── jgrants_fields.yaml       # J-Grants APIフィールドマッピング
│   └── service_account.json      # GCP サービスアカウント鍵（手動配置・gitignore）
├── src/
│   ├── main.py                   # エントリーポイント
│   ├── config.py                 # YAMLローダ
│   ├── logger.py                 # logs/YYYY-MM-DD.log への出力
│   ├── models.py                 # Subsidy データクラス
│   ├── notifier.py               # Gmail通知（次フェーズで本実装）
│   ├── collectors/
│   │   ├── base.py
│   │   ├── jgrants.py            # J-Grants API クライアント
│   │   └── custom_site.py        # 自治体サイトを巡回
│   ├── parsers/
│   │   ├── base.py
│   │   ├── tokyo_metro.py        # サンプル: 東京都
│   │   └── shibuya_city.py       # サンプル: 渋谷区
│   └── storage/
│       ├── db.py                 # SQLite による差分管理
│       └── sheets_writer.py      # Google Sheets 追記・色付け
├── data/                         # subsidies.db（実行時生成）
├── logs/                         # 日付付きログ（実行時生成）
└── launchd/
    └── com.hjp.subsidy-collector.plist
```

## 取得項目

補助金名・実施機関・公募開始日・締切日・補助上限額・補助率・対象事業者・
概要・詳細URL・取得日時の 10 項目。

## 動作

1. `config/sources.yaml` の `jgrants.target_areas` × `keywords` で
   J-Grants API を網羅クエリ（47都道府県＋東京23区）。重複は ID で排除。
2. `custom_sites` を巡回し、対応するパーサーを実行。
3. 取得した補助金 ID を `data/subsidies.db` と照合：
   - 新規 ID → スプレッドシートの「公募中一覧」シート上部に追記（薄黄色）
   - 既存 ID で内容ハッシュ変化 → 「更新履歴」シートに追記
4. 締切が 7 日以内のセルは薄赤色で強調。
5. 失敗は `logs/YYYY-MM-DD.log` に記録し、処理は続行。

## インストール手順

前提: Python 3.10 以上、macOS（launchd 利用時）。

```bash
git clone <this-repo> subsidy-collector
cd subsidy-collector

python3 -m venv .venv
source .venv/bin/activate

pip install -U pip
pip install -r requirements.txt
```

## Google スプレッドシート 初期セットアップ

### 1. スプレッドシートを作成

Google ドライブ上で空の新規スプレッドシートを作成し、URL の `/d/` と
`/edit` の間にある **スプレッドシート ID** を控える。

```
https://docs.google.com/spreadsheets/d/<ここがID>/edit
```

シート（タブ）は実行時に「公募中一覧」「更新履歴」が自動で作成される。
手動で用意する必要はなし。

### 2. GCP プロジェクトでサービスアカウントを作成

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを選択
   または新規作成。
2. **APIs & Services → Library** から以下 2 つを有効化：
   - Google Sheets API
   - Google Drive API
3. **IAM & Admin → Service Accounts → Create service account**
4. 作成したサービスアカウントを開き **Keys → Add Key → Create new key (JSON)**
   をクリックして鍵 JSON をダウンロード。
5. ダウンロードした JSON を本リポジトリの `config/service_account.json`
   として配置（`.gitignore` 済）。

### 3. スプレッドシートを共有

サービスアカウントのメールアドレス（`xxxx@xxxx.iam.gserviceaccount.com`、
JSON 内の `client_email`）に、作成したスプレッドシートを **編集者権限** で共有。

### 4. `config/sources.yaml` に書き込み先を設定

```yaml
output:
  spreadsheet_id: "1AbCdEfGh..."             # 上記で控えたID
  service_account_json: "config/service_account.json"
```

## 初回実行手順

```bash
source .venv/bin/activate
python -m src.main
```

- 初回は全件「新規」扱いとなり、スプレッドシート全行が薄黄色になります。
- ログは `logs/YYYY-MM-DD.log` に出力されます。
- `data/subsidies.db` はローカルに自動生成され、以降の差分判定に使われます。

## launchd 登録手順（毎朝 8:00 自動実行）

1. `launchd/com.hjp.subsidy-collector.plist` を編集し、4 箇所の
   `/ABSOLUTE/PATH/TO/subsidy-collector` を本リポジトリの絶対パスに置換。

2. `~/Library/LaunchAgents/` にコピー：

   ```bash
   cp launchd/com.hjp.subsidy-collector.plist ~/Library/LaunchAgents/
   ```

3. ロード：

   ```bash
   launchctl load ~/Library/LaunchAgents/com.hjp.subsidy-collector.plist
   ```

4. 動作確認（即時実行）：

   ```bash
   launchctl start com.hjp.subsidy-collector
   tail -f logs/$(date +%Y-%m-%d).log
   ```

5. 解除：

   ```bash
   launchctl unload ~/Library/LaunchAgents/com.hjp.subsidy-collector.plist
   ```

> macOS のフルディスクアクセス確認: System Settings → Privacy & Security →
> Full Disk Access に `launchd`（または Terminal）を追加してください。

## 自治体追加手順

### J-Grants が対応している自治体を追加する場合

`config/sources.yaml` の `jgrants.target_areas` リストに自治体名を 1 行追加するだけ。

```yaml
jgrants:
  target_areas:
    - 東京都渋谷区
    - 大阪府大阪市     # ← 追加
```

### 自治体独自サイトを追加する場合

1. `src/parsers/<自治体スラッグ>.py` を新規作成し、`Parser` を継承したクラスを実装：

   ```python
   from typing import List
   from urllib.parse import urljoin
   from bs4 import BeautifulSoup
   from src.models import Subsidy
   from src.parsers.base import Parser

   class YokohamaCityParser(Parser):
       name = "yokohama_city"
       def parse(self, html: str, url: str) -> List[Subsidy]:
           soup = BeautifulSoup(html, "lxml")
           # ... 補助金リンクの抽出
           return []

   PARSER = YokohamaCityParser()
   ```

2. `config/sources.yaml` の `custom_sites` に追記：

   ```yaml
   custom_sites:
     - url: https://www.city.yokohama.lg.jp/.../josei.html
       parser: yokohama_city
   ```

3. 次回実行から自動で取得対象に含まれます。`src/parsers/` に置いたファイル名
   （拡張子なし）が `parser:` に指定する識別子です。

## 設定リファレンス

### `config/sources.yaml`

| キー | 用途 |
|---|---|
| `output.spreadsheet_id` | 書き込み先の Google スプレッドシート ID |
| `output.service_account_json` | サービスアカウント JSON のパス |
| `jgrants.keywords` | API 検索キーワード（複数指定し OR 検索） |
| `jgrants.target_areas` | `target_area_search` に渡す自治体名のリスト |
| `jgrants.include_no_area` | 全国対象（地域未指定）の補助金も取得するか |
| `custom_sites[].url` | 監視対象 URL |
| `custom_sites[].parser` | `src/parsers/` のモジュール名（拡張子なし） |

### `config/jgrants_fields.yaml`

J-Grants API のレスポンス構造が変更された場合、このファイルの編集だけで
コード修正なしに追従可能。各内部キーに対し、API レスポンスのキー候補を上から順に
探し、最初に値が入っているものを採用します。

## エラー処理

- API 取得失敗・サイト構造変更による parse 失敗・Sheets 書き込み失敗は
  全てログに記録し、できる限り続行します。
- ログは日付別に `logs/YYYY-MM-DD.log` に出力。
- 連続失敗時の Gmail 通知は `src/notifier.py` に TODO コメントで実装箇所を
  明示しています。本実装は次フェーズ。

## 既知の注意点

- 初回実行時は J-Grants の全カテゴリ × 全都道府県 × 全キーワードを叩くため
  数分かかる場合があります（リクエスト間に 0.4 秒ウェイト）。
- J-Grants API の実レスポンス構造は仕様変更がありえます。差異が出た場合は
  `config/jgrants_fields.yaml` のマッピングを修正してください。
- サンプルパーサー（`tokyo_metro`, `shibuya_city`）はリンクテキスト中の
  「補助/助成/奨励」を含むものを緩く拾う実装です。本番運用では各サイトに
  合わせた CSS セレクタへ強化を推奨します。
- Sheets API には 1 分あたりの書き込み回数制限があります。新規行が大量
  （数百〜千件）になる初回実行時はバッチを 100 行単位に分割するなど
  追加調整を検討してください。

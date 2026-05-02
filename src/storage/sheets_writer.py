"""Google スプレッドシート出力。

- ワークシート「公募中一覧」: 新規補助金を 2 行目に挿入し、上に積む。
  新規行は薄黄色塗り。締切が 7 日以内のセルは薄赤塗り。
- ワークシート「更新履歴」: 既存補助金の変更を追記。

塗り分けは実行のたびに以下の順で適用する：
  1. データ範囲全体の背景色をクリア
  2. 新規行（今回追加分）を黄色に
  3. 締切日列を全行スキャンし、7 日以内なら赤色に

認証はサービスアカウント。事前にスプレッドシートを SA メールアドレスへ
編集権限で共有しておくこと。
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import gspread
from dateutil import parser as date_parser
from google.oauth2.service_account import Credentials
from gspread.exceptions import WorksheetNotFound
from gspread.utils import rowcol_to_a1

from src.logger import get_logger
from src.models import HEADERS, UPDATE_HEADERS, Subsidy

SHEET_MAIN = "公募中一覧"
SHEET_UPDATES = "更新履歴"

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
]

YELLOW = {"red": 1.0, "green": 0.95, "blue": 0.80}
RED = {"red": 0.97, "green": 0.81, "blue": 0.80}
WHITE = {"red": 1.0, "green": 1.0, "blue": 1.0}

END_DATE_COL = HEADERS.index("締切日") + 1


class SheetsWriter:
    def __init__(self, spreadsheet_id: str, service_account_path: Path):
        self.log = get_logger("subsidy.sheets")
        self.spreadsheet_id = spreadsheet_id
        creds = Credentials.from_service_account_file(
            str(service_account_path), scopes=SCOPES
        )
        self.client = gspread.authorize(creds)
        self.ss = self.client.open_by_key(spreadsheet_id)
        self.main = self._ensure_worksheet(SHEET_MAIN, HEADERS)
        self.updates = self._ensure_worksheet(SHEET_UPDATES, UPDATE_HEADERS)

    def _ensure_worksheet(self, title: str, headers: List[str]):
        try:
            ws = self.ss.worksheet(title)
        except WorksheetNotFound:
            ws = self.ss.add_worksheet(title=title, rows=1000, cols=max(10, len(headers)))
            ws.update("A1", [headers])
            ws.format(
                f"A1:{rowcol_to_a1(1, len(headers))}",
                {"textFormat": {"bold": True}},
            )
        return ws

    def write(self, new_items: Iterable[Subsidy], updates: Iterable[Tuple[Subsidy, dict]]) -> None:
        new_items = list(new_items)
        updates = list(updates)

        self._write_main(new_items)
        self._write_updates(updates)

        self.log.info("Sheets 更新: 新規 %d 件 / 更新 %d 件", len(new_items), len(updates))

    def _write_main(self, new_items: List[Subsidy]) -> None:
        # 1. 既存データ範囲の塗りをリセット（ヘッダ除く）
        last_col = rowcol_to_a1(1, len(HEADERS))[:-1]  # "J"
        existing_rows = self.main.row_count
        if existing_rows >= 2:
            self.main.format(
                f"A2:{last_col}{existing_rows}",
                {"backgroundColor": WHITE},
            )

        # 2. 新規行を 2 行目に挿入
        if new_items:
            rows = [item.to_row() for item in new_items]
            self.main.insert_rows(rows, row=2, value_input_option="USER_ENTERED")
            yellow_range = f"A2:{last_col}{1 + len(new_items)}"
            self.main.format(yellow_range, {"backgroundColor": YELLOW})

        # 3. 締切日列を全件スキャンし 7 日以内を赤
        self._color_deadlines()

    def _color_deadlines(self) -> None:
        end_col_letter = rowcol_to_a1(1, END_DATE_COL)[:-1]
        values = self.main.col_values(END_DATE_COL)
        today = date.today()
        red_ranges = []
        for idx, raw in enumerate(values[1:], start=2):  # ヘッダ行を除く
            d = _parse_date(raw)
            if d is None:
                continue
            if today <= d <= today + timedelta(days=7):
                red_ranges.append(f"{end_col_letter}{idx}")

        # gspread はバッチで複数 range を渡せる
        if red_ranges:
            self.main.batch_format([
                {"range": r, "format": {"backgroundColor": RED}} for r in red_ranges
            ])

    def _write_updates(self, updates: List[Tuple[Subsidy, dict]]) -> None:
        if not updates:
            return
        detected_at = datetime.now().isoformat(timespec="seconds")
        rows = []
        for s, prev in updates:
            rows.append([
                s.name,
                s.detail_url,
                "",  # 旧 hash は DB 側で破棄しているため空欄
                s.content_hash,
                _summarize_payload(prev),
                _summarize_payload(s.to_dict()),
                detected_at,
            ])
        self.updates.append_rows(rows, value_input_option="USER_ENTERED")


def _parse_date(s: Any):
    if not s:
        return None
    try:
        return date_parser.parse(str(s)).date()
    except (ValueError, TypeError, OverflowError):
        return None


def _summarize_payload(payload: Dict[str, Any]) -> str:
    if not payload:
        return ""
    keys = ["end_date", "max_amount", "subsidy_rate", "overview"]
    return " / ".join(f"{k}={payload.get(k, '')}" for k in keys)

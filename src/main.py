"""エントリーポイント。

  python -m src.main

毎朝 launchd から呼ばれる想定。例外で全体停止しないよう、各 Collector
の失敗は内部で握りつぶし、ログに残して続行する。
"""
from __future__ import annotations

import sys
import traceback
from pathlib import Path
from typing import List, Tuple

from src.collectors.custom_site import CustomSiteCollector
from src.collectors.jgrants import JGrantsCollector
from src.config import DATA_DIR, PROJECT_ROOT, load_sources
from src.logger import get_logger
from src.models import Subsidy
from src.notifier import notify_failures
from src.storage.db import SubsidyDB
from src.storage.sheets_writer import SheetsWriter

DB_PATH = DATA_DIR / "subsidies.db"


def collect_all(log) -> Tuple[List[Subsidy], int]:
    """全 Collector を順に実行し、収集結果と失敗数を返す。"""
    collectors = [JGrantsCollector(), CustomSiteCollector()]
    all_items: List[Subsidy] = []
    failures = 0
    for c in collectors:
        try:
            items = c.fetch()
            all_items.extend(items)
            log.info("collector=%s: %d 件取得", c.name, len(items))
        except Exception as e:
            failures += 1
            log.error("collector=%s 致命的失敗: %s", c.name, e)
            log.error(traceback.format_exc())
    return all_items, failures


def _resolve_sa_path(raw: str) -> Path:
    p = Path(raw)
    return p if p.is_absolute() else PROJECT_ROOT / p


def main() -> int:
    log = get_logger()
    log.info("=== 補助金収集 開始 ===")

    output_cfg = load_sources().get("output") or {}
    spreadsheet_id = output_cfg.get("spreadsheet_id", "").strip()
    sa_path = _resolve_sa_path(output_cfg.get("service_account_json", ""))

    if not spreadsheet_id or spreadsheet_id == "YOUR_SPREADSHEET_ID_HERE":
        log.error("config/sources.yaml の output.spreadsheet_id を設定してください")
        return 2
    if not sa_path.exists():
        log.error("サービスアカウントJSONが見つかりません: %s", sa_path)
        return 2

    items, failures = collect_all(log)

    db = SubsidyDB(DB_PATH)
    new_items: List[Subsidy] = []
    updates: List[Tuple[Subsidy, dict]] = []

    try:
        for s in items:
            res = db.upsert(s)
            if res.status == "new":
                new_items.append(s)
            elif res.status == "updated":
                updates.append((s, res.previous_payload or {}))
    finally:
        db.close()

    try:
        writer = SheetsWriter(spreadsheet_id, sa_path)
        writer.write(new_items, updates)
    except Exception as e:
        failures += 1
        log.error("Sheets 書き込み失敗: %s", e)
        log.error(traceback.format_exc())

    if failures:
        notify_failures(failures, "see logs/")

    log.info("=== 補助金収集 終了 ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())

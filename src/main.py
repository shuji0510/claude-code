"""エントリーポイント。

  python -m src.main

毎朝 launchd から呼ばれる想定。例外で全体停止しないよう、各 Collector
の失敗は内部で握りつぶし、ログに残して続行する。
"""
from __future__ import annotations

import sys
import traceback
from typing import List, Tuple

from src.collectors.custom_site import CustomSiteCollector
from src.collectors.jgrants import JGrantsCollector
from src.config import DATA_DIR
from src.logger import get_logger
from src.models import Subsidy
from src.notifier import notify_failures
from src.storage import excel_writer
from src.storage.db import SubsidyDB

DB_PATH = DATA_DIR / "subsidies.db"
XLSX_PATH = DATA_DIR / "subsidies.xlsx"


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


def main() -> int:
    log = get_logger()
    log.info("=== 補助金収集 開始 ===")

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

    excel_writer.write(XLSX_PATH, new_items, updates)
    log.info("Excel 更新: 新規 %d 件 / 更新 %d 件", len(new_items), len(updates))

    if failures:
        notify_failures(failures, "see logs/")

    log.info("=== 補助金収集 終了 ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""SQLite による差分管理。

スキーマ:
    subsidies(unique_id PK, source, source_id, content_hash,
              first_seen, last_seen, payload_json)

`upsert()` の戻り値で「新規」「更新」「変更なし」を判別し、
呼び出し側（main）が Excel への振り分けを行う。
"""
from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from src.models import Subsidy


@dataclass
class UpsertResult:
    status: str  # "new" | "updated" | "unchanged"
    previous_payload: Optional[dict] = None


class SubsidyDB:
    def __init__(self, db_path: Path):
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS subsidies (
                unique_id     TEXT PRIMARY KEY,
                source        TEXT NOT NULL,
                source_id     TEXT NOT NULL,
                content_hash  TEXT NOT NULL,
                first_seen    TEXT NOT NULL,
                last_seen     TEXT NOT NULL,
                payload_json  TEXT NOT NULL
            )
            """
        )
        self.conn.commit()

    def upsert(self, s: Subsidy) -> UpsertResult:
        now = datetime.now().isoformat(timespec="seconds")
        cur = self.conn.execute(
            "SELECT content_hash, payload_json FROM subsidies WHERE unique_id = ?",
            (s.unique_id,),
        )
        row = cur.fetchone()
        payload = json.dumps(s.to_dict(), ensure_ascii=False)

        if row is None:
            self.conn.execute(
                "INSERT INTO subsidies VALUES (?, ?, ?, ?, ?, ?, ?)",
                (s.unique_id, s.source, s.source_id, s.content_hash,
                 now, now, payload),
            )
            self.conn.commit()
            return UpsertResult(status="new")

        if row["content_hash"] == s.content_hash:
            self.conn.execute(
                "UPDATE subsidies SET last_seen = ? WHERE unique_id = ?",
                (now, s.unique_id),
            )
            self.conn.commit()
            return UpsertResult(status="unchanged")

        prev_payload = json.loads(row["payload_json"])
        self.conn.execute(
            "UPDATE subsidies SET content_hash = ?, last_seen = ?, payload_json = ? "
            "WHERE unique_id = ?",
            (s.content_hash, now, payload, s.unique_id),
        )
        self.conn.commit()
        return UpsertResult(status="updated", previous_payload=prev_payload)

    def close(self) -> None:
        self.conn.close()

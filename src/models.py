from __future__ import annotations

import hashlib
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Optional


@dataclass
class Subsidy:
    source: str
    source_id: str
    name: str
    organization: str
    start_date: str
    end_date: str
    max_amount: str
    subsidy_rate: str
    target: str
    overview: str
    detail_url: str
    fetched_at: str = field(default_factory=lambda: datetime.now().isoformat(timespec="seconds"))

    @property
    def unique_id(self) -> str:
        return f"{self.source}:{self.source_id}"

    @property
    def content_hash(self) -> str:
        payload = "|".join([
            self.name, self.start_date, self.end_date,
            self.max_amount, self.subsidy_rate, self.overview,
        ])
        return hashlib.sha1(payload.encode("utf-8")).hexdigest()

    def to_row(self) -> list:
        return [
            self.name, self.organization, self.start_date, self.end_date,
            self.max_amount, self.subsidy_rate, self.target, self.overview,
            self.detail_url, self.fetched_at,
        ]

    def to_dict(self) -> dict:
        return asdict(self)


HEADERS = [
    "補助金名", "実施機関", "公募開始日", "締切日", "補助上限額",
    "補助率", "対象事業者", "概要", "詳細URL", "取得日時",
]

UPDATE_HEADERS = [
    "補助金名", "詳細URL", "変更前ハッシュ", "変更後ハッシュ",
    "変更前内容", "変更後内容", "検出日時",
]

"""J-Grants 公開 API クライアント。

仕様参考: https://api.jgrants-portal.go.jp/exp/v1/public/subsidies
- 必須クエリ: keyword, sort, order, acceptance
- acceptance=1 で公募中のみ取得
- target_area_search で都道府県・市区町村フィルタ

レスポンスのフィールド名は揺れがあるため、config/jgrants_fields.yaml の
マッピングを通して内部 Subsidy データクラスに正規化する。
"""
from __future__ import annotations

import time
from typing import Any, Dict, Iterable, List, Optional

import requests

from src.collectors.base import Collector
from src.config import load_jgrants_field_map, load_sources
from src.logger import get_logger
from src.models import Subsidy

API_BASE = "https://api.jgrants-portal.go.jp/exp/v1/public/subsidies"
DETAIL_BASE = "https://api.jgrants-portal.go.jp/exp/v1/public/subsidies/id/"
PORTAL_DETAIL_BASE = "https://www.jgrants-portal.go.jp/subsidy/"

REQUEST_TIMEOUT = 30
RETRY = 2
INTER_REQUEST_SLEEP = 0.4


class JGrantsCollector(Collector):
    name = "jgrants"

    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "subsidy-collector/1.0 (+https://example.local)",
        })
        self.log = get_logger("subsidy.jgrants")
        self.field_map = load_jgrants_field_map()
        sources = load_sources().get("jgrants", {})
        self.keywords: List[str] = sources.get("keywords") or ["補助金"]
        self.target_areas: List[str] = sources.get("target_areas") or []
        self.include_no_area: bool = bool(sources.get("include_no_area", True))

    def fetch(self) -> List[Subsidy]:
        seen: Dict[str, Subsidy] = {}

        area_queries: List[Optional[str]] = list(self.target_areas)
        if self.include_no_area or not area_queries:
            area_queries.append(None)

        for keyword in self.keywords:
            for area in area_queries:
                items = self._safe_query(keyword=keyword, area=area)
                for raw in items:
                    s = self._normalize(raw)
                    if s and s.unique_id not in seen:
                        seen[s.unique_id] = s
                time.sleep(INTER_REQUEST_SLEEP)

        self.log.info("J-Grants: 取得 %d 件（重複排除後）", len(seen))
        return list(seen.values())

    def _safe_query(self, keyword: str, area: Optional[str]) -> List[Dict[str, Any]]:
        params = {
            "keyword": keyword,
            "sort": "created_date",
            "order": "DESC",
            "acceptance": "1",
        }
        if area:
            params["target_area_search"] = area

        for attempt in range(RETRY + 1):
            try:
                resp = self.session.get(API_BASE, params=params, timeout=REQUEST_TIMEOUT)
                resp.raise_for_status()
                payload = resp.json()
                return payload.get("result") or payload.get("data") or []
            except requests.RequestException as e:
                self.log.warning(
                    "J-Grants API 失敗 (keyword=%s, area=%s, attempt=%d): %s",
                    keyword, area, attempt + 1, e,
                )
                if attempt < RETRY:
                    time.sleep(2 ** attempt)
            except ValueError as e:
                self.log.error("J-Grants JSON パース失敗: %s", e)
                return []
        return []

    def _normalize(self, raw: Dict[str, Any]) -> Optional[Subsidy]:
        def pick(field: str) -> str:
            for candidate in self.field_map.get(field, []):
                if candidate in raw and raw[candidate] not in (None, ""):
                    return _stringify(raw[candidate])
            return ""

        sid = pick("id")
        if not sid:
            return None

        detail_url = pick("detail_url") or f"{PORTAL_DETAIL_BASE}{sid}"
        return Subsidy(
            source=self.name,
            source_id=sid,
            name=pick("name"),
            organization=pick("organization"),
            start_date=pick("start_date"),
            end_date=pick("end_date"),
            max_amount=pick("max_amount"),
            subsidy_rate=pick("subsidy_rate"),
            target=pick("target"),
            overview=pick("overview"),
            detail_url=detail_url,
        )


def _stringify(value: Any) -> str:
    if isinstance(value, list):
        return ", ".join(str(v) for v in value if v is not None)
    if isinstance(value, dict):
        return ", ".join(f"{k}:{v}" for k, v in value.items())
    return str(value)

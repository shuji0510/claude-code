"""config/sources.yaml の custom_sites を順に取得し、対応する parser に流す。"""
from __future__ import annotations

import importlib
import time
from typing import List

import requests

from src.collectors.base import Collector
from src.config import load_sources
from src.logger import get_logger
from src.models import Subsidy

REQUEST_TIMEOUT = 30
INTER_REQUEST_SLEEP = 0.5


class CustomSiteCollector(Collector):
    name = "custom_site"

    def __init__(self):
        self.log = get_logger("subsidy.custom_site")
        self.sites = load_sources().get("custom_sites") or []
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "subsidy-collector/1.0 (+https://example.local)",
        })

    def fetch(self) -> List[Subsidy]:
        results: List[Subsidy] = []
        for entry in self.sites:
            url = entry.get("url")
            parser_name = entry.get("parser")
            if not (url and parser_name):
                continue
            try:
                parser = self._load_parser(parser_name)
            except Exception as e:
                self.log.error("パーサー読み込み失敗 %s: %s", parser_name, e)
                continue
            try:
                resp = self.session.get(url, timeout=REQUEST_TIMEOUT)
                resp.raise_for_status()
                resp.encoding = resp.apparent_encoding or resp.encoding
                items = parser.parse(resp.text, url)
                self.log.info("%s: %d 件", parser_name, len(items))
                results.extend(items)
            except requests.RequestException as e:
                self.log.warning("取得失敗 %s: %s", url, e)
            except Exception as e:
                self.log.error("パース失敗 %s (parser=%s): %s", url, parser_name, e)
            time.sleep(INTER_REQUEST_SLEEP)
        return results

    def _load_parser(self, parser_name: str):
        module = importlib.import_module(f"src.parsers.{parser_name}")
        if hasattr(module, "PARSER"):
            return module.PARSER
        # PARSER 定数がなければ Parser サブクラスを自動検出してインスタンス化
        from src.parsers.base import Parser
        for attr in vars(module).values():
            if isinstance(attr, type) and issubclass(attr, Parser) and attr is not Parser:
                return attr()
        raise RuntimeError(f"Parser インスタンスが見つかりません: {parser_name}")

"""渋谷区の助成金一覧ページから補助金リンクを抽出するサンプル実装。"""
from __future__ import annotations

from typing import List
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from src.models import Subsidy
from src.parsers.base import Parser

KEYWORDS = ("補助", "助成", "奨励")


class ShibuyaCityParser(Parser):
    name = "shibuya_city"

    def parse(self, html: str, url: str) -> List[Subsidy]:
        soup = BeautifulSoup(html, "lxml")
        results: List[Subsidy] = []
        seen_urls = set()
        for a in soup.find_all("a", href=True):
            text = (a.get_text() or "").strip()
            if not text or not any(k in text for k in KEYWORDS):
                continue
            link = urljoin(url, a["href"])
            if link in seen_urls:
                continue
            seen_urls.add(link)
            results.append(Subsidy(
                source="shibuya_city",
                source_id=link,
                name=text,
                organization="東京都渋谷区",
                start_date="",
                end_date="",
                max_amount="",
                subsidy_rate="",
                target="",
                overview=text,
                detail_url=link,
            ))
        return results


PARSER = ShibuyaCityParser()

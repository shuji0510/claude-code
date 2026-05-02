"""東京都 報道発表ページから補助金/助成金/奨励金リンクを抽出するサンプル実装。

報道発表のリスト構造は変わりやすいため、このパーサーは「キーワードを含むリンク」
を緩めに拾う実装。本番運用ではサイトに合わせた CSS セレクタへ強化する。
"""
from __future__ import annotations

from typing import List
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from src.models import Subsidy
from src.parsers.base import Parser

KEYWORDS = ("補助", "助成", "奨励")


class TokyoMetroParser(Parser):
    name = "tokyo_metro"

    def parse(self, html: str, url: str) -> List[Subsidy]:
        soup = BeautifulSoup(html, "lxml")
        results: List[Subsidy] = []
        seen_urls = set()
        for a in soup.find_all("a", href=True):
            text = (a.get_text() or "").strip()
            if not text:
                continue
            if not any(k in text for k in KEYWORDS):
                continue
            link = urljoin(url, a["href"])
            if link in seen_urls:
                continue
            seen_urls.add(link)
            results.append(Subsidy(
                source="tokyo_metro",
                source_id=link,
                name=text,
                organization="東京都",
                start_date="",
                end_date="",
                max_amount="",
                subsidy_rate="",
                target="",
                overview=text,
                detail_url=link,
            ))
        return results


PARSER = TokyoMetroParser()

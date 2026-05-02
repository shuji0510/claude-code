"""自治体独自サイト用パーサーの基底クラス。

新しい自治体を追加する手順:
  1. このファイルを継承したクラスを src/parsers/<自治体名>.py に作成
  2. parse(html, url) を実装し、Subsidy のリストを返す
  3. config/sources.yaml の custom_sites に
     - url: <監視対象URL>
       parser: <ファイル名（拡張子なし）>
     を追記

main からは src.parsers.<parser> をインポートし、Parser サブクラスを取り出す。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from src.models import Subsidy


class Parser(ABC):
    name: str = "base"

    @abstractmethod
    def parse(self, html: str, url: str) -> List[Subsidy]:
        """HTML 文字列を受け取り、補助金情報のリストを返す。"""

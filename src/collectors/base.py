from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

from src.models import Subsidy


class Collector(ABC):
    name: str = "base"

    @abstractmethod
    def fetch(self) -> List[Subsidy]:
        """補助金一覧を取得して Subsidy のリストを返す。

        例外で落とさず、内部で握りつぶしてログに記録し、空リストを返してもよい
        （他の収集元の処理は継続させる）。
        """

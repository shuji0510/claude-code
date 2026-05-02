"""失敗通知モジュール（次フェーズで本実装）。

連続失敗カウントは logs/ に簡易マーカーで持つか、DB に拡張するか未定。
TODO: Gmail API 経由で失敗を通知する実装をここに追加する。
"""
from __future__ import annotations

from src.logger import get_logger

CONSECUTIVE_FAILURE_THRESHOLD = 3


def notify_failures(failure_count: int, last_error: str) -> None:
    log = get_logger("subsidy.notifier")
    if failure_count < CONSECUTIVE_FAILURE_THRESHOLD:
        return

    # TODO: Gmail API による通知を実装する。
    # 想定実装:
    #   - google-auth, google-api-python-client を追加
    #   - OAuth トークンを config/ に配置（.gitignore 対象）
    #   - users().messages().send() で件名「補助金収集が連続失敗」を送信
    log.warning(
        "通知スタブ: 連続 %d 回失敗（last_error=%s）。Gmail 通知は次フェーズで実装。",
        failure_count, last_error,
    )

#!/usr/bin/env python3
"""Generate images with OpenAI gpt-image-2 (ChatGPT Images 2.0).

Hits POST https://api.openai.com/v1/images/generations and writes the
base64 payload(s) to disk. Requires OPENAI_API_KEY.

Uses only the stdlib so it runs anywhere Python 3.8+ is available.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API_URL = "https://api.openai.com/v1/images/generations"
MODEL = "gpt-image-2"


def build_body(args: argparse.Namespace) -> dict:
    body: dict = {
        "model": MODEL,
        "prompt": args.prompt,
        "n": args.n,
        "size": args.size,
        "quality": args.quality,
        "output_format": args.output_format,
        "background": args.background,
        "moderation": args.moderation,
    }
    if args.output_format in ("jpeg", "webp") and args.output_compression is not None:
        body["output_compression"] = args.output_compression
    if args.thinking != "off":
        body["reasoning_effort"] = args.thinking
    return body


def call_api(body: dict, api_key: str, timeout: int) -> dict:
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"OpenAI API error {e.code}: {detail}") from e
    except urllib.error.URLError as e:
        raise SystemExit(f"Network error: {e.reason}") from e


def save_outputs(payload: dict, out: Path, fmt: str) -> list[Path]:
    data = payload.get("data") or []
    if not data:
        raise SystemExit(f"No image data in response: {json.dumps(payload)[:500]}")
    out.parent.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for i, item in enumerate(data):
        b64 = item.get("b64_json")
        if not b64:
            raise SystemExit(f"Missing b64_json in data[{i}]")
        target = out if len(data) == 1 else out.with_name(f"{out.stem}-{i + 1}{out.suffix}")
        if target.suffix.lower().lstrip(".") != fmt:
            target = target.with_suffix(f".{fmt}")
        target.write_bytes(base64.b64decode(b64))
        paths.append(target)
    return paths


def main() -> None:
    p = argparse.ArgumentParser(description="Generate images with gpt-image-2.")
    p.add_argument("--prompt", required=True, help="Text prompt.")
    p.add_argument("--out", required=True, type=Path, help="Output file path (extension matches --output-format).")
    p.add_argument("--size", default="1024x1024",
                   help='WxH up to 2000 on long edge, or "auto". Ratios: 1:1, 3:2, 2:3, 16:9, 9:16, 3:1, 1:3.')
    p.add_argument("--quality", default="high", choices=["auto", "low", "medium", "high"])
    p.add_argument("--n", type=int, default=1)
    p.add_argument("--output-format", default="png", choices=["png", "jpeg", "webp"])
    p.add_argument("--output-compression", type=int, default=None, help="0-100, jpeg/webp only.")
    p.add_argument("--background", default="auto", choices=["transparent", "opaque", "auto"])
    p.add_argument("--moderation", default="auto", choices=["auto", "low"])
    p.add_argument("--thinking", default="off", choices=["off", "low", "medium", "high"],
                   help="Reasoning effort for gpt-image-2 thinking mode.")
    p.add_argument("--timeout", type=int, default=300)
    args = p.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit("OPENAI_API_KEY is not set.")

    if args.background == "transparent" and args.output_format == "jpeg":
        sys.exit("transparent background requires png or webp, not jpeg.")

    body = build_body(args)
    payload = call_api(body, api_key, args.timeout)
    paths = save_outputs(payload, args.out, args.output_format)
    for path in paths:
        print(f"wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

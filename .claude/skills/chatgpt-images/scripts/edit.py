#!/usr/bin/env python3
"""Edit or compose images with OpenAI gpt-image-2 (ChatGPT Images 2.0).

Hits POST https://api.openai.com/v1/images/edits as multipart/form-data and
writes the base64 payload(s) to disk. Requires OPENAI_API_KEY.

Supports inpainting (--image + --mask) and multi-image composition
(--image repeated, no mask).
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

API_URL = "https://api.openai.com/v1/images/edits"
MODEL = "gpt-image-2"


def _guess_mime(path: Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    return mime or "application/octet-stream"


def _encode_multipart(fields: list[tuple[str, str]], files: list[tuple[str, Path]]) -> tuple[bytes, str]:
    boundary = f"----gpti2-{uuid.uuid4().hex}"
    buf = bytearray()
    for name, value in fields:
        buf += f"--{boundary}\r\n".encode()
        buf += f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode()
        buf += value.encode("utf-8")
        buf += b"\r\n"
    for name, path in files:
        buf += f"--{boundary}\r\n".encode()
        buf += (
            f'Content-Disposition: form-data; name="{name}"; filename="{path.name}"\r\n'
        ).encode()
        buf += f"Content-Type: {_guess_mime(path)}\r\n\r\n".encode()
        buf += path.read_bytes()
        buf += b"\r\n"
    buf += f"--{boundary}--\r\n".encode()
    return bytes(buf), boundary


def build_fields(args: argparse.Namespace) -> list[tuple[str, str]]:
    fields: list[tuple[str, str]] = [
        ("model", MODEL),
        ("prompt", args.prompt),
        ("n", str(args.n)),
        ("size", args.size),
        ("quality", args.quality),
        ("output_format", args.output_format),
        ("background", args.background),
        ("input_fidelity", args.input_fidelity),
    ]
    if args.output_format in ("jpeg", "webp") and args.output_compression is not None:
        fields.append(("output_compression", str(args.output_compression)))
    if args.thinking != "off":
        fields.append(("reasoning_effort", args.thinking))
    return fields


def call_api(body: bytes, boundary: str, api_key: str, timeout: int) -> dict:
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Content-Length": str(len(body)),
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
    p = argparse.ArgumentParser(description="Edit or compose images with gpt-image-2.")
    p.add_argument("--prompt", required=True)
    p.add_argument("--image", required=True, action="append", type=Path,
                   help="Source image. Pass multiple times for multi-image composition.")
    p.add_argument("--mask", type=Path, default=None,
                   help="PNG mask. Transparent pixels = region to regenerate. Single-image edits only.")
    p.add_argument("--out", required=True, type=Path)
    p.add_argument("--size", default="1024x1024")
    p.add_argument("--quality", default="high", choices=["auto", "low", "medium", "high"])
    p.add_argument("--n", type=int, default=1)
    p.add_argument("--output-format", default="png", choices=["png", "jpeg", "webp"])
    p.add_argument("--output-compression", type=int, default=None)
    p.add_argument("--background", default="auto", choices=["transparent", "opaque", "auto"])
    p.add_argument("--input-fidelity", default="high", choices=["low", "high"])
    p.add_argument("--thinking", default="off", choices=["off", "low", "medium", "high"])
    p.add_argument("--timeout", type=int, default=300)
    args = p.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit("OPENAI_API_KEY is not set.")

    for img in args.image:
        if not img.is_file():
            sys.exit(f"image not found: {img}")
    if args.mask is not None:
        if len(args.image) != 1:
            sys.exit("--mask only works with a single --image.")
        if not args.mask.is_file():
            sys.exit(f"mask not found: {args.mask}")
    if args.background == "transparent" and args.output_format == "jpeg":
        sys.exit("transparent background requires png or webp, not jpeg.")

    fields = build_fields(args)
    files: list[tuple[str, Path]] = []
    if len(args.image) == 1:
        files.append(("image", args.image[0]))
    else:
        for img in args.image:
            files.append(("image[]", img))
    if args.mask is not None:
        files.append(("mask", args.mask))

    body, boundary = _encode_multipart(fields, files)
    payload = call_api(body, boundary, api_key, args.timeout)
    paths = save_outputs(payload, args.out, args.output_format)
    for path in paths:
        print(f"wrote {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

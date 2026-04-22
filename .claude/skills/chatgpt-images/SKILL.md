---
name: chatgpt-images
description: Generate or edit images with OpenAI's ChatGPT Images 2.0 (gpt-image-2) via the Images API. Use when the user asks to create, generate, draw, render, compose, or edit an image/illustration/poster/logo/diagram/thumbnail/mockup with ChatGPT / OpenAI / gpt-image-2 / DALL-E, or says things like "make an image of...", "画像を生成して", "ポスターを作って", "この画像を編集して".
---

# ChatGPT Images 2.0 (gpt-image-2)

Generate and edit images through OpenAI's `gpt-image-2` model (the model behind ChatGPT Images 2.0, released 2026-04-21). Supports up to 2000px on the long edge, 7 aspect ratios, multilingual text rendering, transparent backgrounds, image edits with masks, and reasoning-aware "thinking" mode.

## Prerequisites

- `OPENAI_API_KEY` must be set in the environment. If missing, stop and ask the user before making API calls — **do not** print or echo the key.
- Output files are always saved to disk (the API returns base64); never paste base64 into chat.
- Default output directory: `./generated-images/` (create if missing). Honour any path the user specifies.

## Decision flow

1. **Pure text → image?** Use `scripts/generate.py` (hits `POST /v1/images/generations`).
2. **Edit/extend/inpaint an existing image, or compose from reference images?** Use `scripts/edit.py` (hits `POST /v1/images/edits`, multipart).
3. **Multiple variants?** Pass `--n` (generate) up to the API limit; each variant is saved as a separate file.
4. **Text-heavy asset (poster, slide, infographic, manga panel, non-Latin script)?** Default to `--quality high` and `--thinking on` — gpt-image-2's reasoning mode markedly improves legibility, especially for 日本語 / 한국어 / 中文 / हिन्दी / বাংলা.
5. **Transparent PNG (logo, icon, sticker)?** Pass `--background transparent` and keep `--output-format png`.

## Core parameters (verbatim)

| Param | Accepted values | Notes |
|---|---|---|
| `model` | `"gpt-image-2"` | Required. |
| `prompt` | string, ≤ 32 000 chars | Describe subject, style, composition, text to render. |
| `size` | `"auto"` \| `"1024x1024"` \| `"1536x1024"` \| `"1024x1536"` \| `"2000x1125"` \| `"1125x2000"` \| `"2000x666"` \| `"666x2000"` \| any `WxH` ≤ 2000 on the long edge matching a supported ratio | Ratios: 1:1, 3:2, 2:3, 16:9, 9:16, 3:1, 1:3. |
| `quality` | `"auto"` \| `"low"` \| `"medium"` \| `"high"` | `low` = fast drafts. `high` for finals. |
| `n` | integer ≥ 1 | Number of variants. |
| `output_format` | `"png"` \| `"jpeg"` \| `"webp"` | Default `png`. |
| `output_compression` | 0–100 | Only with `jpeg` / `webp`. |
| `background` | `"transparent"` \| `"opaque"` \| `"auto"` | `transparent` requires `png` or `webp`. |
| `moderation` | `"auto"` \| `"low"` | `low` only when the user explicitly needs it. |
| `reasoning_effort` | `"none"` \| `"low"` \| `"medium"` \| `"high"` | gpt-image-2 "thinking" mode. Adds reasoning tokens to cost. |
| `input_fidelity` | `"low"` \| `"high"` | Edit endpoint: `high` preserves the source image more strictly. |

Response always contains `data[].b64_json` — gpt-image-2 does **not** support `response_format: "url"`.

## Workflow

### 1. Read the request carefully

Pull out, in order:
- Subject / content of the image (what's in it).
- Style (photoreal, illustration, 3D, flat, manga, blueprint, etc.).
- Any text that must appear **verbatim** — quote it in the prompt with `"..."` so the model renders it literally.
- Aspect ratio / target use (thumbnail, story, banner, print).
- Transparent background? Multiple variants? Reference image to edit?

Ask one clarifying question only if the request is truly underspecified (e.g. no subject at all). Otherwise make reasonable defaults and mention them.

### 2. Build a strong prompt

- Lead with the subject, then style, then composition, lighting, camera, mood.
- For text rendering, wrap the exact string in quotes and specify placement ("title `"SALE 50% OFF"` in large sans-serif, centered top").
- Keep it concrete. Vague prompts → generic output.

### 3. Run the helper

Text-to-image:

```bash
python .claude/skills/chatgpt-images/scripts/generate.py \
  --prompt "Cinematic poster of a lone astronaut on a red dune at sunset, title \"MARS 2049\" in bold condensed sans-serif at the top" \
  --size 1024x1536 \
  --quality high \
  --output-format png \
  --out ./generated-images/mars-poster.png
```

Image edit / inpaint / compose:

```bash
python .claude/skills/chatgpt-images/scripts/edit.py \
  --prompt "Replace the sky with a dramatic aurora; keep the foreground untouched" \
  --image ./input/landscape.png \
  --mask  ./input/sky-mask.png \
  --size 1536x1024 \
  --quality high \
  --out ./generated-images/landscape-aurora.png
```

Multi-image compose (no mask — gpt-image-2 fuses the references):

```bash
python .claude/skills/chatgpt-images/scripts/edit.py \
  --prompt "Product shot: place the sneaker from image 1 on the marble surface from image 2, studio lighting" \
  --image ./refs/sneaker.png --image ./refs/marble.png \
  --size 1024x1024 --quality high --input-fidelity high \
  --out ./generated-images/sneaker-on-marble.png
```

### 4. Verify & report

- Confirm the file exists and its size is non-trivial (> 10 KB).
- Report back: output path, size, quality, format, and any defaults you chose.
- If the user wanted text rendered, remind them to eyeball it — even gpt-image-2 can misspell rare glyphs.

## Raw curl (if Python is unavailable)

```bash
curl https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "A watercolor illustration of a fox reading a book under a cherry tree",
    "size": "1024x1024",
    "quality": "high",
    "n": 1,
    "reasoning_effort": "medium"
  }' \
  | jq -r '.data[0].b64_json' | base64 -d > out.png
```

Edit (multipart):

```bash
curl https://api.openai.com/v1/images/edits \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F model="gpt-image-2" \
  -F prompt="Add a rainbow in the sky" \
  -F image="@input.png" \
  -F mask="@mask.png" \
  -F size="1024x1024" \
  -F quality="high" \
  | jq -r '.data[0].b64_json' | base64 -d > edited.png
```

## Common pitfalls

- **Base64, not URL.** gpt-image-2 only returns `b64_json`. Never set `response_format`.
- **Mask alpha channel.** For `/images/edits`, the mask is a PNG where **transparent pixels = region to regenerate**. Same dimensions as the source image.
- **Transparent background + jpeg** → error. Use `png` or `webp`.
- **Aspect ratio drift.** If you pass an unsupported `WxH`, the API 400s. Stick to the listed ratios or use `"auto"`.
- **Secrets.** Never log `$OPENAI_API_KEY`, never commit it, and never write the key into example snippets.
- **Cost awareness.** High-quality 1024² is ~\$0.21/image; `reasoning_effort: high` adds reasoning-token cost on top. For iteration, start at `quality=low` and only upscale the final pick.
- **Content policy.** The API enforces moderation server-side. Don't retry the same prompt in a loop on a `content_policy_violation` — rephrase or ask the user.

## Wrap-up format

After generating, reply to the user with:

1. One-line summary: `Generated <file> (<size>, <quality>, <format>).`
2. The output path.
3. Any defaults chosen on their behalf (ratio, quality, reasoning).
4. Suggested next step (e.g. "want a variant with a darker palette?"), if useful.

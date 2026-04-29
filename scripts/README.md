# scripts/

## gen-image.sh — OpenAI GPT Image generation

`gpt-image-1` / `gpt-image-2` の画像生成 API をコマンドラインから呼び出します。

### セットアップ

1. OpenAI Platform で API キーを発行
   <https://platform.openai.com/api-keys>
2. シェルに環境変数を設定（`.env` を git にコミットしないこと）:

   ```sh
   export OPENAI_API_KEY="sk-..."
   # gpt-image-2 が利用可能になったら:
   export OPENAI_IMAGE_MODEL="gpt-image-2"
   ```

   永続化したい場合は `~/.zshrc` / `~/.bashrc` に追記。

3. 動作確認:

   ```sh
   ./scripts/gen-image.sh "a calico cat reading a book, watercolor"
   ```

### 使い方

```sh
./scripts/gen-image.sh "<prompt>" [output.png] [size]
```

| 引数      | デフォルト                           | 例                              |
| --------- | ------------------------------------ | ------------------------------- |
| prompt    | (必須)                               | `"sunset over mt. fuji, oil"`   |
| output    | `image-<timestamp>.png`              | `out/fuji.png`                  |
| size      | `1024x1024`                          | `1536x1024`, `1024x1536`, `auto`|

環境変数で挙動を変更:

- `OPENAI_IMAGE_MODEL` — `gpt-image-1` (default) / `gpt-image-2`
- `OPENAI_IMAGE_QUALITY` — `low` / `medium` / `high` / `auto`

### Claude Code から呼び出す

`.claude/settings.local.json` でこのスクリプトを許可済みなので、Claude Code 内で
そのまま依頼できます:

> 「scripts/gen-image.sh を使って『東京の夜景』の画像を tokyo.png に出力して」

### セキュリティ

`OPENAI_API_KEY` は **環境変数のみ** で渡し、ファイルには書かないでください。
万一 git に混入した場合は `../scan-secrets.sh` でスキャンし、Revoke + 再発行
してください（`../CHECKLIST.md` 参照）。

# 🌍 世界の国旗当てクイズ

表示された国旗の国名を4択から当てるブラウザゲームです。HTML / CSS / JavaScript だけで動く、依存ライブラリなしの軽量アプリです。

## 遊び方

`flag-quiz/index.html` をブラウザで開くだけです。

```
# 直接開く
open flag-quiz/index.html        # macOS
xdg-open flag-quiz/index.html    # Linux

# もしくは簡易サーバーで
cd flag-quiz && python3 -m http.server 8000
# → http://localhost:8000 を開く
```

## 特徴

- **地域フィルター** — アジア / ヨーロッパ / アフリカ / 南北アメリカ / オセアニア / すべて
- **問題数選択** — 10問 / 15問 / 20問 / 無制限
- **スコア & 連続正解（🔥ストリーク）** をリアルタイム表示
- **結果画面** — 正答率・最大連続正解・評価メッセージ
- **スマホ対応**（レスポンシブデザイン）
- 収録国数: 約90か国

## ファイル構成

| ファイル | 役割 |
|----------|------|
| `index.html`  | 画面のマークアップ |
| `style.css`   | スタイル（ダークテーマ） |
| `script.js`   | ゲームロジック |
| `countries.js`| 国データ（ISOコード・日本語名・地域） |

## 国旗画像について

国旗画像は無料CDN [flagcdn.com](https://flagcdn.com) から読み込みます。プレイにはインターネット接続が必要です（画像を読み込めない場合は警告が表示されます）。

## カスタマイズ

出題する国を増やしたい場合は `countries.js` の `COUNTRIES` 配列に追記してください。

```js
{ code: "sk", name: "スロバキア", region: "europe" },
```

`code` は [ISO 3166-1 alpha-2](https://ja.wikipedia.org/wiki/ISO_3166-1) の2文字コード（小文字）です。

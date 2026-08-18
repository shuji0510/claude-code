/**
 * sheets_gemini_analyze.gs
 * スプレッドシートで =GEMINI("...") を使えるようにするカスタム関数。
 *
 * 使用例:
 *   =GEMINI("次の売上データをもとに、月別トレンドを一言で: " & JOIN(",", A2:A13))
 *   =GEMINI_CLASSIFY(B2, "ポジティブ,ネガティブ,ニュートラル")
 *   =GEMINI_EXTRACT(C2, "会社名")
 *
 * 注意:
 *   - カスタム関数はセル数だけAPIを叩くため大量セルへの適用に注意
 *   - シート再計算のたびに呼ばれるので、結果は「値のみコピペ」で固定推奨
 */

/**
 * @param {string} prompt Geminiに投げるプロンプト
 * @return {string}
 * @customfunction
 */
function GEMINI(prompt) {
  if (!prompt) return '';
  return callGemini(String(prompt), { temperature: 0.2, maxOutputTokens: 512 });
}

/**
 * テキストをカテゴリのいずれかに分類
 * @param {string} text
 * @param {string} categories カンマ区切りのカテゴリ一覧
 * @return {string}
 * @customfunction
 */
function GEMINI_CLASSIFY(text, categories) {
  if (!text) return '';
  const prompt =
    '次のテキストを、以下カテゴリのいずれかに分類し、カテゴリ名だけを返してください。\n' +
    'カテゴリ: ' + categories + '\n' +
    'テキスト: ' + text;
  return callGemini(prompt, { temperature: 0, maxOutputTokens: 32 }).trim();
}

/**
 * テキストから特定項目を抽出
 * @param {string} text
 * @param {string} field 抽出したい項目名（例: 会社名, 電話番号, 金額）
 * @return {string}
 * @customfunction
 */
function GEMINI_EXTRACT(text, field) {
  if (!text) return '';
  const prompt =
    '次のテキストから「' + field + '」を1つだけ抽出し、値のみ返してください。' +
    '見つからない場合は空文字を返してください。\n' +
    'テキスト: ' + text;
  return callGemini(prompt, { temperature: 0, maxOutputTokens: 64 }).trim();
}

/**
 * バッチ処理版: A列のセルをまとめて要約し、B列に書き込む
 * カスタム関数の呼び出し過多を避けたいときに使用
 */
function batchSummarizeColumnA() {
  const sh   = SpreadsheetApp.getActiveSheet();
  const last = sh.getLastRow();
  const src  = sh.getRange(2, 1, last - 1, 1).getValues();
  const out  = src.map(function (row) {
    const text = row[0];
    if (!text) return [''];
    const summary = callGemini('次を50字以内で要約: ' + text, {
      temperature: 0.2, maxOutputTokens: 128,
    });
    Utilities.sleep(200); // rate-limit保護
    return [summary];
  });
  sh.getRange(2, 2, out.length, 1).setValues(out);
}

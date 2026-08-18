/**
 * common_gemini_client.gs
 * Gemini API 共通ラッパー
 * 事前準備:
 *   - スクリプトプロパティ GEMINI_API_KEY にキーを保存
 *   - Google AI Studio (https://aistudio.google.com/app/apikey) で無料取得可能
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  GEMINI_MODEL + ':generateContent';

/**
 * Geminiに単一プロンプトを投げてテキストを返す
 * @param {string} prompt
 * @param {object=} options { temperature, maxOutputTokens }
 * @return {string}
 */
function callGemini(prompt, options) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('スクリプトプロパティ GEMINI_API_KEY が未設定です');
  }
  options = options || {};

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature != null ? options.temperature : 0.4,
      maxOutputTokens: options.maxOutputTokens || 2048,
    },
  };

  const res = UrlFetchApp.fetch(GEMINI_ENDPOINT + '?key=' + apiKey, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code !== 200) {
    throw new Error('Gemini API error ' + code + ': ' + body);
  }
  const json = JSON.parse(body);
  const text = json.candidates &&
               json.candidates[0] &&
               json.candidates[0].content &&
               json.candidates[0].content.parts &&
               json.candidates[0].content.parts[0] &&
               json.candidates[0].content.parts[0].text;
  return text || '';
}

/**
 * 動作テスト用：エディタから実行して結果をログで確認
 */
function testGemini() {
  const result = callGemini('こんにちは、と一言だけ返してください。');
  Logger.log(result);
}

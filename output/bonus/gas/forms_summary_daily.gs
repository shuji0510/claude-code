/**
 * forms_summary_daily.gs
 * Googleフォーム(＝連携シート)の直近回答をGeminiで要約し、
 * 毎朝担当者のメールに届ける。
 *
 * 事前準備:
 *   1. フォームと連携したスプレッドシートを開く
 *   2. 拡張機能 > Apps Script でこのファイルをコピペ
 *   3. スクリプトプロパティに以下を設定
 *        REPORT_TO      : 送信先メールアドレス
 *        FORM_SHEETNAME : 回答が入るシート名 (デフォルト: フォームの回答 1)
 *   4. トリガー: 時間主導型 / 日タイマー / 午前 8-9 時
 */

function summarizeFormResponsesDaily() {
  const props   = PropertiesService.getScriptProperties();
  const toEmail = props.getProperty('REPORT_TO');
  const sheetName = props.getProperty('FORM_SHEETNAME') || 'フォームの回答 1';
  if (!toEmail) throw new Error('REPORT_TO を設定してください');

  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) throw new Error('シートが見つかりません: ' + sheetName);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    Logger.log('回答なし');
    return;
  }
  const headers = values[0];
  const rows    = values.slice(1);

  // 直近24時間の回答だけ対象（1列目がタイムスタンプ前提）
  const since = new Date();
  since.setDate(since.getDate() - 1);
  const recent = rows.filter(function (r) {
    return r[0] instanceof Date && r[0] >= since;
  });

  if (recent.length === 0) {
    Logger.log('直近24hに新規回答なし');
    return;
  }

  const table = [headers.join(' | ')]
    .concat(recent.map(function (r) {
      return r.map(function (v) { return String(v).slice(0, 300); }).join(' | ');
    }))
    .join('\n');

  const prompt =
    '以下はアンケートの回答一覧です。以下フォーマットで日本語要約を作成してください。\n\n' +
    '## サマリー\n（3行以内で全体傾向）\n\n' +
    '## 定量ハイライト\n（数値項目の平均・最大・最小など）\n\n' +
    '## 定性コメント TOP3\n（重要な自由記述を3つ選び、原文引用＋コメント）\n\n' +
    '## 明日やるべきアクション\n（優先順位付き、最大3件）\n\n' +
    '--- 回答データ ---\n' + table;

  const summary = callGemini(prompt, { temperature: 0.3, maxOutputTokens: 1500 });

  const subject = '【自動】アンケート日次レポート ' +
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd');

  GmailApp.sendEmail(toEmail, subject, summary, {
    name: 'AI アンケート要約 Bot',
  });
  Logger.log('送信完了: ' + toEmail + ' (' + recent.length + '件)');
}

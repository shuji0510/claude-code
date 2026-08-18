/**
 * meet_transcript_todo.gs
 * Google Meetの文字起こしDoc(Driveに自動保存)からToDoを抽出し、
 *  - Googleスプレッドシートに追記
 *  - Google Chat の Webhook に通知
 *
 * 事前準備:
 *   1. スクリプトプロパティに設定
 *        TRANSCRIPT_FOLDER_ID : Meetの文字起こしが保存されるDriveフォルダID
 *        TODO_SHEET_ID        : 追記先スプレッドシートID
 *        CHAT_WEBHOOK_URL     : Google ChatのIncoming Webhook URL（任意）
 *   2. トリガー: 時間主導型 / 1時間ごと（もしくは手動）
 */

function extractTodosFromRecentTranscripts() {
  const props     = PropertiesService.getScriptProperties();
  const folderId  = props.getProperty('TRANSCRIPT_FOLDER_ID');
  const sheetId   = props.getProperty('TODO_SHEET_ID');
  const webhook   = props.getProperty('CHAT_WEBHOOK_URL');
  if (!folderId || !sheetId) throw new Error('TRANSCRIPT_FOLDER_ID / TODO_SHEET_ID を設定してください');

  const folder = DriveApp.getFolderById(folderId);
  const since  = new Date();
  since.setHours(since.getHours() - 2);

  const files = folder.getFiles();
  const targets = [];
  while (files.hasNext()) {
    const f = files.next();
    if (f.getMimeType() === 'application/vnd.google-apps.document' &&
        f.getDateCreated() >= since) {
      targets.push(f);
    }
  }
  Logger.log('対象文字起こし: ' + targets.length + '件');

  const sh = SpreadsheetApp.openById(sheetId).getSheets()[0];
  if (sh.getLastRow() === 0) {
    sh.appendRow(['抽出日時', '会議タイトル', '種別', '内容', '担当者', '期限']);
  }

  targets.forEach(function (file) {
    const transcript = DocumentApp.openById(file.getId()).getBody().getText();
    if (!transcript || transcript.length < 200) return;

    const prompt =
      '以下は会議の文字起こしです。以下2種類を抽出し、厳密なJSONで返してください。\n' +
      '前後の説明は禁止。マークダウンフェンスも不要。\n\n' +
      '{\n' +
      '  "decisions": ["決定事項の要約", ...],\n' +
      '  "todos": [{"content":"内容","owner":"担当者名 or 不明","due":"YYYY-MM-DD or 不明"}]\n' +
      '}\n\n' +
      '# 文字起こし\n' + transcript.slice(0, 15000);

    const raw = callGemini(prompt, { temperature: 0.1, maxOutputTokens: 2000 });
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch (e) { Logger.log('パース失敗: ' + file.getName() + ' -> ' + e.message); return; }

    const now = new Date();
    (parsed.decisions || []).forEach(function (d) {
      sh.appendRow([now, file.getName(), '決定', d, '', '']);
    });
    (parsed.todos || []).forEach(function (t) {
      sh.appendRow([now, file.getName(), 'ToDo', t.content, t.owner, t.due]);
    });

    if (webhook) {
      const msg = '📝 *' + file.getName() + '* から抽出\n' +
        '決定事項 ' + (parsed.decisions || []).length + '件 / ToDo ' + (parsed.todos || []).length + '件\n' +
        (parsed.todos || []).slice(0, 5).map(function (t) {
          return '・[' + t.owner + ' / ' + t.due + '] ' + t.content;
        }).join('\n');
      UrlFetchApp.fetch(webhook, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ text: msg }),
      });
    }
  });
}

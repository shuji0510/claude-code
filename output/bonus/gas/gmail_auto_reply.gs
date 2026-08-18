/**
 * gmail_auto_reply.gs
 * ラベル「AI返信待ち」が付いた未読メールをGeminiで下書き作成。
 * 返信は "送信" ではなく "下書き保存" され、内容確認後に手動送信。
 *
 * 使い方:
 *   1. Gmailで「AI返信待ち」というラベルを作成
 *   2. 返信ドラフトを作らせたいメールにラベルを付ける
 *   3. GASエディタから draftRepliesForLabeledThreads() を実行
 *   4. 各スレッドに下書きが保存される
 */

const TARGET_LABEL = 'AI返信待ち';
const DONE_LABEL   = 'AI返信済み';

function draftRepliesForLabeledThreads() {
  const label     = GmailApp.getUserLabelByName(TARGET_LABEL);
  const doneLabel = GmailApp.getUserLabelByName(DONE_LABEL) ||
                    GmailApp.createLabel(DONE_LABEL);
  if (!label) throw new Error('ラベルが見つかりません: ' + TARGET_LABEL);

  const threads = label.getThreads(0, 20);
  Logger.log('対象スレッド数: ' + threads.length);

  threads.forEach(function (thread) {
    try {
      const messages = thread.getMessages();
      const last     = messages[messages.length - 1];
      const history  = messages.map(function (m) {
        return '[' + m.getFrom() + ' / ' +
               Utilities.formatDate(m.getDate(), 'Asia/Tokyo', 'MM/dd HH:mm') +
               ']\n' + m.getPlainBody().slice(0, 1200);
      }).join('\n---\n');

      const prompt =
        'あなたは日本のビジネスメール返信のプロです。以下のスレッドに対する返信文を作成してください。\n\n' +
        '# 条件\n' +
        '- 敬体（丁寧語）で\n' +
        '- 冒頭に相手の名前 or 会社名を入れる\n' +
        '- 本文は300字以内\n' +
        '- 必要に応じて箇条書きを使う\n' +
        '- 末尾に「よろしくお願いいたします。」で締める\n' +
        '- 署名は入れない（Gmail側で自動付与のため）\n\n' +
        '# スレッド\n' + history;

      const draftBody = callGemini(prompt, { temperature: 0.3 });

      last.createDraftReply(draftBody);
      thread.removeLabel(label);
      thread.addLabel(doneLabel);
      Logger.log('下書き作成: ' + thread.getFirstMessageSubject());
    } catch (e) {
      Logger.log('エラー: ' + thread.getFirstMessageSubject() + ' -> ' + e.message);
    }
  });
}

/**
 * メニューから起動できるようにする（スプレッドシート等に紐付けた場合）
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AI返信')
    .addItem('ラベル付きスレッドに下書き作成', 'draftRepliesForLabeledThreads')
    .addToUi();
}

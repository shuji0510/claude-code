/**
 * slides_generator.gs
 * テーマを渡すとGoogleスライドを自動生成する。
 *
 * 使い方:
 *   1. 任意のGoogleドキュメント or スプレッドシートを開く
 *   2. 拡張機能 > Apps Script でコピペ
 *   3. スクリプトプロパティ TEMPLATE_SLIDE_ID にテンプレートスライドIDを設定
 *      （テンプレートには {{TITLE}} と {{BODY}} のプレースホルダを含む2枚のマスターを用意）
 *      未指定の場合は空白の新規プレゼンを生成
 *   4. generateDeckFromTopic('中小製造業向け生成AI導入提案書') を実行
 */

function generateDeckFromTopic(topic) {
  topic = topic || '中小製造業向け生成AI導入提案書';

  const structurePrompt =
    'あなたは提案書のプロです。以下テーマで10ページ構成のプレゼン下書きをJSONで出力。\n\n' +
    '# テーマ\n' + topic + '\n\n' +
    '# 出力形式\n' +
    '厳密なJSON配列のみ。前後の説明文は禁止。\n' +
    '[{"title":"表紙タイトル","body":["箇条書き1","箇条書き2"],"notes":"スピーカーノート150字以内"}, ...] を10要素返す。\n\n' +
    '# 条件\n' +
    '- ターゲット: 中小企業経営者（非IT）\n' +
    '- 専門用語は避け、事例を必ず入れる\n' +
    '- 最後のスライドは「次の一歩」で締める\n';

  const raw = callGemini(structurePrompt, { temperature: 0.4, maxOutputTokens: 3000 });

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let slides;
  try {
    slides = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('JSONパース失敗: ' + e.message + '\nGeminiの返答:\n' + raw);
  }

  const templateId = PropertiesService.getScriptProperties().getProperty('TEMPLATE_SLIDE_ID');
  const deck = templateId
    ? DriveApp.getFileById(templateId).makeCopy('[AI生成] ' + topic).getId()
    : SlidesApp.create('[AI生成] ' + topic).getId();
  const pres = SlidesApp.openById(deck);

  slides.forEach(function (s, i) {
    const slide = (i === 0 && pres.getSlides().length > 0)
      ? pres.getSlides()[0]
      : pres.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

    slide.getShapes().forEach(function (sh) {
      if (sh.getPlaceholder && sh.getPlaceholder()) {
        const t = sh.getPlaceholder().getType();
        if (t === SlidesApp.PlaceholderType.TITLE ||
            t === SlidesApp.PlaceholderType.CENTERED_TITLE) {
          sh.asShape().getText().setText(s.title || '');
        } else if (t === SlidesApp.PlaceholderType.BODY) {
          sh.asShape().getText().setText((s.body || []).map(function (b) {
            return '・' + b;
          }).join('\n'));
        }
      }
    });

    if (s.notes) {
      slide.getNotesPage().getSpeakerNotesShape().getText().setText(s.notes);
    }
  });

  Logger.log('生成完了: https://docs.google.com/presentation/d/' + deck);
  return deck;
}

/**
 * サンプル呼び出し
 */
function _testSlideGen() {
  generateDeckFromTopic('AI活用による中小企業DX入門セミナー');
}

"""
Build PPTX for Seminar 2: Gemini x Google Workspace
With speaker notes embedded on each slide.
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# Brand colors
COLOR_PRIMARY = RGBColor(0x1A, 0x73, 0xE8)   # Google Blue
COLOR_ACCENT  = RGBColor(0xEA, 0x43, 0x35)   # Google Red
COLOR_YELLOW  = RGBColor(0xFB, 0xBC, 0x04)   # Google Yellow
COLOR_GREEN   = RGBColor(0x34, 0xA8, 0x53)   # Google Green
COLOR_DARK    = RGBColor(0x20, 0x2A, 0x3A)
COLOR_GRAY    = RGBColor(0x5F, 0x63, 0x68)
COLOR_LIGHT   = RGBColor(0xF1, 0xF3, 0xF4)
COLOR_WHITE   = RGBColor(0xFF, 0xFF, 0xFF)

FONT_JP = "Yu Gothic UI"
FONT_JP_BOLD = "Yu Gothic UI"

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height

BLANK = prs.slide_layouts[6]


def add_rect(slide, x, y, w, h, fill_color, line=False):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill_color
    if not line:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = COLOR_GRAY
    shp.shadow.inherit = False
    return shp


def add_rounded(slide, x, y, w, h, fill_color, line_color=None):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    shp.adjustments[0] = 0.12
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill_color
    if line_color is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line_color
    shp.shadow.inherit = False
    return shp


def add_text(slide, x, y, w, h, text, size=18, bold=False, color=COLOR_DARK,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font=FONT_JP):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Emu(0)
    tf.margin_right = Emu(0)
    tf.margin_top = Emu(0)
    tf.margin_bottom = Emu(0)
    tf.vertical_anchor = anchor
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run()
        r.text = ln
        r.font.name = font
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = color
    return tb


def set_notes(slide, notes_text):
    notes = slide.notes_slide.notes_text_frame
    notes.text = ""
    lines = notes_text.split("\n")
    for i, ln in enumerate(lines):
        p = notes.paragraphs[0] if i == 0 else notes.add_paragraph()
        r = p.add_run()
        r.text = ln
        r.font.size = Pt(12)
        r.font.name = FONT_JP


def add_footer(slide, page_no, total):
    add_rect(slide, 0, SH - Inches(0.35), SW, Inches(0.35), COLOR_LIGHT)
    add_text(slide, Inches(0.4), SH - Inches(0.33), Inches(8), Inches(0.3),
             "第2回プチ生成AIセミナー  |  Gemini × Google Workspace",
             size=10, color=COLOR_GRAY)
    add_text(slide, SW - Inches(1.2), SH - Inches(0.33), Inches(0.8), Inches(0.3),
             f"{page_no} / {total}", size=10, color=COLOR_GRAY, align=PP_ALIGN.RIGHT)


TOTAL = 22


# ============================================================
# Slide 1: Title
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, COLOR_WHITE)
# Colored accent bar
add_rect(s, 0, 0, Inches(0.35), SH, COLOR_PRIMARY)
add_rect(s, Inches(0.35), 0, Inches(0.12), SH, COLOR_ACCENT)
add_rect(s, Inches(0.47), 0, Inches(0.08), SH, COLOR_YELLOW)
add_rect(s, Inches(0.55), 0, Inches(0.06), SH, COLOR_GREEN)

add_text(s, Inches(1.2), Inches(0.9), Inches(11), Inches(0.5),
         "第2回 プチ生成AIセミナー", size=22, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(1.2), Inches(1.6), Inches(11), Inches(2.2),
         "Gemini × Google Workspaceで\n日常業務を自動化する2時間",
         size=44, bold=True, color=COLOR_DARK)
add_text(s, Inches(1.2), Inches(4.4), Inches(11), Inches(0.5),
         "Gmailもスプレッドシートも、AIでもっと賢く、もっと速く。",
         size=20, color=COLOR_GRAY)

# Date / venue box
box = add_rounded(s, Inches(1.2), Inches(5.3), Inches(11), Inches(1.3), COLOR_LIGHT)
add_text(s, Inches(1.5), Inches(5.45), Inches(5), Inches(0.4),
         "📅 2026年4月20日（月）15:00〜17:00", size=16, bold=True, color=COLOR_DARK)
add_text(s, Inches(1.5), Inches(5.9), Inches(5), Inches(0.4),
         "💻 オンライン開催（Zoom）", size=16, color=COLOR_DARK)
add_text(s, Inches(7.0), Inches(5.45), Inches(5), Inches(0.4),
         "💰 5,000円（TORERUN会員は無料）", size=16, bold=True, color=COLOR_DARK)
add_text(s, Inches(7.0), Inches(5.9), Inches(5), Inches(0.4),
         "🏢 主催：株式会社HJP Corporation", size=16, color=COLOR_DARK)

set_notes(s, """【冒頭あいさつ / 3分】
みなさん、こんにちは。第2回プチ生成AIセミナーへようこそ。
今日は「Gemini × Google Workspace」というテーマで、みなさんが毎日使っているGmail・スプレッドシート・スライドなどの業務を、AIで自動化する2時間のハンズオンをお届けします。

【アイスブレイク】
最初にチャット欄で「普段いちばん時間を取られているWorkspace業務」を一言だけ書いてください。メール返信、資料作成、集計……人によってさまざまだと思います。今日のセミナーが終わる頃には、その業務の少なくとも1つが「AI任せ」になっているはずです。

【前提】
プログラミング知識は不要です。全部コピペで動くように準備しています。
""")

# ============================================================
# Slide 2: 自己紹介 / 主催
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_PRIMARY)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "Welcome / 主催者ご紹介", size=28, bold=True, color=COLOR_WHITE)

add_text(s, Inches(0.7), Inches(1.5), Inches(12), Inches(0.5),
         "株式会社HJP Corporation", size=22, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(0.7), Inches(2.05), Inches(12), Inches(3.5),
         "・中小企業向け「生成AI × 業務改善」を支援するコンサルティング会社\n"
         "・累計100社以上の伴走支援・生成AI導入プロジェクト実績\n"
         "・「TORERUN」コミュニティを運営（AI活用勉強会・情報交換会を毎月開催）\n"
         "・本セミナーはシリーズ全4回。今回はその第2回目です。",
         size=16, color=COLOR_DARK)

# Series map
add_rounded(s, Inches(0.7), Inches(5.0), Inches(12), Inches(1.9), COLOR_LIGHT)
add_text(s, Inches(0.9), Inches(5.1), Inches(11.6), Inches(0.4),
         "◆ セミナーシリーズの全体像", size=14, bold=True, color=COLOR_GRAY)
for i, (title, color) in enumerate([
    ("第1回：自社専用AI構築編\n（Gemini × NotebookLM）", COLOR_GREEN),
    ("第2回：Workspace自動化編\n★本日★", COLOR_PRIMARY),
    ("第3回：営業DX編\n（Sheets × Gemini × CRM）", COLOR_GRAY),
    ("第4回：バックオフィス編\n（GAS × 生成AI）", COLOR_GRAY),
]):
    x = Inches(0.9 + i * 2.95)
    add_rounded(s, x, Inches(5.55), Inches(2.8), Inches(1.25), color)
    add_text(s, x + Inches(0.1), Inches(5.7), Inches(2.6), Inches(1.05),
             title, size=11, bold=True, color=COLOR_WHITE, align=PP_ALIGN.CENTER,
             anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 2, TOTAL)
set_notes(s, """【自己紹介 / 3分】
私たち株式会社HJP Corporationは、中小企業のみなさまを対象に「生成AIをどう使えば売上や利益に直結するのか」を伴走で支援している会社です。

これまで100社以上の企業さまとご一緒し、実際に社内で運用が定着した事例だけをこのセミナーでお話ししています。

【シリーズ全体像】
本シリーズは全4回構成です。
・第1回は「自社専用AIを作る」というテーマで、NotebookLMを使って社内のマニュアルや議事録を一発検索できる仕組みを作りました。
・今日の第2回は、それを「日常業務」に落とし込む回です。
・第3回、第4回では営業とバックオフィスに特化した具体プロジェクトをやります。

【メッセージ】
今日は「明日の朝、出社したらすぐ試せる」ことをゴールにしています。
""")


# ============================================================
# Slide 3: Agenda
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_PRIMARY)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "本日のアジェンダ（2時間）", size=28, bold=True, color=COLOR_WHITE)

items = [
    ("15:00", "オープニング / 第1回の振り返り", "10分"),
    ("15:10", "① Gmail × Gemini：返信文の自動生成", "20分"),
    ("15:30", "② スプレッドシート × Gemini：自然言語でデータ分析", "20分"),
    ("15:50", "③ Googleフォーム × GAS：アンケート結果の自動要約", "20分"),
    ("16:10", "④ Googleスライド × AI Studio：資料の自動生成", "15分"),
    ("16:25", "⑤ Meet × NotebookLM：議事録・ToDo自動抽出", "20分"),
    ("16:45", "参加特典のご案内 / 質疑応答 / 次回予告", "15分"),
]
top = 1.5
for i, (time, title, dur) in enumerate(items):
    y = Inches(top + i * 0.75)
    add_rounded(s, Inches(0.7), y, Inches(1.3), Inches(0.62), COLOR_PRIMARY)
    add_text(s, Inches(0.7), y, Inches(1.3), Inches(0.62),
             time, size=14, bold=True, color=COLOR_WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_rounded(s, Inches(2.15), y, Inches(9.2), Inches(0.62), COLOR_LIGHT)
    add_text(s, Inches(2.35), y, Inches(8.8), Inches(0.62),
             title, size=14, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_rounded(s, Inches(11.5), y, Inches(1.2), Inches(0.62), COLOR_YELLOW)
    add_text(s, Inches(11.5), y, Inches(1.2), Inches(0.62),
             dur, size=13, bold=True, color=COLOR_DARK,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 3, TOTAL)
set_notes(s, """【アジェンダ説明 / 2分】
今日は2時間、たっぷり5つのハンズオンをやります。
1つあたり15〜20分、講師が画面共有でデモをしたあと、みなさんに実際に手を動かしていただく時間を必ず設けます。

【運営のコツ】
- 手が止まったらチャットで「止まりました」と一言お願いします。
- 全員のペースを合わせるため、各パートの冒頭で "全員できましたね〜" を確認します。
- 録画は編集して後日、参加者限定のURLでシェアします。

【今日のゴール】
5つのうち "少なくとも2つ" を、明日の業務でそのまま使えるようになる状態を目指します。
""")


# ============================================================
# Slide 4: 第1回の振り返り
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_GREEN)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "第1回の振り返り：自社専用AIを作った", size=28, bold=True, color=COLOR_WHITE)

add_text(s, Inches(0.7), Inches(1.4), Inches(12), Inches(0.5),
         "前回のゴール：NotebookLMで「社内の知恵袋AI」を作る",
         size=18, bold=True, color=COLOR_GREEN)

items4 = [
    ("📥", "社内マニュアル・議事録・営業資料をNotebookLMに投入"),
    ("🧠", "Geminiに接続して「社内の言葉」で答えられる状態に"),
    ("🔍", "『稟議のフローは？』『先月のA社の商談要点は？』を1秒で回答"),
    ("👥", "属人化していたナレッジを、全社員が同じ精度で使える資産に"),
]
for i, (icon, txt) in enumerate(items4):
    y = Inches(2.1 + i * 0.75)
    add_rounded(s, Inches(0.7), y, Inches(0.75), Inches(0.6), COLOR_GREEN)
    add_text(s, Inches(0.7), y, Inches(0.75), Inches(0.6), icon,
             size=22, color=COLOR_WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, Inches(1.65), y + Inches(0.05), Inches(11), Inches(0.55),
             txt, size=15, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)

# Bridge box
add_rounded(s, Inches(0.7), Inches(5.5), Inches(12), Inches(1.4), COLOR_YELLOW)
add_text(s, Inches(1.0), Inches(5.65), Inches(11.4), Inches(0.5),
         "そして今日は・・・", size=14, bold=True, color=COLOR_DARK)
add_text(s, Inches(1.0), Inches(6.1), Inches(11.4), Inches(0.8),
         "その「頭脳」を、Gmail・Sheets・Slides・Formsといった\n"
         "「毎日触る現場」に接続して、業務を自動化していきます。",
         size=16, bold=True, color=COLOR_DARK)

add_footer(s, 4, TOTAL)
set_notes(s, """【前回の振り返り / 5分】
前回は「AIに何を答えさせるか＝知識の準備」に集中しました。
NotebookLMに社内のマニュアルや議事録を入れることで、GeminiがまるでベテランのAさんのように答えてくれる状態を作りました。

【今日の位置づけ】
前回作った "AIの頭脳" を、実際の業務ツール（Gmail・スプレッドシート・スライドなど）に接続していきます。
つまり、今日は「入口と出口」を作る回です。

【問いかけ】
「AIを試したけど業務に組み込めていない」という声をよく聞きますが、その理由の9割は "AIが日常導線に居ないから" です。
今日はまさに、その導線を作ります。
""")


# ============================================================
# Slide 5: なぜ Gemini x Workspace か
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_PRIMARY)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "なぜGemini × Google Workspaceなのか", size=28, bold=True, color=COLOR_WHITE)

reasons = [
    ("🚀", "圧倒的な導入コスト", "追加ライセンスや外部システム不要。\nすでに使っているWorkspaceの延長で始められる。"),
    ("🔒", "セキュリティが1本化", "Googleアカウントの権限管理がそのまま活きる。\n情シスへの説明も最短。"),
    ("🔗", "他ツール連携が超簡単", "GmailもDriveもFormsも同じ思想。\nGASで数行つなげば横断ワークフローに。"),
    ("📈", "業務時間 -40% 事例多数", "支援企業では平均 週8時間 の削減を実現。\nメール・資料・議事録が3大インパクト領域。"),
]
for i, (icon, title, desc) in enumerate(reasons):
    x = Inches(0.7 + (i % 2) * 6.15)
    y = Inches(1.5 + (i // 2) * 2.85)
    add_rounded(s, x, y, Inches(5.85), Inches(2.6), COLOR_LIGHT)
    add_rounded(s, x + Inches(0.3), y + Inches(0.3), Inches(0.9), Inches(0.9), COLOR_PRIMARY)
    add_text(s, x + Inches(0.3), y + Inches(0.3), Inches(0.9), Inches(0.9),
             icon, size=26, color=COLOR_WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x + Inches(1.4), y + Inches(0.35), Inches(4.3), Inches(0.55),
             title, size=18, bold=True, color=COLOR_PRIMARY)
    add_text(s, x + Inches(0.3), y + Inches(1.4), Inches(5.4), Inches(1.15),
             desc, size=13, color=COLOR_DARK)

add_footer(s, 5, TOTAL)
set_notes(s, """【価値提示 / 3分】
「AIツールって結局ChatGPT？」というご質問をよくいただきます。
用途によりますが、日常業務との統合という観点では、GeminiとGoogle Workspaceの組み合わせが群を抜いて "早く成果が出ます"。

【4つの理由を1つずつ】
① 追加コスト：ほぼゼロで始められる。Workspace Business Standard以上ならGeminiが含まれるプランもあります。
② セキュリティ：情シスに新たな稟議を出さず、既存のGoogle Workspace管理コンソール内で完結。
③ 連携：Gmail・Sheets・Drive・Formsは同じインフラなのでGASで数行つなげば横断可能。
④ 成果：支援先の平均が週8時間削減。年間400時間、1人あたりコストにすると100万円超のインパクト。

【問いかけ】
「今日のセミナーで、みなさんの週何時間を取り戻せるか」を意識しながら見てください。
""")


# ============================================================
# Slide 6: セクション区切り - Gmail
# ============================================================
def section_divider(idx, ja_title, en_title, color, notes_txt, page_no):
    s = prs.slides.add_slide(BLANK)
    add_rect(s, 0, 0, SW, SH, color)
    add_text(s, Inches(0.8), Inches(1.5), Inches(4), Inches(1.2),
             f"Hands-on {idx}", size=32, bold=True, color=COLOR_WHITE)
    # Big number
    add_text(s, Inches(9.5), Inches(0.8), Inches(3.5), Inches(3.5),
             f"0{idx}", size=220, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF),
             align=PP_ALIGN.RIGHT)
    add_text(s, Inches(0.8), Inches(2.8), Inches(11.5), Inches(1.6),
             ja_title, size=44, bold=True, color=COLOR_WHITE)
    add_text(s, Inches(0.8), Inches(5.0), Inches(11.5), Inches(0.6),
             en_title, size=18, color=COLOR_WHITE)
    add_footer(s, page_no, TOTAL)
    set_notes(s, notes_txt)
    return s


section_divider(
    1,
    "Gmail × Gemini\n面倒なメール返信を1クリックで",
    "Auto-drafting replies with Gemini in Gmail",
    COLOR_ACCENT,
    """【セクション導入 / 1分】
最初のハンズオンは、みなさんが最も時間を使っているであろう "メール返信" です。
Geminiは、受信メールの内容と過去のやり取りを踏まえて、返信文の下書きを1クリックで作ってくれます。

【期待効果】
1件あたり平均2〜3分の時短。1日20件返信する営業職なら、40分〜1時間の削減。
""",
    6,
)


# ============================================================
# Slide 7: Gmail x Gemini 詳細
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_ACCENT)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "① Gmail × Gemini：メール返信を1クリック自動生成",
         size=24, bold=True, color=COLOR_WHITE)

# Before / After
add_rounded(s, Inches(0.7), Inches(1.4), Inches(5.9), Inches(2.5), COLOR_LIGHT)
add_text(s, Inches(0.9), Inches(1.5), Inches(5.5), Inches(0.4),
         "BEFORE", size=14, bold=True, color=COLOR_GRAY)
add_text(s, Inches(0.9), Inches(1.9), Inches(5.5), Inches(2.0),
         "・受信メールを読む（1分）\n"
         "・過去やり取りを検索（1分）\n"
         "・返信の文面を1から書く（3分）\n"
         "・敬語・誤字チェック（1分）\n\n合計：約6分／件",
         size=13, color=COLOR_DARK)

add_rounded(s, Inches(6.75), Inches(1.4), Inches(5.9), Inches(2.5), COLOR_ACCENT)
add_text(s, Inches(6.95), Inches(1.5), Inches(5.5), Inches(0.4),
         "AFTER", size=14, bold=True, color=COLOR_WHITE)
add_text(s, Inches(6.95), Inches(1.9), Inches(5.5), Inches(2.0),
         "・Gmail右側の Gemini パネルを開く\n"
         "・「返信の下書き」をクリック\n"
         "・トーン（丁寧/カジュアル）を選択\n"
         "・確認して送信\n\n合計：約1分／件（-83%）",
         size=13, color=COLOR_WHITE)

# Steps
add_rounded(s, Inches(0.7), Inches(4.1), Inches(11.95), Inches(2.8), COLOR_WHITE, line_color=COLOR_ACCENT)
add_text(s, Inches(0.9), Inches(4.2), Inches(11.5), Inches(0.4),
         "ハンズオン手順", size=14, bold=True, color=COLOR_ACCENT)
steps = [
    "1. Gmailを開き、返信したいメールを選択",
    "2. 右上の ✨ Gemini アイコン →「Help me write」→「Draft a reply」",
    "3. 「日程調整の候補日を3つ提示。丁寧な口調で」等の指示を追記",
    "4. 生成された下書きを確認、Insertで本文へ挿入",
    "5. 署名を確認して送信。＊今日は【返信テンプレプロンプト集】を配布します！",
]
for i, st in enumerate(steps):
    add_text(s, Inches(0.9), Inches(4.65 + i * 0.42), Inches(11.5), Inches(0.4),
             st, size=13, color=COLOR_DARK)

add_footer(s, 7, TOTAL)
set_notes(s, """【デモ / 10分】
- 実際にGmailを画面共有で開き、参加者から事前にもらったサンプルメールを1件返信します。
- ポイントは「Geminiに文脈を教える」こと。件名や本文だけでなく、"どう返したいか" を1行添えるだけで精度が跳ね上がります。

【指示例のバリエーション】
- 「1営業日以内に対応する旨と、追加ヒアリング事項3点を丁寧に」
- 「見積書送付のお礼と、次回打ち合わせ日程調整（今週後半で3案）」
- 「クレーム対応。まずお詫び、事実確認、恒久対策の順で」

【落とし穴】
- 顧客名・案件情報を "書き換え忘れて" 送るミスに注意。必ず送信前に固有名詞をチェック。
- 「機密情報を含まない」設定になっているかを情シスと確認しておくと安心。

【ハンズオン / 8分】
参加者にサンプルメール（配布資料内）を使って、自分でも生成してもらいます。
""")


# ============================================================
# Slide 8: Section 2 divider - Spreadsheet
# ============================================================
section_divider(
    2,
    "スプレッドシート × Gemini\n自然言語でデータ分析",
    "Analyze Sheets by just talking to Gemini",
    COLOR_GREEN,
    """【セクション導入 / 1分】
2つめは「スプレッドシート」。
これまで VLOOKUP や QUERY 関数と格闘していたデータ集計・グラフ作成が、"日本語で指示" するだけで完了する時代になりました。

【期待効果】
関数を覚える必要がなくなる。分析にかかる時間が5〜10倍速。
""",
    8,
)


# ============================================================
# Slide 9: Spreadsheet x Gemini 詳細
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_GREEN)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "② スプレッドシート × Gemini：関数不要のデータ分析",
         size=24, bold=True, color=COLOR_WHITE)

# Left: Use cases
add_text(s, Inches(0.7), Inches(1.4), Inches(6), Inches(0.5),
         "こんな指示だけで動きます", size=18, bold=True, color=COLOR_GREEN)

prompts = [
    "「売上上位5社を横棒グラフにして」",
    "「顧客リストから東京都在住だけ抽出し、別シートに」",
    "「先月と今月の売上をSKU別で比較する表を作成」",
    "「A列の日付から曜日を出し、曜日別平均売上を出して」",
    "「B列のメールアドレスからドメインだけ抽出して」",
]
for i, p in enumerate(prompts):
    y = Inches(2.0 + i * 0.62)
    add_rounded(s, Inches(0.7), y, Inches(6.0), Inches(0.55), COLOR_LIGHT)
    add_text(s, Inches(0.9), y, Inches(5.8), Inches(0.55), p,
             size=13, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)

# Right: Steps
add_rounded(s, Inches(7.0), Inches(1.4), Inches(5.7), Inches(5.5), COLOR_GREEN)
add_text(s, Inches(7.2), Inches(1.5), Inches(5.3), Inches(0.4),
         "ハンズオン手順", size=14, bold=True, color=COLOR_WHITE)
steps = [
    "1. サンプルデータのシートを開く",
    "   （配布 URL：bit.ly/hjp-seminar2-sheet）",
    "2. 右上の ✨ Gemini アイコンをクリック",
    "3. サイドパネルに指示を入力：",
    "   例）「売上金額の月別推移を折れ線グラフに」",
    "4. 生成されたSQL/関数/グラフをプレビュー",
    "5. 「シートに挿入」をクリックで反映",
    "6. 微修正はもう一度日本語で指示するだけ",
    "",
    "💡 プロTips",
    "・列名を明確にしておくとGeminiの精度UP",
    "・数式を残したい場合は「関数で書いて」と指示",
]
for i, st in enumerate(steps):
    bold = st.startswith("💡")
    add_text(s, Inches(7.2), Inches(1.95 + i * 0.35), Inches(5.3), Inches(0.35),
             st, size=12, bold=bold, color=COLOR_WHITE)

add_footer(s, 9, TOTAL)
set_notes(s, """【デモ / 8分】
配布したサンプルシート（架空の売上データ）を使い、
- 月別売上グラフ
- 顧客セグメント別集計
- 前年比の可視化
を、日本語プロンプトだけで作ります。

【伝えたいこと】
- 関数を "覚える必要がない" 時代に入った。ただし "業務の全体像を設計する力" は今後さらに重要になる。
- Geminiに任せて空いた時間で、みなさんは "意思決定" にリソースを使ってください。

【落とし穴】
- 数値の桁が大きい場合、単位（円、千円）を指示に含めるとブレない。
- グラフ種類の指定を明確に：「積み上げ棒」「折れ線」「散布図」など。

【ハンズオン / 8分】
参加者に自分で1つグラフを作ってもらい、チャットでスクショを共有してもらいます。
""")


# ============================================================
# Slide 10: Section 3 - Forms x GAS
# ============================================================
section_divider(
    3,
    "Googleフォーム × GAS\nアンケート結果を自動要約",
    "Auto-summarize form responses with GAS + Gemini",
    COLOR_YELLOW,
    """【セクション導入 / 1分】
3つめは、少しだけ "自動化" に踏み込みます。
Googleフォームの回答が入るたびに、GAS（Google Apps Script）が起動してGeminiに要約させ、あなたの受信箱にサマリーが届く仕組みを作ります。

【期待効果】
アンケートを "見に行かなくてよくなる"。回答が集まるたびに、洞察が向こうから届く。
""",
    10,
)


# ============================================================
# Slide 11: Forms x GAS 詳細
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_YELLOW)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "③ Googleフォーム × GAS × Gemini：自動集計と要約",
         size=24, bold=True, color=COLOR_DARK)

# Flow diagram
flow_items = [
    ("📝", "Googleフォーム", "回答を収集", COLOR_PRIMARY),
    ("📊", "スプレッドシート", "回答が自動蓄積", COLOR_GREEN),
    ("⚙️", "GAS", "1日1回起動", COLOR_ACCENT),
    ("🧠", "Gemini API", "要約・分類", COLOR_YELLOW),
    ("📧", "Gmail", "レポート受信", COLOR_PRIMARY),
]
for i, (icon, title, desc, color) in enumerate(flow_items):
    x = Inches(0.5 + i * 2.6)
    add_rounded(s, x, Inches(1.5), Inches(2.3), Inches(1.9), color)
    add_text(s, x, Inches(1.65), Inches(2.3), Inches(0.6), icon,
             size=32, color=COLOR_WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x, Inches(2.35), Inches(2.3), Inches(0.5), title,
             size=13, bold=True, color=COLOR_WHITE, align=PP_ALIGN.CENTER)
    add_text(s, x, Inches(2.8), Inches(2.3), Inches(0.5), desc,
             size=11, color=COLOR_WHITE, align=PP_ALIGN.CENTER)
    if i < 4:
        arrow = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                    x + Inches(2.3), Inches(2.15), Inches(0.3), Inches(0.6))
        arrow.fill.solid(); arrow.fill.fore_color.rgb = COLOR_GRAY
        arrow.line.fill.background()

# Code snippet box
add_rounded(s, Inches(0.7), Inches(3.7), Inches(11.95), Inches(3.15), COLOR_DARK)
add_text(s, Inches(0.9), Inches(3.8), Inches(11.5), Inches(0.4),
         "GAS スニペット（参加特典・全文はZipに同梱）", size=12, bold=True,
         color=COLOR_YELLOW, font="Consolas")

code = """function summarizeFormResponses() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('フォームの回答 1');
  const rows  = sheet.getDataRange().getValues();
  const texts = rows.slice(1).map(r => r.slice(1).join(' / ')).join('\\n');
  const prompt = `以下はセミナーアンケートの回答一覧です。
  ①全体傾向 ②満足度スコア平均 ③改善要望TOP3
  を日本語で200字以内に要約してください。\\n\\n${texts}`;
  const summary = callGemini(prompt);        // Gemini APIラッパー
  GmailApp.sendEmail('you@example.com',
    '【自動】週次アンケート要約', summary);
}"""
tb = s.shapes.add_textbox(Inches(0.9), Inches(4.2), Inches(11.5), Inches(2.55))
tf = tb.text_frame; tf.word_wrap = True
tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Emu(0)
for i, ln in enumerate(code.split("\n")):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    r = p.add_run(); r.text = ln
    r.font.name = "Consolas"; r.font.size = Pt(12); r.font.color.rgb = COLOR_WHITE

add_footer(s, 11, TOTAL)
set_notes(s, """【デモ / 10分】
- 実際にGoogleフォームを1つ作り、スプレッドシートと連携。
- 拡張機能 > Apps Script でエディタを開き、配布するコードをコピペ。
- トリガー設定（毎日9:00 or 送信時）を画面で共有。
- Gemini APIキーの取得はAI Studio (aistudio.google.com/app/apikey) から無料で取得可能。

【伝えたいこと】
これがまさに "AI × 自動化" の最小単位。
一度作ると、あとは "何もしなくても" 毎朝レポートがメールで届く。

【落とし穴】
- APIキーは スクリプトプロパティ に保存（ハードコードNG）
- 回答者の個人情報を含む場合はマスキング処理を挟む
- 実行時間は1回あたり最大6分。大量データは分割ループで

【ハンズオン / 8分】
コードのコピペと、トリガー設定だけを一緒にやります。
Gemini APIキーは事前配布URLから各自取得しておいてください。
""")


# ============================================================
# Slide 12: Section 4 - Slides x AI Studio
# ============================================================
section_divider(
    4,
    "Googleスライド × AI Studio\nテーマから資料を自動生成",
    "Turn a topic into a full slide deck",
    COLOR_PRIMARY,
    """【セクション導入 / 1分】
4つめは、"資料作成" そのものを自動化するパートです。
「〇〇についての提案書」というテーマだけ渡すと、構成案・スライドの下書き・図解案までAIが作ってくれます。

【期待効果】
資料の "0→1" の時間を平均5時間 → 30分に短縮。
""",
    12,
)


# ============================================================
# Slide 13: Slides x AI Studio 詳細
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_PRIMARY)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "④ Googleスライド × AI Studio：資料を叩き台まで自動生成",
         size=24, bold=True, color=COLOR_WHITE)

# Left: 3 Steps
add_text(s, Inches(0.7), Inches(1.4), Inches(6.5), Inches(0.5),
         "3ステップで叩き台完成", size=18, bold=True, color=COLOR_PRIMARY)
steps13 = [
    ("STEP 1", "AI Studioで構成案を生成",
     "「〇〇の提案書。ターゲット：中小企業経営者。\n"
     "10枚。表紙／課題／解決策／事例／価格／FAQ／次のアクション」"),
    ("STEP 2", "各スライドの本文をMarkdownで出力",
     "・タイトル\n・箇条書き3〜5点\n・スピーカーノート案\nまでまとめて生成"),
    ("STEP 3", "GASでスライドに一括流し込み",
     "配布するGASを実行 → Googleスライドが自動生成\n（テンプレートスライドのプレースホルダに配置）"),
]
for i, (label, title, desc) in enumerate(steps13):
    y = Inches(2.0 + i * 1.55)
    add_rounded(s, Inches(0.7), y, Inches(1.2), Inches(1.35), COLOR_PRIMARY)
    add_text(s, Inches(0.7), y, Inches(1.2), Inches(1.35), label,
             size=12, bold=True, color=COLOR_WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_rounded(s, Inches(2.0), y, Inches(5.2), Inches(1.35), COLOR_LIGHT)
    add_text(s, Inches(2.2), y + Inches(0.1), Inches(5.0), Inches(0.4),
             title, size=14, bold=True, color=COLOR_DARK)
    add_text(s, Inches(2.2), y + Inches(0.5), Inches(5.0), Inches(0.85),
             desc, size=11, color=COLOR_DARK)

# Right: Sample prompt
add_rounded(s, Inches(7.5), Inches(1.5), Inches(5.2), Inches(5.4), COLOR_DARK)
add_text(s, Inches(7.7), Inches(1.6), Inches(4.8), Inches(0.4),
         "🎯 サンプルプロンプト", size=13, bold=True, color=COLOR_YELLOW)
sample = """あなたは提案書のプロです。
以下条件でスライド構成を作成:

# テーマ
中小製造業向け生成AI導入提案書

# 対象
社長・工場長（50代・非IT）

# スライド数
10枚

# 各スライド出力形式
- タイトル
- 本文（箇条書き3〜5点）
- スピーカーノート（150字）

# トーン
・専門用語を避ける
・具体事例を必ず1つ入れる
・最終ページは "次の一歩" で締める"""
tb = s.shapes.add_textbox(Inches(7.7), Inches(2.05), Inches(4.8), Inches(4.8))
tf = tb.text_frame; tf.word_wrap = True
tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Emu(0)
for i, ln in enumerate(sample.split("\n")):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    r = p.add_run(); r.text = ln
    r.font.name = "Consolas"; r.font.size = Pt(11); r.font.color.rgb = COLOR_WHITE

add_footer(s, 13, TOTAL)
set_notes(s, """【デモ / 8分】
- AI Studio (aistudio.google.com) を開き、Gemini 2.5 Proを選択。
- 上記プロンプトを投げて構成案を生成。
- 配布するGAS（generateSlides.gs）をコピペして実行 → 数秒で10ページの叩き台が完成。

【伝えたいこと】
- AIは "たたき台生成マシン" として最強。
- ただし "最終品質" は必ず人間の目で。
  - 数字の正確性
  - 会社固有の表現
  - 顧客の温度感
- AIに8割作らせ、残り2割で "自分らしさ" を足すのがコスパ最強の使い方。

【落とし穴】
- テンプレートスライドを先に用意しておくのが最速。プレースホルダに {{TITLE}} {{BODY}} を仕込んでおく。
- 一度に11枚以上を投げると精度が落ちるので、章単位に分割推奨。

【ハンズオン / 5分】
参加者に "自分の会社の提案書" のテーマを投げてもらい、実際に構成案を作ります。
""")


# ============================================================
# Slide 14: Section 5 - Meet x NotebookLM
# ============================================================
section_divider(
    5,
    "Meet × NotebookLM\n議事録・ToDoを自動抽出",
    "From meeting transcript to action items",
    COLOR_ACCENT,
    """【セクション導入 / 1分】
最後は "会議" です。
Google Meetの録画・文字起こし機能をNotebookLMに読み込ませ、決定事項・ToDo（担当者・期限付き）を自動抽出させます。

【期待効果】
議事録を書く時間ゼロ。「言った言わない」問題も自動で解決。
""",
    14,
)


# ============================================================
# Slide 15: Meet x NotebookLM 詳細
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_ACCENT)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "⑤ Meet × NotebookLM：議事録とToDoを自動化",
         size=24, bold=True, color=COLOR_WHITE)

# Workflow
add_text(s, Inches(0.7), Inches(1.4), Inches(12), Inches(0.5),
         "ワークフロー", size=18, bold=True, color=COLOR_ACCENT)

workflow = [
    ("1", "Google Meetで会議を録画", "録画＋文字起こしをオン"),
    ("2", "終了後、Driveに文字起こしが保存", "「会議名 - Transcript」ファイル"),
    ("3", "NotebookLMに読み込み（ソース追加）", "1クリック"),
    ("4", "配布プロンプト集の『議事録テンプレ』を投入", "決定事項/宿題/担当/期限を抽出"),
    ("5", "結果をコピー → 議事録スプレッドシートへ", "Slack/Chatにも自動転送可"),
]
for i, (no, title, desc) in enumerate(workflow):
    y = Inches(2.0 + i * 0.72)
    add_rounded(s, Inches(0.7), y, Inches(0.7), Inches(0.6), COLOR_ACCENT)
    add_text(s, Inches(0.7), y, Inches(0.7), Inches(0.6), no,
             size=18, bold=True, color=COLOR_WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_rounded(s, Inches(1.6), y, Inches(6.0), Inches(0.6), COLOR_LIGHT)
    add_text(s, Inches(1.8), y, Inches(5.6), Inches(0.6), title,
             size=13, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_rounded(s, Inches(7.8), y, Inches(4.85), Inches(0.6), COLOR_WHITE, line_color=COLOR_GRAY)
    add_text(s, Inches(8.0), y, Inches(4.5), Inches(0.6), desc,
             size=12, color=COLOR_GRAY, anchor=MSO_ANCHOR.MIDDLE)

# Bottom tip
add_rounded(s, Inches(0.7), Inches(5.9), Inches(11.95), Inches(1.0), COLOR_YELLOW)
add_text(s, Inches(0.9), Inches(6.0), Inches(11.6), Inches(0.4),
         "💡 決定的な差が出るポイント", size=13, bold=True, color=COLOR_DARK)
add_text(s, Inches(0.9), Inches(6.4), Inches(11.6), Inches(0.55),
         "「担当者名 / 期限 / 完了条件」を必ず出力させる。これだけで議事録が \"動く議事録\" に変わります。",
         size=13, color=COLOR_DARK)

add_footer(s, 15, TOTAL)
set_notes(s, """【デモ / 10分】
- 実際のサンプル会議（社内定例5分版）の文字起こしをNotebookLMに投入。
- プロンプト集の "議事録テンプレプロンプト" を貼り付け、実行。
- 決定事項3件、ToDo 5件が担当者・期限付きで自動生成される様子を見せます。

【伝えたいこと】
議事録を書く人 = 会議の生産性の律速。
これをAIに任せられると、会議中は "議論" だけに集中できるようになる。

【落とし穴】
- 録音音質が悪いと文字起こしが崩れる。会議室のマイク配置は必ず確認。
- 個人情報／機密が絡む会議はNotebookLMの共有設定を "自分のみ" に。

【ハンズオン / 8分】
配布するサンプル文字起こしを使い、参加者にも自分のNotebookLMで試してもらいます。
""")


# ============================================================
# Slide 16: 5つのまとめ
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_PRIMARY)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "本日のまとめ：5つの自動化で何時間戻ってくる？",
         size=24, bold=True, color=COLOR_WHITE)

table = [
    ("① Gmail × Gemini", "メール返信", "▲ 5時間/週", COLOR_ACCENT),
    ("② Sheets × Gemini", "データ集計・分析", "▲ 3時間/週", COLOR_GREEN),
    ("③ Forms × GAS", "アンケート集計・要約", "▲ 2時間/週", COLOR_YELLOW),
    ("④ Slides × AI Studio", "資料の叩き台作成", "▲ 4時間/週", COLOR_PRIMARY),
    ("⑤ Meet × NotebookLM", "議事録・ToDo抽出", "▲ 3時間/週", COLOR_ACCENT),
]

# Header row
add_rounded(s, Inches(0.7), Inches(1.4), Inches(11.95), Inches(0.5), COLOR_DARK)
add_text(s, Inches(0.9), Inches(1.4), Inches(4), Inches(0.5),
         "自動化パート", size=13, bold=True, color=COLOR_WHITE, anchor=MSO_ANCHOR.MIDDLE)
add_text(s, Inches(5.0), Inches(1.4), Inches(4), Inches(0.5),
         "対象業務", size=13, bold=True, color=COLOR_WHITE, anchor=MSO_ANCHOR.MIDDLE)
add_text(s, Inches(9.5), Inches(1.4), Inches(3), Inches(0.5),
         "想定削減時間", size=13, bold=True, color=COLOR_WHITE, anchor=MSO_ANCHOR.MIDDLE)

for i, (part, biz, saved, color) in enumerate(table):
    y = Inches(2.0 + i * 0.7)
    add_rect(s, Inches(0.7), y, Inches(11.95), Inches(0.65), COLOR_LIGHT if i % 2 == 0 else COLOR_WHITE)
    add_rect(s, Inches(0.7), y, Inches(0.15), Inches(0.65), color)
    add_text(s, Inches(1.0), y, Inches(4), Inches(0.65), part,
             size=14, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, Inches(5.0), y, Inches(4.5), Inches(0.65), biz,
             size=13, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, Inches(9.5), y, Inches(3), Inches(0.65), saved,
             size=14, bold=True, color=color, anchor=MSO_ANCHOR.MIDDLE)

# Total
add_rounded(s, Inches(0.7), Inches(5.6), Inches(11.95), Inches(1.3), COLOR_PRIMARY)
add_text(s, Inches(0.9), Inches(5.7), Inches(11.6), Inches(0.5),
         "◎ 想定インパクト（1人あたり）", size=14, bold=True, color=COLOR_WHITE)
add_text(s, Inches(0.9), Inches(6.15), Inches(11.6), Inches(0.7),
         "週 17時間  ／  月 68時間  ／  年 816時間  ＝ 約 4ヶ月分の労働時間",
         size=22, bold=True, color=COLOR_YELLOW)

add_footer(s, 16, TOTAL)
set_notes(s, """【まとめ / 3分】
今日ご紹介した5つを全部組み合わせると、1人あたり週17時間、年間で4ヶ月分の労働時間が戻ってきます。

【メッセージ】
「全部を一度に導入する必要はない」ということ。
まずは1つ選んで、明日から試してください。
一番オススメは "①Gmail" と "⑤Meet" です。効果が実感しやすく、社内展開の "旗印" にしやすい。

【問いかけ】
チャットで「明日、最初に試すのは何番？」と一言お願いします。
""")


# ============================================================
# Slide 17: 参加特典
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_YELLOW)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "🎁 参加特典：全員にプレゼント",
         size=28, bold=True, color=COLOR_DARK)

# Gift 1
add_rounded(s, Inches(0.7), Inches(1.4), Inches(5.95), Inches(5.4), COLOR_LIGHT)
add_rounded(s, Inches(0.7), Inches(1.4), Inches(5.95), Inches(0.7), COLOR_PRIMARY)
add_text(s, Inches(0.9), Inches(1.4), Inches(5.5), Inches(0.7),
         "特典① セミナーで使うGASコード一式",
         size=16, bold=True, color=COLOR_WHITE, anchor=MSO_ANCHOR.MIDDLE)
add_text(s, Inches(0.9), Inches(2.3), Inches(5.6), Inches(4.4),
         "・gmail_auto_reply.gs\n   └ Gmailの返信を自動生成\n"
         "・sheets_gemini_analyze.gs\n   └ シート上で関数として呼べる=GEMINI()\n"
         "・forms_summary_daily.gs\n   └ フォーム回答を毎朝要約\n"
         "・slides_generator.gs\n   └ プロンプト→スライド自動生成\n"
         "・meet_transcript_todo.gs\n   └ 議事録からToDoを抽出しChatへ通知",
         size=13, color=COLOR_DARK)

# Gift 2
add_rounded(s, Inches(6.75), Inches(1.4), Inches(5.95), Inches(5.4), COLOR_LIGHT)
add_rounded(s, Inches(6.75), Inches(1.4), Inches(5.95), Inches(0.7), COLOR_ACCENT)
add_text(s, Inches(6.95), Inches(1.4), Inches(5.5), Inches(0.7),
         "特典② コピペで使える プロンプト集",
         size=16, bold=True, color=COLOR_WHITE, anchor=MSO_ANCHOR.MIDDLE)
add_text(s, Inches(6.95), Inches(2.3), Inches(5.6), Inches(4.4),
         "・Gmail返信テンプレ 15種\n   （日程調整・お礼・クレーム・見積・断り 他）\n"
         "・Sheets分析プロンプト 20種\n   （集計・可視化・整形・関数化）\n"
         "・議事録テンプレ 5種\n   （社内定例/顧客商談/採用面接 等）\n"
         "・スライド構成テンプレ 10種\n   （提案書/報告書/研修資料 等）\n"
         "・すべて日本語・そのまま貼るだけ",
         size=13, color=COLOR_DARK)

# Delivery
add_rounded(s, Inches(0.7), Inches(6.9), Inches(11.95), Inches(0.5), COLOR_DARK)
add_text(s, Inches(0.9), Inches(6.9), Inches(11.6), Inches(0.5),
         "📮 セミナー終了後、参加時のメールアドレス宛にダウンロードURLをお送りします",
         size=13, bold=True, color=COLOR_WHITE, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 17, TOTAL)
set_notes(s, """【参加特典説明 / 3分】
今日ご参加いただいた全員に、2つの特典をお送りします。

【特典①：GASコード一式】
5つのハンズオンで使ったコードを、そのまま .gs ファイルにまとめてお渡しします。
コピペで自社のスプレッドシートに貼るだけで動きます。
（API keyの設定手順もREADMEに書いてあります）

【特典②：プロンプト集】
「日本語でそのまま貼れば結果が出る」プロンプトを50個以上、シチュエーション別にまとめました。
特にGmail返信テンプレは、営業チームから "これだけで元が取れた" と言っていただくことが多いです。

【お渡しタイミング】
セミナー終了後、24時間以内にお申し込みメール宛にURLをお送りします。
""")


# ============================================================
# Slide 18: こんな方に
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_PRIMARY)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "こんな方に、特に効きます",
         size=28, bold=True, color=COLOR_WHITE)

persona = [
    ("👔", "経営者・マネージャー",
     "・部下の残業を減らしたい\n・DXの成果を数字で説明したい\n・投資対効果の高い施策を探している"),
    ("💼", "営業・カスタマーサクセス",
     "・メール返信で時間を溶かしている\n・顧客ごとの資料作成に追われる\n・議事録作成が地味に負担"),
    ("📊", "バックオフィス（経理・人事・総務）",
     "・毎月の集計/レポート作成が定型的\n・アンケート集計に時間を取られる\n・GASに興味はあるが手が出せていない"),
    ("🧑‍💻", "情シス・DX推進",
     "・全社に『使える』AIを浸透させたい\n・セキュアに始められる仕組みを探している\n・現場が自走できる型を作りたい"),
]
for i, (icon, title, desc) in enumerate(persona):
    x = Inches(0.7 + (i % 2) * 6.15)
    y = Inches(1.4 + (i // 2) * 2.85)
    add_rounded(s, x, y, Inches(5.85), Inches(2.65), COLOR_LIGHT)
    add_rounded(s, x + Inches(0.3), y + Inches(0.3), Inches(1.0), Inches(1.0), COLOR_PRIMARY)
    add_text(s, x + Inches(0.3), y + Inches(0.3), Inches(1.0), Inches(1.0), icon,
             size=32, color=COLOR_WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x + Inches(1.5), y + Inches(0.35), Inches(4.2), Inches(0.55),
             title, size=17, bold=True, color=COLOR_PRIMARY)
    add_text(s, x + Inches(0.3), y + Inches(1.4), Inches(5.4), Inches(1.2),
             desc, size=12, color=COLOR_DARK)

add_footer(s, 18, TOTAL)
set_notes(s, """【ターゲット確認 / 2分】
今日ご参加のみなさんは、おそらくこの4象限のどれかに当てはまるはずです。
自分がどれか、チャットで教えてください（① 経営 ② 営業 ③ バックオフィス ④ 情シス）。

【メッセージ】
今日紹介した5つは "職種を問わず刺さる" 内容ですが、後半の個別コンサルではみなさんの職種に合わせたカスタマイズもお手伝いできます。
""")


# ============================================================
# Slide 19: 次回予告
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_GREEN)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "次回予告：第3回プチ生成AIセミナー",
         size=28, bold=True, color=COLOR_WHITE)

add_text(s, Inches(0.7), Inches(1.5), Inches(12), Inches(0.6),
         "テーマ：営業DX編 — 商談前後の全工程をAIに任せる",
         size=22, bold=True, color=COLOR_GREEN)
add_text(s, Inches(0.7), Inches(2.15), Inches(12), Inches(0.5),
         "2026年5月18日（月）15:00〜17:00 / オンライン",
         size=16, color=COLOR_GRAY)

topics = [
    ("🎯 事前準備の自動化", "訪問前リサーチ → 想定質問集 → 提案書ドラフトまでAIで"),
    ("💬 商談中の議事支援", "AIノートテイカーがリアルタイムに要点をキャプチャ"),
    ("📮 事後フォロー", "お礼メール・議事録・次アクションを商談終了と同時に送信"),
    ("📊 パイプライン管理", "スプレッドシート×Geminiで案件の温度感を自動スコアリング"),
]
for i, (title, desc) in enumerate(topics):
    y = Inches(2.9 + i * 0.85)
    add_rounded(s, Inches(0.7), y, Inches(11.95), Inches(0.75), COLOR_LIGHT)
    add_text(s, Inches(0.9), y + Inches(0.05), Inches(4.2), Inches(0.35),
             title, size=15, bold=True, color=COLOR_GREEN)
    add_text(s, Inches(5.2), y, Inches(7.4), Inches(0.75),
             desc, size=13, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)

add_rounded(s, Inches(0.7), Inches(6.5), Inches(11.95), Inches(0.55), COLOR_ACCENT)
add_text(s, Inches(0.9), Inches(6.5), Inches(11.6), Inches(0.55),
         "🎁 本日ご参加の方には、次回参加費の 50%OFF クーポンを配布！",
         size=14, bold=True, color=COLOR_WHITE, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 19, TOTAL)
set_notes(s, """【次回予告 / 2分】
次回は "営業" にフォーカスします。
今日の5つの中で "スプレッドシート" と "スライド" と "議事録" を組み合わせて、
「一人あたり月10商談を追加でこなせるようになる仕組み」を作ります。

【告知】
本日ご参加のみなさんには、次回50%OFFのクーポンをお付けします。
セミナー後のフォローメールに、専用の申込URLを記載します。
""")


# ============================================================
# Slide 20: 今日のアクションプラン
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, Inches(1.1), COLOR_PRIMARY)
add_text(s, Inches(0.6), Inches(0.28), Inches(12), Inches(0.7),
         "明日からの1週間アクションプラン",
         size=28, bold=True, color=COLOR_WHITE)

plans = [
    ("Day 1", "月", "特典ダウンロード＋Gmail返信を3件試す"),
    ("Day 2", "火", "スプレッドシートで直近1ヶ月データを分析させる"),
    ("Day 3", "水", "アンケート要約GASをコピペで設置"),
    ("Day 4", "木", "スライド自動生成で次の会議資料を叩き台化"),
    ("Day 5", "金", "1週間の議事録をNotebookLMに投入 → ToDo再確認"),
    ("Day 6-7", "週末", "社内チームに1件シェア／導入時間を計測"),
]
for i, (day, wd, task) in enumerate(plans):
    y = Inches(1.5 + i * 0.85)
    add_rounded(s, Inches(0.7), y, Inches(1.3), Inches(0.7), COLOR_PRIMARY)
    add_text(s, Inches(0.7), y, Inches(1.3), Inches(0.7), day,
             size=14, bold=True, color=COLOR_WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_rounded(s, Inches(2.15), y, Inches(1.0), Inches(0.7), COLOR_YELLOW)
    add_text(s, Inches(2.15), y, Inches(1.0), Inches(0.7), wd,
             size=14, bold=True, color=COLOR_DARK,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_rounded(s, Inches(3.3), y, Inches(9.35), Inches(0.7), COLOR_LIGHT)
    add_text(s, Inches(3.5), y, Inches(9), Inches(0.7), task,
             size=14, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 20, TOTAL)
set_notes(s, """【アクションプラン提示 / 2分】
学んで終わりにしないための "7日間チャレンジ" です。
1日1つ、10〜15分でできる内容だけを並べました。

【伝えたいこと】
"1週間、毎日AIに触る" ことができたら、みなさんの業務は確実に変わります。
逆に1週間触らないと、記憶が薄れて元に戻ります。
""")


# ============================================================
# Slide 21: Q&A
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, COLOR_PRIMARY)
add_text(s, Inches(0.5), Inches(1.5), Inches(12.3), Inches(1.5),
         "Q & A", size=90, bold=True, color=COLOR_WHITE, align=PP_ALIGN.CENTER)
add_text(s, Inches(0.5), Inches(3.5), Inches(12.3), Inches(0.8),
         "ご質問はチャット欄 or「手を挙げる」機能で",
         size=24, color=COLOR_WHITE, align=PP_ALIGN.CENTER)
add_text(s, Inches(0.5), Inches(4.5), Inches(12.3), Inches(0.6),
         "── どんな些細な疑問でも大歓迎です ──",
         size=18, color=COLOR_YELLOW, align=PP_ALIGN.CENTER)
add_rounded(s, Inches(3.5), Inches(5.7), Inches(6.3), Inches(0.8), COLOR_WHITE)
add_text(s, Inches(3.5), Inches(5.7), Inches(6.3), Inches(0.8),
         "📧 questions@hjp-corp.example",
         size=18, bold=True, color=COLOR_PRIMARY,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
add_footer(s, 21, TOTAL)
set_notes(s, """【Q&A / 10分】
- チャットに質問がなければ、事前によくいただく質問をこちらから紹介します。

【FAQ 用意】
Q1. Gemini APIは有料ですか？
A1. 一定枠まで無料。ビジネス利用ならFlashで月数百円程度。

Q2. 社内で導入するときの障壁は？
A2. 情シスへの説明資料はテンプレをお渡しできます（個別相談時）。

Q3. データが外部に漏れませんか？
A3. Workspace Enterpriseの範囲内でGeminiを使えばデータは学習に使われません。

Q4. GASの管理者は誰にすべき？
A4. 属人化を避けるため、共有アカウントを1つ用意することを推奨。

Q5. NotebookLMは無料枠で十分？
A5. 個人利用なら十分。組織展開ならNotebookLM Plusを推奨。
""")


# ============================================================
# Slide 22: ありがとうございました
# ============================================================
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, SW, SH, COLOR_WHITE)
add_rect(s, 0, 0, Inches(0.35), SH, COLOR_PRIMARY)
add_rect(s, Inches(0.35), 0, Inches(0.12), SH, COLOR_ACCENT)
add_rect(s, Inches(0.47), 0, Inches(0.08), SH, COLOR_YELLOW)
add_rect(s, Inches(0.55), 0, Inches(0.06), SH, COLOR_GREEN)

add_text(s, Inches(1.2), Inches(1.5), Inches(11), Inches(1.5),
         "Thank you !", size=90, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(1.2), Inches(3.2), Inches(11), Inches(0.7),
         "本日はご参加、ありがとうございました。",
         size=26, bold=True, color=COLOR_DARK)
add_text(s, Inches(1.2), Inches(4.0), Inches(11), Inches(0.7),
         "AIが日常業務の当たり前になる未来を、ご一緒に。",
         size=20, color=COLOR_GRAY)

add_rounded(s, Inches(1.2), Inches(5.1), Inches(11), Inches(1.6), COLOR_LIGHT)
add_text(s, Inches(1.5), Inches(5.25), Inches(10.5), Inches(0.5),
         "◆ 個別無料相談 受付中", size=16, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(1.5), Inches(5.75), Inches(10.5), Inches(0.9),
         "・自社の業務にどう組み込むか、30分の無料オンライン相談を実施中\n"
         "・お申し込み：セミナー後のアンケート内のリンクから",
         size=14, color=COLOR_DARK)

add_text(s, Inches(1.2), Inches(6.95), Inches(11), Inches(0.4),
         "株式会社HJP Corporation  |  https://hjp-corp.example",
         size=11, color=COLOR_GRAY)

set_notes(s, """【クロージング / 2分】
本日はお時間をいただきありがとうございました。

【お願い】
- 終了後にアンケートを表示します。1分で終わりますので、ぜひご協力ください。
- アンケート回答者にのみ、参加特典のダウンロードURLと次回50%OFFクーポンをお送りします。

【最後のメッセージ】
AIは "使う人" と "使わない人" の差が急速に広がっていくフェーズに入りました。
みなさんは、今日 "使う人" 側の一歩を踏み出しました。
その一歩を、明日、来週、来月とつなげていってください。

またお会いしましょう！
""")


prs.save("/home/user/claude-code/output/seminar2_gemini_workspace.pptx")
print("PPTX generated: seminar2_gemini_workspace.pptx")
print(f"Slides: {len(prs.slides)}")

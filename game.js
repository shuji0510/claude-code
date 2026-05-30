/* =========================================================
   トモぐらし 〜なかよしアパート〜
   ローカル完結の生活シミュレーション（セーブは localStorage）
   ========================================================= */

"use strict";

/* ---------- マスターデータ ---------- */
const FACES = ["🙂","😺","🐶","🐰","🐻","🐼","🦊","🐸","🐤","🦁","🐯","🐷","🐵","🦄","🐙","🐧"];

const PERSONALITIES = {
  げんき:   { hint: "なかよし度が上がりやすい！", talkBonus: 1.4, decay: 1.1 },
  おっとり: { hint: "おなかが減りにくい のんびりさん", talkBonus: 1.0, decay: 0.7 },
  くいしんぼ:{ hint: "ごはんで すごくよろこぶ", talkBonus: 1.0, decay: 1.3, foodLove: 1.6 },
  さびしがり:{ hint: "おしゃべりが だいすき", talkBonus: 1.6, decay: 1.0 },
  クール:   { hint: "きまぐれ でも たまに大もうけ", talkBonus: 0.9, decay: 0.9, coinLuck: 1.5 },
};

const FOODS = [
  { id:"rice",  ico:"🍙", nm:"おにぎり" },
  { id:"ramen", ico:"🍜", nm:"ラーメン" },
  { id:"sushi", ico:"🍣", nm:"おすし" },
  { id:"cake",  ico:"🍰", nm:"ケーキ" },
  { id:"curry", ico:"🍛", nm:"カレー" },
  { id:"fruit", ico:"🍓", nm:"フルーツ" },
];

const SHOP_ITEMS = [
  { id:"rice",   ico:"🍙", nm:"おにぎり", price:5,  type:"food", happy:8 },
  { id:"cake",   ico:"🍰", nm:"ケーキ",   price:12, type:"food", happy:16 },
  { id:"sushi",  ico:"🍣", nm:"おすし",   price:20, type:"food", happy:24 },
  { id:"flower", ico:"💐", nm:"おはな",   price:15, type:"gift", happy:20 },
  { id:"game",   ico:"🎮", nm:"ゲーム",   price:30, type:"gift", happy:35 },
  { id:"teddy",  ico:"🧸", nm:"ぬいぐるみ",price:25, type:"gift", happy:30 },
];

/* ごはん要求などのセリフ */
const TALK_LINES = [
  "きょうは いい天気だね！","となりの人と なかよくなりたいなあ",
  "なにか たのしいこと ないかな〜","きみに 会えて うれしいよ！",
  "さいきん よくねむれてるよ","おなか すいちゃった…","あたらしい ともだち ほしいな",
  "この へや 気に入ってるんだ","ねえねえ、聞いてよ〜","しあわせだなあ♪",
];

/* ---------- ゲーム状態 ---------- */
const MAX_ROOMS = 8;
let state = {
  coins: 30,
  day: 1,
  residents: [],
  inventory: {},      // {itemId: count}
  nextId: 1,
};

/* ---------- セーブ / ロード ---------- */
const SAVE_KEY = "tomogurashi_save_v1";
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { state = JSON.parse(raw); return true; }
  } catch (e) { console.warn("load失敗", e); }
  return false;
}

/* ---------- ユーティリティ ---------- */
const $ = (sel) => document.querySelector(sel);
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const clamp = (v) => Math.max(0, Math.min(100, v));
const foodById = (id) => FOODS.find(f => f.id === id) || FOODS[0];

function moodEmoji(r) {
  const avg = (r.hunger + r.happy) / 2;
  if (r.hunger < 25) return "😖";
  if (avg >= 80) return "😍";
  if (avg >= 55) return "😊";
  if (avg >= 30) return "😐";
  return "😢";
}

/* ---------- トースト & 演出 ---------- */
function toast(msg, kind = "") {
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.textContent = msg;
  $("#toastWrap").appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
function floatEmoji(emoji, x, y) {
  const el = document.createElement("div");
  el.className = "float-emoji";
  el.textContent = emoji;
  el.style.left = (x - 15) + "px";
  el.style.top = (y - 15) + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/* =========================================================
   描画
   ========================================================= */
function render() {
  $("#coinAmount").textContent = state.coins;
  $("#dayCount").textContent = state.day;
  renderRooms();
  save();
}

function renderRooms() {
  const wrap = $("#rooms");
  wrap.innerHTML = "";
  const total = Math.max(2, Math.min(MAX_ROOMS, Math.ceil((state.residents.length + 1) / 2) * 2));

  for (let i = 0; i < total; i++) {
    const r = state.residents[i];
    const room = document.createElement("div");
    if (!r) {
      room.className = "room empty";
      room.textContent = "あき部屋";
      wrap.appendChild(room);
      continue;
    }
    room.className = "room";
    room.innerHTML = `
      <div class="window"></div>
      <div class="mood-bubble">${moodEmoji(r)}</div>
      ${r.request ? `<div class="alert-badge">!</div>` : ""}
      <div class="resident-avatar">${r.face}</div>
      <div class="resident-name">${escapeHtml(r.name)}</div>
      <div class="need-bars">
        <div class="bar hunger"><span style="width:${r.hunger}%"></span></div>
        <div class="bar happy"><span style="width:${r.happy}%"></span></div>
      </div>`;
    room.addEventListener("click", () => openDetail(r.id));
    wrap.appendChild(room);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]
  ));
}

/* =========================================================
   住民の作成
   ========================================================= */
let createSel = { face: FACES[0] };

function openCreate() {
  if (state.residents.length >= MAX_ROOMS) {
    toast("アパートが満室だよ！", "");
    return;
  }
  createSel.face = FACES[0];
  // かおピッカー
  const fp = $("#facePicker");
  fp.innerHTML = "";
  FACES.forEach((f, i) => {
    const b = document.createElement("button");
    b.textContent = f;
    if (i === 0) b.classList.add("sel");
    b.addEventListener("click", () => {
      createSel.face = f;
      fp.querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      $("#avatarPreview").textContent = f;
    });
    fp.appendChild(b);
  });
  $("#avatarPreview").textContent = FACES[0];
  $("#nameInput").value = "";

  // せいかく
  const ps = $("#personalitySelect");
  ps.innerHTML = "";
  Object.keys(PERSONALITIES).forEach(p => {
    const o = document.createElement("option");
    o.value = p; o.textContent = p; ps.appendChild(o);
  });
  ps.onchange = () => { $("#personalityHint").textContent = PERSONALITIES[ps.value].hint; };
  $("#personalityHint").textContent = PERSONALITIES[ps.value].hint;

  // すきなたべもの
  const fs = $("#foodSelect");
  fs.innerHTML = "";
  FOODS.forEach(f => {
    const o = document.createElement("option");
    o.value = f.id; o.textContent = `${f.ico} ${f.nm}`; fs.appendChild(o);
  });

  $("#createOverlay").classList.remove("hidden");
}

function confirmCreate() {
  let name = $("#nameInput").value.trim();
  if (!name) name = "なまえなし";
  const r = {
    id: state.nextId++,
    name,
    face: createSel.face,
    personality: $("#personalitySelect").value,
    favFood: $("#foodSelect").value,
    hunger: 70,
    happy: 70,
    level: 1,
    exp: 0,
    friends: {},          // {residentId: 仲良し度0-100}
    request: null,
    speech: "はじめまして！",
  };
  state.residents.push(r);
  $("#createOverlay").classList.add("hidden");
  toast(`${r.name} が にゅうきょしたよ！ ${r.face}`, "good");
  render();
}

/* =========================================================
   住民の詳細 & アクション
   ========================================================= */
let currentId = null;

function getResident(id) { return state.residents.find(r => r.id === id); }

function openDetail(id) {
  currentId = id;
  renderDetail();
  $("#detailOverlay").classList.remove("hidden");
}

function renderDetail() {
  const r = getResident(currentId);
  if (!r) { $("#detailOverlay").classList.add("hidden"); return; }
  const fav = foodById(r.favFood);

  const friendChips = Object.entries(r.friends)
    .sort((a,b) => b[1]-a[1])
    .map(([fid, lv]) => {
      const f = getResident(Number(fid));
      if (!f) return "";
      const heart = lv >= 80 ? "💖" : lv >= 50 ? "❤️" : lv >= 25 ? "🧡" : "🤍";
      return `<span class="friend-chip">${f.face} ${escapeHtml(f.name)} ${heart}${lv}</span>`;
    }).join("");

  const expNeed = r.level * 100;

  $("#detailModal").innerHTML = `
    <div class="detail-head">
      <div class="detail-avatar">${r.face}</div>
      <div class="detail-name">${escapeHtml(r.name)}</div>
      <div class="detail-tags">
        <span class="tag lv">Lv.${r.level}</span>
        <span class="tag">${r.personality}</span>
        <span class="tag">${fav.ico}すき</span>
      </div>
    </div>
    <div class="speech">${escapeHtml(r.speech || "…")}</div>
    ${r.request ? `<div class="speech" style="border-color:var(--pink);background:#ffe3ec">
        🙏 おねがい: ${escapeHtml(r.request.text)}</div>` : ""}
    <div class="detail-bars">
      <div class="bar-row"><span class="lbl">🍙 おなか</span>
        <div class="bar hunger"><span style="width:${r.hunger}%"></span></div>
        <span class="pct">${Math.round(r.hunger)}</span></div>
      <div class="bar-row"><span class="lbl">😊 きぶん</span>
        <div class="bar happy"><span style="width:${r.happy}%"></span></div>
        <span class="pct">${Math.round(r.happy)}</span></div>
      <div class="bar-row"><span class="lbl">⭐ けいけん</span>
        <div class="bar"><span style="width:${(r.exp/expNeed)*100}%;background:var(--green)"></span></div>
        <span class="pct">${r.exp}/${expNeed}</span></div>
    </div>
    <div class="action-grid">
      <button class="btn green"  id="actFeed">🍙 ごはん</button>
      <button class="btn primary" id="actTalk">💬 おしゃべり</button>
      <button class="btn blue"   id="actPlay">🎲 あそぶ</button>
      <button class="btn ghost"  id="actGift">🎁 プレゼント</button>
    </div>
    ${friendChips ? `<div class="field"><label>💞 なかよし</label>
       <div class="friends-list">${friendChips}</div></div>` : ""}
    <div class="modal-actions">
      <button class="btn ghost" id="actMoveOut">👋 ひっこし</button>
      <button class="btn primary" id="closeDetail">とじる</button>
    </div>`;

  $("#actFeed").onclick = (e) => actFeed(r, e);
  $("#actTalk").onclick = (e) => actTalk(r, e);
  $("#actPlay").onclick = (e) => actPlay(r, e);
  $("#actGift").onclick = () => openGiftPicker(r);
  $("#actMoveOut").onclick = () => moveOut(r);
  $("#closeDetail").onclick = () => $("#detailOverlay").classList.add("hidden");
}

function gainExp(r, amount) {
  r.exp += amount;
  const need = r.level * 100;
  if (r.exp >= need) {
    r.exp -= need;
    r.level++;
    const reward = r.level * 5;
    state.coins += reward;
    toast(`${r.name} が Lv.${r.level} に！ 🪙+${reward}`, "love");
  }
}

function burst(e, emoji) {
  if (e && e.clientX) floatEmoji(emoji, e.clientX, e.clientY);
}

function actFeed(r, e) {
  if (r.hunger >= 100) { r.speech = "もう おなか いっぱい！"; renderDetail(); return; }
  const fav = foodById(r.favFood);
  const p = PERSONALITIES[r.personality];
  const isFav = true; // ごはんは基本好物として無料で提供
  let happyUp = 6 * (p.foodLove || 1);
  r.hunger = clamp(r.hunger + 30);
  r.happy = clamp(r.happy + happyUp);
  r.speech = pick([`${fav.ico} おいしい〜！`, "ごちそうさま！", "げんき でた！"]);
  gainExp(r, 8);
  checkRequest(r, "food");
  burst(e, fav.ico);
  toast(`${r.name} に ごはんをあげた`, "good");
  renderDetail(); render();
}

function actTalk(r, e) {
  const p = PERSONALITIES[r.personality];
  const up = Math.round(8 * p.talkBonus);
  r.happy = clamp(r.happy + up);
  r.speech = pick(TALK_LINES);
  gainExp(r, 6);
  // ほかの住民との仲を少し深める
  deepenRandomFriendship(r, 4);
  checkRequest(r, "talk");
  burst(e, "💬");
  renderDetail(); render();
}

function actPlay(r, e) {
  if (r.happy < 5) { r.speech = "つかれちゃった…"; renderDetail(); return; }
  // ミニゲーム：あたり/はずれ
  const win = Math.random() < 0.6;
  const p = PERSONALITIES[r.personality];
  if (win) {
    const coins = Math.round((3 + rand(6)) * (p.coinLuck || 1));
    state.coins += coins;
    r.happy = clamp(r.happy + 14);
    r.speech = pick(["やったー！かった！🎉","たのしかった！","もういっかい あそぼ！"]);
    gainExp(r, 12);
    burst(e, "🎉");
    toast(`あそびで 🪙+${coins} ゲット！`, "coin");
  } else {
    r.happy = clamp(r.happy + 6);
    r.speech = pick(["うーん まけちゃった","つぎは かつぞ〜！"]);
    gainExp(r, 5);
    burst(e, "🎲");
  }
  checkRequest(r, "play");
  renderDetail(); render();
}

/* プレゼント（インベントリ消費） */
function openGiftPicker(r) {
  const owned = Object.entries(state.inventory).filter(([id, n]) => n > 0);
  if (owned.length === 0) {
    toast("プレゼントが ないよ。ショップで買おう！", "");
    return;
  }
  // 簡易ピッカー：所持アイテムから選ぶ
  const list = owned.map(([id, n]) => {
    const it = SHOP_ITEMS.find(s => s.id === id);
    return it ? `${it.ico} ${it.nm}(${n})` : null;
  }).filter(Boolean);

  // 最初の所持アイテムを使う簡易版 -> 選択ダイアログ
  const choiceId = pickGiftPrompt(owned);
  if (!choiceId) return;
  giveGift(r, choiceId);
}

function pickGiftPrompt(owned) {
  // owned: [[id,count],...]
  const labels = owned.map(([id], i) => {
    const it = SHOP_ITEMS.find(s => s.id === id);
    return `${i+1}: ${it.ico}${it.nm}(${state.inventory[id]})`;
  });
  const ans = window.prompt("どれを あげる？ 番号を入力\n" + labels.join("\n"), "1");
  if (ans === null) return null;
  const idx = parseInt(ans, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= owned.length) { toast("番号が ちがうよ", ""); return null; }
  return owned[idx][0];
}

function giveGift(r, itemId) {
  if (!state.inventory[itemId] || state.inventory[itemId] <= 0) return;
  const it = SHOP_ITEMS.find(s => s.id === itemId);
  state.inventory[itemId]--;
  const p = PERSONALITIES[r.personality];
  let up = it.happy;
  if (it.type === "food") { r.hunger = clamp(r.hunger + 20); up *= (p.foodLove || 1); }
  r.happy = clamp(r.happy + up);
  r.speech = pick([`${it.ico} うれしい！ありがとう！`, "たからもの にするね♪", "だいすき！"]);
  gainExp(r, 15);
  checkRequest(r, "gift", itemId);
  floatEmoji("💖", window.innerWidth/2, window.innerHeight/2);
  toast(`${r.name} に ${it.nm} をプレゼント！`, "love");
  renderDetail(); render();
}

function moveOut(r) {
  if (!confirm(`${r.name} を ひっこしさせる？`)) return;
  state.residents = state.residents.filter(x => x.id !== r.id);
  // ほかの住民のフレンド情報から削除
  state.residents.forEach(o => { delete o.friends[r.id]; });
  $("#detailOverlay").classList.add("hidden");
  toast(`${r.name} は ひっこした…👋`, "");
  render();
}

/* =========================================================
   おねがい（リクエスト）システム
   ========================================================= */
function checkRequest(r, action, itemId) {
  if (!r.request) return;
  const req = r.request;
  let done = false;
  if (req.kind === "food" && action === "food") done = true;
  if (req.kind === "talk" && action === "talk") done = true;
  if (req.kind === "play" && action === "play") done = true;
  if (req.kind === "gift" && action === "gift" && itemId === req.itemId) done = true;
  if (done) {
    const p = PERSONALITIES[r.personality];
    const reward = Math.round(req.reward * (p.coinLuck || 1));
    state.coins += reward;
    r.happy = clamp(r.happy + 20);
    r.request = null;
    r.speech = "おねがい かなえてくれて ありがとう！";
    toast(`おねがい たっせい！ 🪙+${reward}`, "coin");
  }
}

function maybeNewRequest(r) {
  if (r.request) return;
  if (Math.random() > 0.4) return; // 40%でおねがい発生
  const kinds = [
    { kind:"food", text:"ごはんが たべたいな", reward:8 },
    { kind:"talk", text:"だれかと おしゃべりしたい", reward:6 },
    { kind:"play", text:"あそびたい きぶん！", reward:10 },
  ];
  // ギフト要求
  if (Math.random() < 0.4) {
    const it = pick(SHOP_ITEMS.filter(s => s.type === "gift"));
    r.request = { kind:"gift", itemId: it.id, text:`${it.ico}${it.nm} が ほしいな`, reward: Math.round(it.price * 1.3) };
  } else {
    r.request = pick(kinds);
  }
}

/* =========================================================
   なかよし度（人間関係）
   ========================================================= */
function deepenRandomFriendship(r, amount) {
  const others = state.residents.filter(o => o.id !== r.id);
  if (others.length === 0) return;
  const o = pick(others);
  bumpFriendship(r, o, amount);
}

function bumpFriendship(a, b, amount) {
  a.friends[b.id] = clamp((a.friends[b.id] || 0) + amount);
  b.friends[a.id] = clamp((b.friends[a.id] || 0) + amount);
  // 仲良しになった瞬間のイベント
  if (a.friends[b.id] >= 50 && a.friends[b.id] - amount < 50) {
    toast(`${a.name} と ${b.name} が なかよしに！💕`, "love");
    state.coins += 10;
  }
}

/* =========================================================
   つぎの日へ（時間経過 & ランダムイベント）
   ========================================================= */
function nextDay() {
  if (state.residents.length === 0) {
    toast("まずは住民を にゅうきょさせよう！", "");
    return;
  }
  state.day++;

  state.residents.forEach(r => {
    const p = PERSONALITIES[r.personality];
    // ステータス減衰
    r.hunger = clamp(r.hunger - Math.round(18 * p.decay));
    r.happy = clamp(r.happy - Math.round(10 * p.decay));
    // おなかペコペコ時はセリフ
    if (r.hunger < 25) r.speech = "おなか ペコペコだよ…";
    // おねがい発生
    maybeNewRequest(r);
  });

  // 住民同士の自動交流
  if (state.residents.length >= 2) {
    const a = pick(state.residents);
    let b = pick(state.residents);
    let guard = 0;
    while (b.id === a.id && guard++ < 5) b = pick(state.residents);
    if (a.id !== b.id) {
      bumpFriendship(a, b, 5 + rand(8));
    }
  }

  // ランダム日替わりイベント
  dailyEvent();

  // しあわせな住民から家賃（コイン）が入る
  let rent = 0;
  state.residents.forEach(r => {
    if (r.happy >= 60) rent += 2 + Math.floor(r.level / 2);
  });
  if (rent > 0) { state.coins += rent; toast(`家賃しゅうにゅう 🪙+${rent}`, "coin"); }

  render();
}

function dailyEvent() {
  if (state.residents.length === 0) return;
  const roll = Math.random();
  const r = pick(state.residents);
  if (roll < 0.18) {
    // たからもの発見
    const coins = 8 + rand(15);
    state.coins += coins;
    toast(`${r.name} が おかねを ひろった！🪙+${coins}`, "coin");
  } else if (roll < 0.34) {
    // 風邪（気分ダウン）
    r.happy = clamp(r.happy - 20);
    r.speech = "ちょっと げんきが ないな…";
    toast(`${r.name} は すこし おつかれぎみ…`, "");
  } else if (roll < 0.5 && state.residents.length >= 2) {
    // なかよしカップル誕生イベント
    const pair = Object.entries(r.friends).find(([id, lv]) => lv >= 80);
    if (pair) {
      const f = getResident(Number(pair[0]));
      if (f) { toast(`${r.name} と ${f.name} は とっても なかよし！💕`, "love"); state.coins += 15; }
    }
  } else if (roll < 0.62) {
    // たんじょうび
    r.happy = clamp(r.happy + 25);
    r.speech = "きょうは いい気分！🎂";
    toast(`${r.name} は ごきげん！🎂`, "good");
  }
}

/* =========================================================
   ショップ
   ========================================================= */
function openShop() {
  renderShop();
  $("#shopOverlay").classList.remove("hidden");
}
function renderShop() {
  const g = $("#shopGrid");
  g.innerHTML = "";
  SHOP_ITEMS.forEach(it => {
    const owned = state.inventory[it.id] || 0;
    const d = document.createElement("div");
    d.className = "shop-item";
    d.innerHTML = `
      <div class="ico">${it.ico}</div>
      <div class="nm">${it.nm}</div>
      <div class="owned">もってる: ${owned}</div>
      <button class="buy" ${state.coins < it.price ? "disabled" : ""}>🪙${it.price}</button>`;
    d.querySelector(".buy").addEventListener("click", () => buyItem(it));
    g.appendChild(d);
  });
}
function buyItem(it) {
  if (state.coins < it.price) { toast("おかねが たりないよ", ""); return; }
  state.coins -= it.price;
  state.inventory[it.id] = (state.inventory[it.id] || 0) + 1;
  toast(`${it.nm} を かった！`, "good");
  renderShop(); render();
}

/* =========================================================
   起動
   ========================================================= */
function bindEvents() {
  $("#addResidentBtn").onclick = openCreate;
  $("#shopBtn").onclick = openShop;
  $("#nextDayBtn").onclick = nextDay;
  $("#cancelCreate").onclick = () => $("#createOverlay").classList.add("hidden");
  $("#confirmCreate").onclick = confirmCreate;
  $("#closeShop").onclick = () => $("#shopOverlay").classList.add("hidden");
  // オーバーレイ背景クリックで閉じる
  document.querySelectorAll(".overlay").forEach(ov => {
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.add("hidden"); });
  });
}

function init() {
  bindEvents();
  if (!load()) {
    // 初回：チュートリアル住民を1人プレゼント
    state.residents.push({
      id: state.nextId++, name:"モモ", face:"🐰",
      personality:"げんき", favFood:"fruit",
      hunger:80, happy:80, level:1, exp:0, friends:{}, request:null,
      speech:"アパートへ ようこそ！いっしょに あそぼ♪",
    });
    save();
    toast("ようこそ！まずは住民をタップ👆", "good");
  }
  render();
}

document.addEventListener("DOMContentLoaded", init);

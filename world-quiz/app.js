/* =========================================================
   世界の国と首都マスター
   - data.js  : 60か国のデータ
   - mapdata.js : 簡略化した世界地図（0.1度単位・差分エンコード）
   ========================================================= */

/* ---------------- 小道具 ---------------- */
const $ = (sel) => document.querySelector(sel);
const byNo = new Map(COUNTRIES.map((c) => [c.no, c]));
const byCode = new Map(COUNTRIES.map((c) => [c.code, c]));

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('wq.' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('wq.' + key, JSON.stringify(value)); } catch (e) { /* 保存できなくても続行 */ }
  },
  remove(key) {
    try { localStorage.removeItem('wq.' + key); } catch (e) { /* noop */ }
  },
  // 'wq.best.' ではじまるキーをぜんぶ消す（範囲や問題数の組み合わせを取りこぼさない）
  removeByPrefix(prefix) {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('wq.' + prefix)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* noop */ }
  },
};

/* ---------------- 効果音（WebAudioでその場で作る） ---------------- */
const Sound = {
  on: Store.get('sound', true),
  ctx: null,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  play(notes, type = 'sine', volume = 0.14) {
    if (!this.on) return;
    const ctx = this.ensure();
    if (!ctx) return;
    let t = ctx.currentTime;
    notes.forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur;
    });
  },
  correct(combo) {
    const base = 660 + Math.min(combo, 8) * 40;
    this.play([[base, 0.09], [base * 1.5, 0.14]], 'triangle');
  },
  wrong() { this.play([[220, 0.16], [165, 0.22]], 'sawtooth', 0.1); },
  tap() { this.play([[520, 0.05]], 'sine', 0.07); },
  finish() { this.play([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.26]], 'triangle'); },
};

/* =========================================================
   地図
   ========================================================= */
const SVG_NS = 'http://www.w3.org/2000/svg';
const WORLD = { x: 0, y: 40, w: 3600, h: 1460 }; // 経度-180〜180 / 緯度86〜-60

// 経度・緯度 → SVGの座標（1単位 = 0.1度）
const toX = (lng) => lng * 10 + 1800;
const toY = (lat) => 900 - lat * 10;

// 差分エンコードされたリングを、絶対座標の配列 [x0,y0,x1,y1,...] に展開する
function decodeRing(deltas) {
  const pts = new Array(deltas.length);
  let x = 0, y = 0;
  for (let i = 0; i < deltas.length; i += 2) {
    x += deltas[i];
    y += deltas[i + 1];
    pts[i] = x + 1800;
    pts[i + 1] = 900 - y;
  }
  return pts;
}
function ringToPath(pts) {
  let d = 'M' + pts[0] + ' ' + pts[1];
  for (let i = 2; i < pts.length; i += 2) d += 'L' + pts[i] + ' ' + pts[i + 1];
  return d + 'Z';
}

// 展開済みリングのキャッシュ（当たり判定でも使う）
const TARGET_RINGS = {};
for (const code in MAP_DATA.targets) {
  TARGET_RINGS[code] = MAP_DATA.targets[code].map(decodeRing);
}
const WORLD_PATHS = MAP_DATA.world.map((r) => ringToPath(decodeRing(r)));

function pointInRing(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function distToRing(px, py, pts) {
  let best = Infinity;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const x1 = pts[j], y1 = pts[j + 1], x2 = pts[i], y2 = pts[i + 1];
    const dx = x2 - x1, dy = y2 - y1;
    let t = 0;
    if (dx || dy) t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
    best = Math.min(best, Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)));
  }
  return best;
}
// 点から各国までの距離（国の中なら0）
function distanceToCountry(px, py, code) {
  const rings = TARGET_RINGS[code];
  let best = Infinity;
  for (const r of rings) {
    if (pointInRing(px, py, r)) return 0;
    best = Math.min(best, distToRing(px, py, r));
  }
  return best;
}
function countryAtPoint(px, py) {
  let bestCode = null, bestDist = Infinity;
  for (const code in TARGET_RINGS) {
    const d = distanceToCountry(px, py, code);
    if (d < bestDist) { bestDist = d; bestCode = code; }
    if (d === 0) break;
  }
  return { code: bestCode, dist: bestDist };
}

// 表示範囲のプリセット（左上x,左上y,幅,高さ）
// 名前は出題範囲チップ（REGIONS）と同じ言い方にそろえる
const VIEWS = {
  world: { name: '世界', box: [0, 40, 3600, 1460] },
  america: { name: 'アメリカ大陸', box: [400, 175, 1085, 1290] },
  europe: { name: 'ヨーロッパ', box: [1670, 170, 590, 400] },
  africa: { name: 'アフリカ', box: [1595, 495, 760, 780] },
  westasia: { name: '西アジア', box: [2040, 440, 545, 355] },
  easia: { name: '南・東アジア', box: [2440, 335, 845, 665] },
};

function createMap(container, options = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const gWorld = document.createElementNS(SVG_NS, 'g');
  const gTargets = document.createElementNS(SVG_NS, 'g');
  const gOverlay = document.createElementNS(SVG_NS, 'g');
  svg.append(gWorld, gTargets, gOverlay);

  for (const d of WORLD_PATHS) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', 'land');
    gWorld.appendChild(p);
  }
  const paths = {};
  for (const code in TARGET_RINGS) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', TARGET_RINGS[code].map(ringToPath).join(' '));
    p.setAttribute('class', 'target');
    p.dataset.code = code;
    gTargets.appendChild(p);
    paths[code] = p;
  }
  container.innerHTML = '';
  container.appendChild(svg);

  const view = { cx: 1800, cy: 770, w: 3600 };
  let anim = null;
  // 首都マークなどの目印。拡大率がかわっても、画面上の大きさは一定に保つ
  const marks = [];
  let pxWidth = 400; // 地図の表示幅（px）。renderのたびに更新する
  const markScale = () => view.w / pxWidth; // 画面1px分が地図の何単位か

  function aspect() {
    const r = svg.getBoundingClientRect();
    if (r.width > 0) pxWidth = r.width;
    return r.height > 0 ? r.width / r.height : 2;
  }
  // 横長の表示領域では、世界全体（南北1460）が入るだけの幅を許す
  function maxViewWidth() {
    return Math.max(WORLD.w, WORLD.h * aspect());
  }
  function render() {
    const a = aspect();
    const w = clamp(view.w, 160, maxViewWidth());
    const h = w / a;
    const cx = w >= WORLD.w
      ? WORLD.x + WORLD.w / 2
      : clamp(view.cx, WORLD.x + w / 2, WORLD.x + WORLD.w - w / 2);
    const cy = h >= WORLD.h ? WORLD.y + WORLD.h / 2 : clamp(view.cy, WORLD.y + h / 2, WORLD.y + WORLD.h - h / 2);
    view.w = w; view.cx = cx; view.cy = cy;
    svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);
    scaleMarks();
  }
  // 目印のサイズは「画面上の見た目のpx × 1pxあたりの地図単位」で決める
  function scaleMarks() {
    const s = markScale();
    for (const m of marks) {
      if (m.type === 'dot') {
        m.el.setAttribute('r', 6 * s);
        m.el.setAttribute('stroke-width', 1.6 * s);
      } else if (m.type === 'ping') {
        m.el.setAttribute('stroke-width', 2.5 * s);
      } else if (m.type === 'label') {
        m.el.setAttribute('x', m.x + 10 * s);
        m.el.setAttribute('y', m.y - 9 * s);
        m.el.setAttribute('font-size', 15 * s);
        m.el.setAttribute('stroke-width', 3.4 * s);
      } else if (m.type === 'cross') {
        const d = 9 * s;
        m.el.setAttribute('d', `M${m.x - d} ${m.y - d}L${m.x + d} ${m.y + d}M${m.x + d} ${m.y - d}L${m.x - d} ${m.y + d}`);
        m.el.setAttribute('stroke-width', 2.6 * s);
      }
    }
  }
  function boxToView(box) {
    const [x, y, w, h] = box;
    return { cx: x + w / 2, cy: y + h / 2, w: Math.max(w, h * aspect()) };
  }
  function setView(key, animate = true) {
    const target = boxToView((VIEWS[key] || VIEWS.world).box);
    if (!animate) { Object.assign(view, target); render(); return; }
    const from = { ...view };
    const t0 = performance.now();
    if (anim) cancelAnimationFrame(anim);
    (function step(now) {
      const t = clamp((now - t0) / 420, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      view.cx = from.cx + (target.cx - from.cx) * e;
      view.cy = from.cy + (target.cy - from.cy) * e;
      view.w = from.w + (target.w - from.w) * e;
      render();
      if (t < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  // 画面上の座標 → 地図の座標
  function toMapPoint(clientX, clientY) {
    const r = svg.getBoundingClientRect();
    const a = r.width / r.height;
    const w = view.w, h = w / a;
    return {
      x: view.cx - w / 2 + ((clientX - r.left) / r.width) * w,
      y: view.cy - h / 2 + ((clientY - r.top) / r.height) * h,
    };
  }
  // 画面の1px = 地図の何単位か
  function unitsPerPixel() {
    const r = svg.getBoundingClientRect();
    return r.width > 0 ? view.w / r.width : 1;
  }

  /* --- ドラッグ / ホイール / ピンチ操作 --- */
  const pointers = new Map();
  let dragged = false, pinchStart = null, dragStart = null;
  svg.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    svg.setPointerCapture(e.pointerId);
    dragged = false;
    dragStart = { x: e.clientX, y: e.clientY };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), w: view.w };
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist > 0) { view.w = pinchStart.w * (pinchStart.dist / dist); render(); }
      dragged = true;
      return;
    }
    if (pointers.size === 1) {
      const upp = unitsPerPixel();
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      // ゆっくり動かしてもドラッグとみなせるよう、押した場所からの合計距離で判定する
      if (dragStart && Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y) > 6) dragged = true;
      view.cx -= dx * upp;
      view.cy -= dy * upp;
      render();
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) dragStart = null;
  }
  svg.addEventListener('pointerup', (e) => {
    endPointer(e);
    if (!dragged && options.onClick) {
      const p = toMapPoint(e.clientX, e.clientY);
      options.onClick(p, unitsPerPixel());
    }
  });
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('lostpointercapture', endPointer);
  svg.addEventListener('wheel', (e) => {
    const next = clamp(view.w * (e.deltaY > 0 ? 1.15 : 0.87), 160, maxViewWidth());
    if (next === view.w) return; // これ以上拡大縮小できないときはページのスクロールにゆずる
    e.preventDefault();
    const before = toMapPoint(e.clientX, e.clientY);
    view.w = next;
    render();
    const after = toMapPoint(e.clientX, e.clientY);
    view.cx += before.x - after.x;
    view.cy += before.y - after.y;
    render();
  }, { passive: false });

  window.addEventListener('resize', render);
  requestAnimationFrame(render);

  const api = {
    svg, paths, view, setView, render, toMapPoint, unitsPerPixel,
    setClickable(on) { svg.parentElement.classList.toggle('clickable', !!on); },
    clearMarks() {
      for (const m of marks) if (m.raf) cancelAnimationFrame(m.raf);
      gOverlay.innerHTML = '';
      marks.length = 0;
      for (const code in paths) paths[code].setAttribute('class', 'target');
    },
    mark(code, cls) {
      if (paths[code]) paths[code].setAttribute('class', 'target ' + cls);
    },
    // 国を画面の中心に持ってくる（まわりの国も少し見えるようにする）
    focus(code, animate = true, contextRatio = 1, include = null) {
      // リングごとの範囲を出し、いちばん大きい島（本土）から遠いものは無視する。
      // こうしないと、日付変更線をまたぐロシアの範囲が地球一周分になってしまう
      const boxes = TARGET_RINGS[code].map((r) => {
        let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
        for (let i = 0; i < r.length; i += 2) {
          a = Math.min(a, r[i]); c = Math.max(c, r[i]);
          b = Math.min(b, r[i + 1]); d = Math.max(d, r[i + 1]);
        }
        return { minX: a, minY: b, maxX: c, maxY: d, size: (c - a) * (d - b) };
      });
      const main = boxes.reduce((best, x) => (x.size > best.size ? x : best), boxes[0]);
      const mainCx = (main.minX + main.maxX) / 2;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const box of boxes) {
        if (Math.abs((box.minX + box.maxX) / 2 - mainCx) > 1500) continue;
        minX = Math.min(minX, box.minX); maxX = Math.max(maxX, box.maxX);
        minY = Math.min(minY, box.minY); maxY = Math.max(maxY, box.maxY);
      }
      if (include) { // この点（タップした場所など）も入るように広げる
        minX = Math.min(minX, include.x); maxX = Math.max(maxX, include.x);
        minY = Math.min(minY, include.y); maxY = Math.max(maxY, include.y);
      }
      const bw = maxX - minX, bh = maxY - minY;
      const maxDim = Math.max(bw, bh);
      const pad = clamp(maxDim * 0.35, 15, 120);
      const target = boxToView([minX - pad, minY - pad, bw + pad * 2, bh + pad * 2]);
      // 小さい国はまわりが見えるくらいまで、大きい国はそのままの大きさで
      const floor = clamp(maxDim * 3.5, 80, 400);
      target.w = clamp(Math.max(target.w, floor) * contextRatio, 80, WORLD.w);
      if (!animate) { Object.assign(view, target); render(); return; }
      const from = { ...view };
      const t0 = performance.now();
      if (anim) cancelAnimationFrame(anim);
      (function step(now) {
        const t = clamp((now - t0) / 420, 0, 1);
        const e = 1 - Math.pow(1 - t, 3);
        view.cx = from.cx + (target.cx - from.cx) * e;
        view.cy = from.cy + (target.cy - from.cy) * e;
        view.w = from.w + (target.w - from.w) * e;
        render();
        if (t < 1) anim = requestAnimationFrame(step);
      })(t0);
    },
    // 首都の点＋名前を出す
    showCapital(country, withLabel = true) {
      const x = toX(country.lng), y = toY(country.lat);
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      dot.setAttribute('class', 'capital-dot');
      gOverlay.appendChild(dot);
      marks.push({ el: dot, type: 'dot', x, y });

      const ping = document.createElementNS(SVG_NS, 'circle');
      ping.setAttribute('cx', x); ping.setAttribute('cy', y);
      ping.setAttribute('class', 'ping');
      gOverlay.appendChild(ping);
      const pingMark = { el: ping, type: 'ping', x, y, raf: 0 };
      marks.push(pingMark);
      const t0 = performance.now();
      (function grow(now) {
        if (!ping.isConnected) return;
        const t = ((now - t0) % 1400) / 1400;
        ping.setAttribute('r', (6 + t * 42) * markScale());
        ping.setAttribute('opacity', String(1 - t));
        pingMark.raf = requestAnimationFrame(grow);
      })(t0);

      if (withLabel) {
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('class', 'capital-label');
        label.textContent = country.capital;
        gOverlay.appendChild(label);
        marks.push({ el: label, type: 'label', x, y });
      }
      scaleMarks();
    },
    // クリックした場所に「×」を出す
    showClickMark(p) {
      const el = document.createElementNS(SVG_NS, 'path');
      el.setAttribute('class', 'click-mark');
      gOverlay.appendChild(el);
      marks.push({ el, type: 'cross', x: p.x, y: p.y });
      scaleMarks();
    },
  };
  return api;
}

/* =========================================================
   モードと出題
   ========================================================= */
const MODES = [
  { id: 'capital', emoji: '🏙️', name: '首都あてクイズ', desc: '国名 → 首都を4つからえらぶ' },
  { id: 'country', emoji: '🏳️', name: '国あてクイズ', desc: '首都 → 国名を4つからえらぶ' },
  { id: 'locate', emoji: '📍', name: '場所あてクイズ', desc: '国名 → 地図をタップしてさがす' },
  { id: 'which', emoji: '🔦', name: 'ここどこ？クイズ', desc: '光っている国の名前をあてる' },
  { id: 'mix', emoji: '🎲', name: 'ミックス', desc: '4種類のクイズがランダムに登場' },
  { id: 'time', emoji: '⏱️', name: '60秒タイムアタック', desc: '時間内に何問正解できるかな？' },
  { id: 'study', emoji: '📖', name: '学習モード', desc: '地図と一覧でじっくり覚える' },
];
const MODE_NAME = Object.fromEntries(MODES.map((m) => [m.id, m.name]));
const QUIZ_TYPES = ['capital', 'country', 'locate', 'which'];

const Settings = {
  region: Store.get('region', 'all'),
  count: Store.get('count', 10),
};

function regionOf(country) {
  return REGIONS.find((r) => r.id !== 'all' && country.no >= r.range[0] && country.no <= r.range[1]);
}
function poolFor(regionId) {
  const r = REGIONS.find((x) => x.id === regionId) || REGIONS[0];
  return COUNTRIES.filter((c) => c.no >= r.range[0] && c.no <= r.range[1]);
}
function countOptions(regionId) {
  const max = poolFor(regionId).length;
  return [5, 10, 20, max].filter((v, i, a) => v <= max && a.indexOf(v) === i);
}
// 実際に出す問題数。範囲をせまくしても Settings.count は書きかえず、
// その範囲で選べる数のうち「えらんだ数をこえない最大」を使う
function effectiveCount() {
  const options = countOptions(Settings.region);
  const usable = options.filter((v) => v <= Settings.count);
  return usable.length ? Math.max(...usable) : Math.min(...options);
}
function viewKeyFor(country) {
  const r = regionOf(country);
  return r && VIEWS[r.id] ? r.id : 'world';
}

// にがて度（まちがえた回数）を記録して、出題されやすくする
const Stats = {
  data: Store.get('stats', {}),
  wrongCount(no) { return (this.data[no] && this.data[no].wrong) || 0; },
  record(no, ok) {
    const s = this.data[no] || (this.data[no] = { right: 0, wrong: 0 });
    if (ok) s.right++; else s.wrong++;
    Store.set('stats', this.data);
  },
};

// にがてな国ほど当たりやすい重みつき抽選
function pickWeighted(pool, exclude) {
  const cands = pool.filter((c) => !exclude.has(c.no));
  const list = cands.length ? cands : pool;
  const weights = list.map((c) => 1 + Stats.wrongCount(c.no) * 2);
  let total = weights.reduce((a, b) => a + b, 0) * Math.random();
  for (let i = 0; i < list.length; i++) {
    total -= weights[i];
    if (total <= 0) return list[i];
  }
  return list[list.length - 1];
}

// まぎらわしい選択肢は、なるべく同じ地域から選ぶ
function makeChoices(answer, key) {
  const region = regionOf(answer);
  const near = COUNTRIES.filter((c) => c.no !== answer.no && regionOf(c) === region);
  const far = COUNTRIES.filter((c) => c.no !== answer.no && regionOf(c) !== region);
  const others = shuffle(near).concat(shuffle(far));
  const picked = [answer];
  for (const c of others) {
    if (picked.length >= 4) break;
    if (picked.some((p) => p[key] === c[key])) continue;
    picked.push(c);
  }
  return shuffle(picked);
}

function buildQuestion(country, type) {
  const q = { country, type };
  if (type === 'capital') {
    q.label = 'この国の首都は？';
    q.text = country.name;
    q.choices = makeChoices(country, 'capital').map((c) => ({ text: c.capital, ok: c.no === country.no }));
  } else if (type === 'country') {
    q.label = 'この都市を首都とする国は？';
    q.text = country.capital;
    q.choices = makeChoices(country, 'name').map((c) => ({ text: c.name, ok: c.no === country.no }));
  } else if (type === 'which') {
    q.label = '光っている国はどこ？';
    q.text = '？？？';
    q.useMap = true;
    q.choices = makeChoices(country, 'name').map((c) => ({ text: c.name, ok: c.no === country.no }));
  } else {
    q.label = 'この国を地図からさがそう！';
    q.text = country.name;
    q.useMap = true;
    q.mapClick = true;
  }
  return q;
}

/* =========================================================
   画面のきりかえ
   ========================================================= */
const screens = {
  home: $('#screen-home'),
  quiz: $('#screen-quiz'),
  result: $('#screen-result'),
  study: $('#screen-study'),
};
function showScreen(name) {
  for (const k in screens) screens[k].hidden = k !== name;
  $('#btn-home').hidden = name === 'home';
  window.scrollTo(0, 0);
}

/* =========================================================
   クイズ本体
   ========================================================= */
const Quiz = {
  map: null,
  state: null,
  timerId: null,
  autoNextId: null,

  start(mode, opts = {}) {
    clearTimeout(this.autoNextId);
    const pool = opts.pool || poolFor(Settings.region);
    const isTime = mode === 'time';
    const total = isTime ? Infinity : Math.min(opts.count || effectiveCount(), pool.length);
    this.state = {
      mode, pool, total, isTime,
      index: 0, correct: 0, answered: 0,
      score: 0, combo: 0, bestCombo: 0,
      used: new Set(), wrong: [], q: null, locked: false,
      timeLeft: 60,
    };
    showScreen('quiz');
    $('#hud-score').textContent = '0';
    $('#hud-combo').textContent = '0';
    $('#hud-combo').classList.remove('hot');
    $('#feedback').hidden = true;
    $('#hud-timer-wrap').hidden = !isTime;
    if (!this.map) {
      this.map = createMap($('#quiz-map'), {
        onClick: (p, upp) => this.onMapClick(p, upp),
      });
    }
    if (isTime) {
      this.state.timeLeft = 60;
      $('#hud-timer').textContent = '60';
      $('#hud-timer').classList.remove('hurry');
      clearInterval(this.timerId);
      this.timerId = setInterval(() => this.tick(), 1000);
    }
    this.next();
  },

  tick() {
    const s = this.state;
    s.timeLeft--;
    $('#hud-timer').textContent = String(Math.max(0, s.timeLeft));
    $('#hud-timer').classList.toggle('hurry', s.timeLeft <= 10);
    if (s.timeLeft <= 0) this.finish();
  },

  next() {
    const s = this.state;
    clearTimeout(this.autoNextId);
    if (!s.isTime && s.index >= s.total) return this.finish();

    if (s.used.size >= s.pool.length) s.used.clear();
    const country = pickWeighted(s.pool, s.used);
    s.used.add(country.no);
    const type = (s.mode === 'mix' || s.mode === 'time') ? sample(QUIZ_TYPES) : s.mode;
    const q = buildQuestion(country, type);
    s.q = q;
    s.locked = false;
    s.index++;

    $('#question-label').textContent = q.label;
    $('#question-text').textContent = q.text;
    // 「ここどこ？」は地図と選択肢が主役。問題カードは出さずに画面をつめる
    $('.question').hidden = q.type === 'which';
    $('#zoom-buttons').hidden = !q.mapClick;
    $('#feedback').hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('#hud-progress').textContent = s.isTime ? `${s.index}問目` : `${s.index} / ${s.total}`;
    $('#progress-fill').style.width = s.isTime
      ? Math.max(0, (s.timeLeft / 60) * 100) + '%'
      : ((s.index - 1) / s.total) * 100 + '%';

    const mapArea = $('#map-area');
    const choicesEl = $('#choices');
    mapArea.hidden = !q.useMap;
    choicesEl.hidden = !q.choices;

    if (q.useMap) {
      this.map.clearMarks();
      this.map.setClickable(!!q.mapClick);
      $('.map-hint').textContent = q.mapClick
        ? '小さい国は拡大ボタンやピンチで大きくしてからタップ！'
        : '黄色く光っている国はどこかな？';
      if (q.mapClick) {
        // えらんだ範囲にあわせて表示する（「ぜんぶ」のときだけ世界地図）
        setQuizView(Settings.region === 'all' ? 'world' : Settings.region);
      } else {
        // 光らせる国を、まわりの国ごと見えるくらいの大きさで真ん中に
        this.map.mark(country.code, 'is-quiz');
        clearZoomButtons();
        this.map.focus(country.code, true, 1.4);
      }
      requestAnimationFrame(() => this.map.render());
    }
    if (q.choices) this.renderChoices(q);
  },

  renderChoices(q) {
    const el = $('#choices');
    el.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.innerHTML = `<span class="key">${i + 1}</span>`;
      btn.append(document.createTextNode(choice.text));
      btn.addEventListener('click', () => this.answerChoice(i, btn));
      el.appendChild(btn);
    });
  },

  answerChoice(i, btn) {
    const s = this.state;
    if (s.locked) return;
    s.locked = true;
    const ok = s.q.choices[i].ok;
    const buttons = [...$('#choices').children];
    buttons.forEach((b, j) => {
      b.disabled = true;
      if (s.q.choices[j].ok) b.classList.add('correct');
    });
    if (!ok) btn.classList.add('wrong');
    const detail = ok ? '' : `えらんだのは「${s.q.choices[i].text}」`;
    this.judge(ok, detail);
  },

  onMapClick(p, unitsPerPixel) {
    const s = this.state;
    if (!s || !s.q || !s.q.mapClick || s.locked) return;
    s.locked = true;
    const answerCode = s.q.country.code;
    // 指やマウスのズレを少し許す（ただし広い範囲を表示しているときは甘くしすぎない）
    const tolerance = Math.min(unitsPerPixel * 18, 40);
    const answerDist = distanceToCountry(p.x, p.y, answerCode);
    const nearest = countryAtPoint(p.x, p.y);
    const ok = answerDist === 0 || (answerDist <= tolerance && nearest.code === answerCode);

    this.map.setClickable(false);
    this.map.showClickMark(p);
    this.map.mark(answerCode, 'is-answer');
    let detail = '';
    if (!ok && nearest.code && nearest.code !== answerCode && nearest.dist <= Math.min(unitsPerPixel * 40, 130)) {
      this.map.mark(nearest.code, 'is-wrong');
      detail = `タップしたのは「${byCode.get(nearest.code).name}」のあたり`;
    } else if (!ok) {
      detail = '海のあたりをタップしたよ';
    }
    // まちがえたときは「押した場所」と「正解の国」が両方見えるようにうつす
    this.map.focus(answerCode, true, 1, ok ? null : p);
    this.map.showCapital(s.q.country);
    this.judge(ok, detail);
  },

  judge(ok, detail) {
    const s = this.state;
    s.answered++;
    Stats.record(s.q.country.no, ok);
    if (ok) {
      s.correct++;
      s.combo++;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      s.score += 10 + Math.max(0, s.combo - 1) * 2;
      Sound.correct(s.combo);
    } else {
      s.combo = 0;
      s.wrong.push({ country: s.q.country, type: s.q.type });
      Sound.wrong();
    }
    if (s.q.type === 'which') {
      // 光っていた国が正解の国。答え合わせでは緑にして首都も見せる
      this.map.mark(s.q.country.code, 'is-answer');
      this.map.showCapital(s.q.country);
    }
    $('#hud-score').textContent = String(s.score);
    $('#hud-combo').textContent = String(s.combo);
    $('#hud-combo').classList.toggle('hot', s.combo >= 3);

    const c = s.q.country;
    const fb = $('#feedback');
    fb.hidden = false;
    fb.className = 'feedback ' + (ok ? 'ok' : 'ng');
    const praise = ['せいかい！', 'いいね！', 'バッチリ！', 'その調子！'];
    $('#feedback-title').textContent = ok
      ? (s.combo >= 3 ? `${s.combo}れんぞく正解！🔥` : sample(praise))
      : 'ざんねん…';
    $('#feedback-detail').innerHTML =
      `<strong>${c.no}. ${c.name} — 首都 ${c.capital}</strong><br>` +
      (detail ? `<span style="color:#5b7590">${detail}</span><br>` : '') +
      `<span style="font-size:13px">${c.hint}</span>`;
    $('#btn-next').textContent = (!s.isTime && s.index >= s.total) ? 'けっかを見る →' : 'つぎの問題 →';
    // 答え合わせが画面の外に出ないようにする
    requestAnimationFrame(() => fb.scrollIntoView({ behavior: 'smooth', block: 'end' }));
    // タイムアタックで正解したときは、タップを待たずに次へ（時間がもったいない）
    clearTimeout(this.autoNextId);
    if (s.isTime && ok) {
      this.autoNextId = setTimeout(() => {
        if (this.state === s && !screens.quiz.hidden && s.timeLeft > 0) this.next();
      }, 900);
    }
  },

  finish() {
    clearInterval(this.timerId);
    clearTimeout(this.autoNextId);
    if (this.map) this.map.clearMarks();
    const s = this.state;
    Sound.finish();
    const total = s.isTime ? s.answered : s.total;
    const rate = total ? s.correct / total : 0;
    const ranks = [
      [0.95, 'S', 'かんぺき！世界地図マスター！'],
      [0.8, 'A', 'すばらしい！あと少しで完ぺき！'],
      [0.6, 'B', 'いいちょうし！にがてを復習しよう'],
      [0.3, 'C', 'まだまだのびる！もう一回！'],
      [0, 'D', '学習モードでかくにんしてみよう'],
    ];
    const [, rank, title] = ranks.find(([th]) => rate >= th);
    $('#result-rank').textContent = rank;
    $('#result-title').textContent = title;
    $('#result-correct').textContent = String(s.correct);
    $('#result-total').textContent = String(total);
    $('#result-points').textContent = String(s.score);

    const key = `best.${s.mode}.${Settings.region}.${s.isTime ? 'time' : s.total}`;
    const best = Store.get(key, 0);
    const isBest = s.score > best;
    if (isBest) Store.set(key, s.score);
    $('#result-best').hidden = !isBest;
    $('#result-combo').textContent = `🔥 さいこうれんぞく ${s.bestCombo}問`;
    $('#result-bestscore').textContent = `🏆 じこベスト ${Math.max(best, s.score)}てん`;

    const wrapper = $('#result-wrong-wrap');
    const list = $('#result-wrong');
    list.innerHTML = '';
    const uniqueWrong = [];
    for (const w of s.wrong) if (!uniqueWrong.some((u) => u.country.no === w.country.no)) uniqueWrong.push(w);
    wrapper.hidden = uniqueWrong.length === 0;
    $('#btn-retry-wrong').hidden = uniqueWrong.length === 0;
    this.lastWrongPool = uniqueWrong.map((w) => w.country);
    for (const w of uniqueWrong) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="wl-country">${w.country.no}. ${w.country.name}</span>` +
        ` — 首都 ${w.country.capital}<br><span class="wl-detail">${w.country.hint}</span>`;
      list.appendChild(li);
    }
    renderRecords();
    showScreen('result');
  },
};

/* =========================================================
   学習モード
   ========================================================= */
const Study = {
  map: null,
  selected: null,
  open() {
    showScreen('study');
    if (!this.map) {
      this.map = createMap($('#study-map'), {
        onClick: (p, upp) => {
          const hit = countryAtPoint(p.x, p.y);
          if (hit.code && hit.dist <= upp * 20) this.select(byCode.get(hit.code), false);
        },
      });
      this.map.setClickable(true);
      this.renderList();
      this.renderZoom();
    }
    requestAnimationFrame(() => this.map.render());
  },
  renderZoom() {
    const wrap = $('#study-zoom-buttons');
    wrap.innerHTML = '';
    for (const key in VIEWS) {
      const b = document.createElement('button');
      b.className = 'zoom-btn' + (key === 'world' ? ' selected' : '');
      b.textContent = VIEWS[key].name;
      b.addEventListener('click', () => {
        [...wrap.children].forEach((x) => x.classList.remove('selected'));
        b.classList.add('selected');
        this.map.setView(key);
        Sound.tap();
      });
      wrap.appendChild(b);
    }
  },
  renderList() {
    const wrap = $('#study-list');
    wrap.innerHTML = '';
    for (const r of REGIONS.filter((x) => x.id !== 'all')) {
      const h = document.createElement('p');
      h.className = 'study-group-title';
      h.textContent = `${r.emoji} ${r.name}（${r.range[0]}〜${r.range[1]}）`;
      const grid = document.createElement('div');
      grid.className = 'study-items';
      for (let n = r.range[0]; n <= r.range[1]; n++) {
        const c = byNo.get(n);
        const b = document.createElement('button');
        b.className = 'study-item';
        b.dataset.no = String(n);
        b.innerHTML = `<b>${c.no}. ${c.name}</b><span>${c.capital}</span>`;
        b.addEventListener('click', () => this.select(c, true));
        grid.appendChild(b);
      }
      wrap.append(h, grid);
    }
  },
  select(country, fromList) {
    this.selected = country;
    this.map.clearMarks();
    this.map.mark(country.code, 'is-selected');
    if (fromList) {
      this.map.focus(country.code);
      $('#study-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    this.map.showCapital(country);
    Sound.tap();
    const r = regionOf(country);
    $('#study-info').innerHTML =
      `<p class="study-name"><span class="study-no">${country.no}</span>${country.name}</p>` +
      `<p class="study-capital">首都：${country.capital}</p>` +
      `<p class="study-hint">${r ? r.emoji + ' ' + r.name + '／' : ''}${country.hint}</p>`;
    document.querySelectorAll('.study-item').forEach((el) => {
      el.classList.toggle('selected', el.dataset.no === String(country.no));
    });
  },
};

/* =========================================================
   ホーム画面
   ========================================================= */
function renderRegionChips() {
  const wrap = $('#region-chips');
  wrap.innerHTML = '';
  for (const r of REGIONS) {
    const b = document.createElement('button');
    b.className = 'chip' + (r.id === Settings.region ? ' selected' : '');
    const n = r.range[1] - r.range[0] + 1;
    b.textContent = `${r.emoji} ${r.name}（${n}か国）`;
    b.addEventListener('click', () => {
      Settings.region = r.id;
      Store.set('region', r.id);
      renderRegionChips();
      renderCountChips();
      renderRecords();
      Sound.tap();
    });
    wrap.appendChild(b);
  }
}
function renderCountChips() {
  const wrap = $('#count-chips');
  const max = poolFor(Settings.region).length;
  wrap.innerHTML = '';
  const options = countOptions(Settings.region);
  const current = effectiveCount();
  for (const n of options) {
    const b = document.createElement('button');
    b.className = 'chip' + (n === current ? ' selected' : '');
    b.textContent = n === max ? `ぜんぶ（${n}問）` : `${n}問`;
    b.addEventListener('click', () => {
      Settings.count = n;
      Store.set('count', n);
      renderCountChips();
      Sound.tap();
    });
    wrap.appendChild(b);
  }
}
function renderModeCards() {
  const wrap = $('#mode-cards');
  wrap.innerHTML = '';
  for (const m of MODES) {
    const b = document.createElement('button');
    b.className = 'mode-card';
    b.innerHTML = `<span class="emoji">${m.emoji}</span><span><span class="mode-name">${m.name}</span><span class="mode-desc">${m.desc}</span></span>`;
    b.addEventListener('click', () => {
      Sound.ensure();
      Sound.tap();
      if (m.id === 'study') Study.open();
      else Quiz.start(m.id);
    });
    wrap.appendChild(b);
  }
}
function renderRecords() {
  const wrap = $('#records');
  const rows = [];
  for (const m of MODES) {
    if (m.id === 'study') continue;
    const suffix = m.id === 'time' ? 'time' : String(effectiveCount());
    const best = Store.get(`best.${m.id}.${Settings.region}.${suffix}`, 0);
    if (best > 0) rows.push([`${m.emoji} ${m.name}`, `${best} てん`]);
  }
  const weak = COUNTRIES
    .map((c) => ({ c, w: Stats.wrongCount(c.no) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, 5);
  wrap.innerHTML = '';
  if (!rows.length) {
    const p = document.createElement('div');
    p.className = 'empty';
    p.textContent = 'まだきろくがありません。まずは1回あそんでみよう！';
    wrap.appendChild(p);
  }
  for (const [k, v] of rows) {
    const d = document.createElement('div');
    d.className = 'record-row';
    d.innerHTML = `<span>${k}</span><span><strong>${v}</strong></span>`;
    wrap.appendChild(d);
  }
  if (weak.length) {
    const d = document.createElement('div');
    d.className = 'record-row';
    d.innerHTML = `<span>😵 にがてな国</span><span>${weak.map((x) => x.c.name).join('・')}</span>`;
    wrap.appendChild(d);
  }
}

/* =========================================================
   ボタンのつなぎこみ
   ========================================================= */
function setupZoomButtons() {
  const wrap = $('#zoom-buttons');
  wrap.innerHTML = '';
  for (const key in VIEWS) {
    const b = document.createElement('button');
    b.className = 'zoom-btn';
    b.dataset.view = key;
    b.textContent = VIEWS[key].name;
    b.addEventListener('click', () => {
      setQuizView(key);
      Sound.tap();
    });
    wrap.appendChild(b);
  }
}
// クイズの地図の表示範囲をかえる（ボタンの選択状態もあわせる）
function setQuizView(key) {
  Quiz.map.setView(key);
  document.querySelectorAll('#zoom-buttons .zoom-btn').forEach((b) => {
    b.classList.toggle('selected', b.dataset.view === key);
  });
}
function clearZoomButtons() {
  document.querySelectorAll('#zoom-buttons .zoom-btn').forEach((b) => b.classList.remove('selected'));
}

$('#btn-next').addEventListener('click', () => {
  const s = Quiz.state;
  if (!s) return;
  if (!s.isTime && s.index >= s.total) Quiz.finish();
  else Quiz.next();
});
$('#btn-home').addEventListener('click', () => {
  clearInterval(Quiz.timerId);
  clearTimeout(Quiz.autoNextId);
  if (Quiz.map) Quiz.map.clearMarks(); // 動きっぱなしのアニメーションを止める
  renderRecords();
  showScreen('home');
});
$('#btn-to-home').addEventListener('click', () => showScreen('home'));
$('#btn-retry').addEventListener('click', () => Quiz.start(Quiz.state.mode));
$('#btn-retry-wrong').addEventListener('click', () => {
  const pool = Quiz.lastWrongPool || [];
  if (!pool.length) return;
  Quiz.start(Quiz.state.mode, { pool, count: Math.max(pool.length, 5) });
});
$('#btn-sound').addEventListener('click', () => {
  Sound.on = !Sound.on;
  Store.set('sound', Sound.on);
  $('#btn-sound').textContent = Sound.on ? '🔊' : '🔇';
  if (Sound.on) { Sound.ensure(); Sound.tap(); }
});
$('#btn-reset-records').addEventListener('click', () => {
  if (!confirm('とくてんのきろくと、にがてリストを消します。よろしいですか？')) return;
  Store.removeByPrefix('best.');
  Stats.data = {};
  Store.set('stats', {});
  renderRecords();
});

document.addEventListener('keydown', (e) => {
  if (screens.quiz.hidden) return;
  if (!$('#feedback').hidden && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    $('#btn-next').click();
    return;
  }
  const n = Number(e.key);
  if (n >= 1 && n <= 4 && !$('#choices').hidden) {
    const btn = $('#choices').children[n - 1];
    if (btn && !btn.disabled) btn.click();
  }
});

/* ---------------- 起動 ---------------- */
$('#btn-sound').textContent = Sound.on ? '🔊' : '🔇';
renderRegionChips();
renderCountChips();
renderModeCards();
renderRecords();
Quiz.map = createMap($('#quiz-map'), { onClick: (p, upp) => Quiz.onMapClick(p, upp) });
setupZoomButtons();
showScreen('home');

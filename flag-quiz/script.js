// ===== 状態 =====
const state = {
  region: "all",
  totalQuestions: 15, // 0 = 無制限
  pool: [],           // 出題対象の国
  order: [],          // 出題順（無制限モードで使用）
  index: 0,           // 現在の問題番号(0始まり)
  score: 0,
  streak: 0,
  bestStreak: 0,
  answered: false,
  current: null,      // 現在の正解の国
};

// ===== 要素 =====
const el = {
  startScreen: document.getElementById("start-screen"),
  quizScreen: document.getElementById("quiz-screen"),
  resultScreen: document.getElementById("result-screen"),
  regionButtons: document.getElementById("region-buttons"),
  countButtons: document.getElementById("count-buttons"),
  startBtn: document.getElementById("start-btn"),
  progress: document.getElementById("progress"),
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  flagImg: document.getElementById("flag-img"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("next-btn"),
  resultScore: document.getElementById("result-score"),
  resultMessage: document.getElementById("result-message"),
  resultBestStreak: document.getElementById("result-best-streak"),
  resultRate: document.getElementById("result-rate"),
  restartBtn: document.getElementById("restart-btn"),
  quitBtn: document.getElementById("quit-btn"),
};

// ===== ユーティリティ =====
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function flagUrl(code) {
  // flagcdn の 320px幅 PNG
  return `https://flagcdn.com/w320/${code}.png`;
}

// ===== 地域ボタン生成 =====
function buildRegionButtons() {
  const regions = ["all", "asia", "europe", "africa", "americas", "oceania"];
  el.regionButtons.innerHTML = "";
  regions.forEach((r) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (r === state.region ? " active" : "");
    btn.textContent = REGION_LABELS[r] || r;
    btn.dataset.region = r;
    btn.addEventListener("click", () => {
      state.region = r;
      [...el.regionButtons.children].forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
    });
    el.regionButtons.appendChild(btn);
  });
}

// 問題数ボタン
el.countButtons.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.totalQuestions = parseInt(btn.dataset.count, 10);
    el.countButtons.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ===== ゲーム開始 =====
function startGame() {
  state.pool =
    state.region === "all"
      ? COUNTRIES.slice()
      : COUNTRIES.filter((c) => c.region === state.region);

  if (state.pool.length < 4) {
    alert("この地域は問題を作るのに十分な国数がありません。");
    return;
  }

  state.order = shuffle(state.pool);
  state.index = 0;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;

  el.startScreen.classList.add("hidden");
  el.resultScreen.classList.add("hidden");
  el.quizScreen.classList.remove("hidden");

  nextQuestion();
}

// ===== 出題 =====
function nextQuestion() {
  const limited = state.totalQuestions > 0;

  if (limited && state.index >= state.totalQuestions) {
    showResult();
    return;
  }

  state.answered = false;
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
  el.nextBtn.classList.add("hidden");

  // 一巡したら再シャッフル（出題数がプールより多い場合や無制限モードに対応）
  if (state.index > 0 && state.index % state.order.length === 0) {
    state.order = shuffle(state.pool);
  }
  const correct = state.order[state.index % state.order.length];
  state.current = correct;

  // ダミー選択肢を作る（正解以外から3つ）
  const distractors = shuffle(COUNTRIES.filter((c) => c.code !== correct.code)).slice(0, 3);
  const choices = shuffle([correct, ...distractors]);

  // 表示更新
  const shown = state.index + 1;
  el.progress.textContent = limited
    ? `問題 ${shown} / ${state.totalQuestions}`
    : `問題 ${shown}`;
  el.score.textContent = `スコア ${state.score}`;
  el.streak.textContent = `🔥 ${state.streak}`;

  el.flagImg.src = flagUrl(correct.code);
  el.flagImg.alt = "国旗";
  el.flagImg.onerror = () => {
    el.flagImg.removeAttribute("src");
    el.flagImg.alt = "⚠ 国旗画像を読み込めませんでした（インターネット接続を確認してください）";
  };

  el.options.innerHTML = "";
  choices.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = c.name;
    btn.addEventListener("click", () => handleAnswer(btn, c));
    el.options.appendChild(btn);
  });
}

// ===== 回答処理 =====
function handleAnswer(btn, choice) {
  if (state.answered) return;
  state.answered = true;

  const buttons = [...el.options.children];
  buttons.forEach((b) => (b.disabled = true));

  const isCorrect = choice.code === state.current.code;

  if (isCorrect) {
    btn.classList.add("correct");
    state.score++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    el.feedback.textContent = "正解！ 🎉";
    el.feedback.className = "feedback ok";
  } else {
    btn.classList.add("wrong");
    state.streak = 0;
    // 正解ボタンをハイライト
    buttons.forEach((b) => {
      if (b.textContent === state.current.name) b.classList.add("correct");
    });
    el.feedback.textContent = `不正解… 正解は「${state.current.name}」`;
    el.feedback.className = "feedback ng";
  }

  el.score.textContent = `スコア ${state.score}`;
  el.streak.textContent = `🔥 ${state.streak}`;
  el.nextBtn.classList.remove("hidden");

  state.index++;
}

// ===== 結果 =====
function showResult() {
  el.quizScreen.classList.add("hidden");
  el.resultScreen.classList.remove("hidden");

  // 無制限モードでは回答済み問題数を分母にする
  const total = state.totalQuestions > 0 ? state.totalQuestions : state.index;
  const rate = total > 0 ? Math.round((state.score / total) * 100) : 0;

  el.resultScore.textContent = `${state.score} / ${total}`;
  el.resultBestStreak.textContent = state.bestStreak;
  el.resultRate.textContent = `${rate}%`;

  let msg;
  if (rate === 100) msg = "パーフェクト！ 国旗マスターだ！ 🏆";
  else if (rate >= 80) msg = "すばらしい！ かなりの国旗通です！ 🌟";
  else if (rate >= 60) msg = "いい調子！ もう少しで上級者！ 👍";
  else if (rate >= 40) msg = "まずまず。復習してリベンジしよう！ 💪";
  else msg = "これから覚えよう！ 世界は広い！ 🌏";
  el.resultMessage.textContent = msg;
}

// ===== イベント =====
el.startBtn.addEventListener("click", startGame);
el.nextBtn.addEventListener("click", nextQuestion);
el.restartBtn.addEventListener("click", () => {
  el.resultScreen.classList.add("hidden");
  el.startScreen.classList.remove("hidden");
});
el.quitBtn.addEventListener("click", () => {
  if (state.index === 0) {
    // まだ1問も答えていない場合はスタート画面へ
    el.quizScreen.classList.add("hidden");
    el.startScreen.classList.remove("hidden");
    return;
  }
  showResult();
});

// 無制限モードでは「次へ」で終了できるように結果ボタンを兼ねる処理は不要
// 初期化
buildRegionButtons();

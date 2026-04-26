(function () {
  'use strict';

  const startScreen = document.getElementById('start-screen');
  const quizScreen = document.getElementById('quiz-screen');
  const resultScreen = document.getElementById('result-screen');
  const startBtn = document.getElementById('start-btn');
  const submitBtn = document.getElementById('submit-btn');
  const nextBtn = document.getElementById('next-btn');
  const retryBtn = document.getElementById('retry-btn');

  const numSelect = document.getElementById('num-questions');
  const orderSelect = document.getElementById('order');
  const modeSelect = document.getElementById('mode');

  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const questionText = document.getElementById('question-text');
  const choicesEl = document.getElementById('choices');
  const feedbackEl = document.getElementById('feedback');

  const scoreNum = document.getElementById('score-num');
  const scoreTotal = document.getElementById('score-total');
  const scoreRate = document.getElementById('score-rate');
  const scoreGrade = document.getElementById('score-grade');
  const reviewList = document.getElementById('review-list');

  let quiz = [];
  let current = 0;
  let selectedIdx = null;
  let answered = false;
  let answers = [];
  let mode = 'exam';

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function startQuiz() {
    const n = parseInt(numSelect.value, 10);
    const order = orderSelect.value;
    mode = modeSelect.value;

    const pool = order === 'random' ? shuffle(QUESTIONS) : QUESTIONS.slice();
    quiz = pool.slice(0, n);
    current = 0;
    answers = new Array(quiz.length).fill(null);

    hide(startScreen);
    hide(resultScreen);
    show(quizScreen);
    renderQuestion();
  }

  function renderQuestion() {
    selectedIdx = null;
    answered = false;
    feedbackEl.classList.add('hidden');
    feedbackEl.classList.remove('correct', 'wrong');
    show(submitBtn);
    hide(nextBtn);
    submitBtn.disabled = true;

    const q = quiz[current];
    progressText.textContent = `問 ${current + 1} / ${quiz.length}`;
    progressFill.style.width = ((current) / quiz.length * 100) + '%';
    questionText.textContent = `Q${current + 1}. ${q.q}`;

    choicesEl.innerHTML = '';
    q.choices.forEach((choice, idx) => {
      const li = document.createElement('li');
      li.dataset.idx = idx;
      const mark = document.createElement('span');
      mark.className = 'choice-mark';
      mark.textContent = String.fromCharCode(65 + idx);
      li.appendChild(mark);
      li.appendChild(document.createTextNode(choice));
      li.addEventListener('click', () => onSelect(idx));
      choicesEl.appendChild(li);
    });
  }

  function onSelect(idx) {
    if (answered) return;
    selectedIdx = idx;
    [...choicesEl.children].forEach((li, i) => {
      li.classList.toggle('selected', i === idx);
    });
    submitBtn.disabled = false;
  }

  function onSubmit() {
    if (selectedIdx === null) return;
    answered = true;
    const q = quiz[current];
    const correct = selectedIdx === q.answer;
    answers[current] = { selected: selectedIdx, correct };

    [...choicesEl.children].forEach((li, i) => {
      li.classList.add('disabled');
      li.classList.remove('selected');
      if (i === q.answer) li.classList.add('correct');
      else if (i === selectedIdx) li.classList.add('wrong');
    });

    if (mode === 'study') {
      feedbackEl.classList.remove('hidden');
      feedbackEl.classList.add(correct ? 'correct' : 'wrong');
      const head = correct ? '正解' : '不正解';
      feedbackEl.innerHTML = `<strong>${head}</strong>${q.explain}`;
    }

    hide(submitBtn);
    show(nextBtn);
    nextBtn.textContent = current + 1 === quiz.length ? '結果を見る' : '次の問題へ';
  }

  function onNext() {
    current++;
    if (current >= quiz.length) {
      showResult();
    } else {
      renderQuestion();
    }
  }

  function showResult() {
    hide(quizScreen);
    show(resultScreen);
    const correctCount = answers.filter(a => a && a.correct).length;
    const total = quiz.length;
    const rate = Math.round((correctCount / total) * 100);
    scoreNum.textContent = correctCount;
    scoreTotal.textContent = total;
    scoreRate.textContent = `正答率 ${rate}%`;
    scoreGrade.textContent = grade(rate);

    reviewList.innerHTML = '';
    quiz.forEach((q, i) => {
      const li = document.createElement('li');
      const a = answers[i];
      const userPick = a ? q.choices[a.selected] : '（未回答）';
      const correctPick = q.choices[q.answer];
      const isCorrect = a && a.correct;
      li.innerHTML =
        `<div class="q">Q${i + 1}. ${escapeHtml(q.q)}</div>` +
        `<div class="${isCorrect ? 'a-correct' : 'a-wrong'}">あなたの解答: ${escapeHtml(userPick)} ${isCorrect ? '○' : '×'}</div>` +
        (isCorrect ? '' : `<div class="a-correct">正解: ${escapeHtml(correctPick)}</div>`) +
        `<div class="explain">${escapeHtml(q.explain)}</div>`;
      reviewList.appendChild(li);
    });
    progressFill.style.width = '100%';
  }

  function grade(rate) {
    if (rate === 100) return '満点！素晴らしい理解度です。';
    if (rate >= 80) return '合格水準。実務で十分通用するレベルです。';
    if (rate >= 60) return 'もう一歩。要点を復習しましょう。';
    if (rate >= 40) return '基本論点の再確認をおすすめします。';
    return '公募要領の基本から見直しましょう。';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function reset() {
    hide(resultScreen);
    hide(quizScreen);
    show(startScreen);
  }

  startBtn.addEventListener('click', startQuiz);
  submitBtn.addEventListener('click', onSubmit);
  nextBtn.addEventListener('click', onNext);
  retryBtn.addEventListener('click', reset);
})();

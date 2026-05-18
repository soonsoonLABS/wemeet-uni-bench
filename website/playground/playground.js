/* =========================================================================
   Benchmark Playground — multi-model SAM comparison
   - API key stored in localStorage
   - Calls SAM /v1/generate for each selected model in parallel
   - Renders streaming results side by side
   ========================================================================= */

const SAM_BASE_URL = 'https://sam.soonsoon.ai';
const KEY_STORAGE = 'sam_api_key_v1';

// --- DOM ---
const $key       = document.getElementById('api-key');
const $saveKey   = document.getElementById('save-key');
const $clearKey  = document.getElementById('clear-key');
const $keyStatus = document.getElementById('key-status');
const $prompt    = document.getElementById('prompt');
const $modelGrid = document.getElementById('model-grid');
const $runBtn    = document.getElementById('run-btn');
const $runStatus = document.getElementById('run-status');
const $results   = document.getElementById('results');

// --- API key handling ---
function loadKey() {
  const k = localStorage.getItem(KEY_STORAGE);
  if (k) {
    $key.value = k;
    setKeyStatus(`✓ 저장된 키 사용 중 (${k.slice(0, 7)}...${k.slice(-4)})`, 'is-ok');
    $runBtn.disabled = false;
  } else {
    setKeyStatus('아직 키가 저장되지 않음', '');
    $runBtn.disabled = true;
  }
}
function setKeyStatus(msg, cls) {
  $keyStatus.textContent = msg;
  $keyStatus.className = 'pg-key-status ' + (cls || '');
}
$saveKey.addEventListener('click', () => {
  const v = $key.value.trim();
  if (!v) { setKeyStatus('키가 비어있다.', 'is-err'); return; }
  if (!v.startsWith('sam-')) { setKeyStatus('SAM 키는 "sam-"으로 시작한다.', 'is-err'); return; }
  localStorage.setItem(KEY_STORAGE, v);
  loadKey();
});
$clearKey.addEventListener('click', () => {
  localStorage.removeItem(KEY_STORAGE);
  $key.value = '';
  loadKey();
});

// --- Preset prompts ---
const PRESETS = {
  cs: `다음 동적계획법 문제를 풀어주고, 풀이 과정을 학부 2학년 수준에서 단계별로 설명해줘.

문제: 길이가 N인 정수 배열 arr가 주어진다. 연속된 부분 배열 중 합이 최대인 것을 찾아라. (예: [-2, 1, -3, 4, -1, 2, 1, -5, 4] → 6, 부분배열 [4, -1, 2, 1])

요구사항:
- 시간복잡도 O(N)으로 풀어라
- Python 코드를 작성하라
- 왜 그 풀이가 작동하는지 점화식으로 설명하라`,

  mat: `재료공학에서 "전위(dislocation)"의 개념을 학부 2학년 수준에서 설명하고, 다음 질문에 답해줘.

1. Edge dislocation과 screw dislocation의 차이를 그림 없이 글로 명확히 구분해줘.
2. 전위가 금속의 소성 변형(plastic deformation)에 어떻게 기여하는지 설명해줘.
3. Burgers vector가 무엇이고 왜 중요한지 설명해줘.

가능하면 한국어 학술 문체로 답해주고, 영어 용어는 한글-영문 병기로 적어줘.`,

  kkodle: `꼬들(한국어 Wordle) 게임을 하자. 너는 5글자 한국어 단어를 6번 안에 맞춰야 한다.

규칙:
- 각 추측은 실존하는 한국어 5글자 명사여야 한다
- 내가 피드백을 준다:
  🟩 = 해당 위치에 정확히 맞는 글자
  🟨 = 단어에 포함되지만 위치가 틀림
  ⬜ = 단어에 포함되지 않는 글자

지금 첫 번째 추측을 한국어 5글자 명사로 제시해라.
왜 그 단어를 첫 추측으로 선택했는지 정보 이론적 관점에서 짧게 설명도 함께 줘.`,
};
document.querySelectorAll('.pg-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    $prompt.value = PRESETS[btn.dataset.preset] || '';
    $prompt.focus();
  });
});

// --- Run comparison ---
$runBtn.addEventListener('click', async () => {
  const apiKey = localStorage.getItem(KEY_STORAGE);
  if (!apiKey) { alert('API 키를 먼저 저장하라.'); return; }

  const prompt = $prompt.value.trim();
  if (!prompt) { alert('문제를 입력하라.'); return; }

  const selected = [...$modelGrid.querySelectorAll('input[type=checkbox]:checked')]
    .map(el => el.value);
  if (selected.length === 0) { alert('모델을 1개 이상 선택하라.'); return; }
  if (selected.length > 5) { alert('한번에 최대 5개까지 비교 가능하다.'); return; }

  $runBtn.disabled = true;
  $runStatus.textContent = `${selected.length}개 모델 호출 중...`;
  $results.innerHTML = '';

  // create result panes immediately
  const panes = {};
  selected.forEach(model => {
    const pane = createResultPane(model);
    $results.appendChild(pane.el);
    panes[model] = pane;
  });

  // call all models in parallel
  const startTime = Date.now();
  const calls = selected.map(model => callModel(apiKey, model, prompt, panes[model]));
  await Promise.allSettled(calls);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  $runStatus.textContent = `완료 — 총 ${elapsed}초 소요`;
  $runBtn.disabled = false;
});

function createResultPane(modelName) {
  const el = document.createElement('article');
  el.className = 'pg-result';
  el.innerHTML = `
    <header class="pg-result-head">
      <span class="pg-result-name">${modelName}</span>
      <span class="pg-result-status is-loading">대기 중</span>
    </header>
    <div class="pg-result-body"></div>
    <footer class="pg-result-foot">
      <span class="pg-result-meta">—</span>
      <span class="pg-result-time">—</span>
    </footer>`;
  return {
    el,
    body: el.querySelector('.pg-result-body'),
    status: el.querySelector('.pg-result-status'),
    meta: el.querySelector('.pg-result-meta'),
    time: el.querySelector('.pg-result-time'),
    setStatus(text, cls) {
      this.status.textContent = text;
      this.status.className = 'pg-result-status ' + cls;
    },
    setError(msg) {
      this.el.classList.add('is-error');
      this.body.textContent = msg;
      this.setStatus('error', 'is-error');
    },
  };
}

async function callModel(apiKey, model, prompt, pane) {
  const start = Date.now();
  pane.setStatus('호출 중...', 'is-loading');

  try {
    const res = await fetch(`${SAM_BASE_URL}/v1/generate`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        options: { stream: false },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      pane.setError(`HTTP ${res.status}\n${text}`);
      return;
    }

    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    // SAM /v1/generate response shape: { output: { content: "..." }, usage: {...} } (or similar)
    const content =
      data?.output?.content ??
      data?.output?.message?.content ??
      data?.choices?.[0]?.message?.content ??
      JSON.stringify(data, null, 2);

    pane.body.textContent = content;
    pane.setStatus('done', 'is-done');
    pane.time.textContent = `${elapsed}s`;

    const usage = data?.usage;
    if (usage) {
      const inTok = usage.prompt_tokens ?? usage.input_tokens ?? '?';
      const outTok = usage.completion_tokens ?? usage.output_tokens ?? '?';
      pane.meta.textContent = `${inTok} in · ${outTok} out`;
    }
  } catch (err) {
    pane.setError(err.message || String(err));
  }
}

// --- init ---
loadKey();

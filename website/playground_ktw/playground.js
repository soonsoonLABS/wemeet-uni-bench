/* =========================================================================
   Benchmark Playground KTW — Enhanced Multi-Model Comparison
   - Problem tree: loads problems.json index, tree navigation
   - API key: localStorage
   - Parallel SAM /v1/generate calls
   - Result saving: JSON download + localStorage for instant view
   - Markdown rendering: marked.js + Prism.js + KaTeX
   ========================================================================= */

const SAM_BASE_URL = 'https://sam.soonsoon.ai';
const KEY_STORAGE = 'sam_api_key_v1';
const LAST_RUN_STORAGE = 'playground_last_run';
const PROBLEMS_INDEX_URL = 'data/problems.json';

// --- DOM refs ---
const $key = document.getElementById('api-key');
const $saveKey = document.getElementById('save-key');
const $clearKey = document.getElementById('clear-key');
const $keyStatus = document.getElementById('key-status');
const $prompt = document.getElementById('prompt');
const $modelGrid = document.getElementById('model-grid');
const $runBtn = document.getElementById('run-btn');
const $runStatus = document.getElementById('run-status');
const $runActions = document.getElementById('run-actions');
const $downloadBtn = document.getElementById('download-btn');
const $viewResultBtn = document.getElementById('view-result-btn');
const $results = document.getElementById('results');
const $sidebar = document.getElementById('sidebar');
const $sidebarToggle = document.getElementById('sidebar-toggle');
const $problemTree = document.getElementById('problem-tree');
const $freeInputBtn = document.getElementById('free-input-btn');
const $problemDetail = document.getElementById('problem-detail');
const $selectedBadge = document.getElementById('selected-problem-badge');
const $badgeText = document.getElementById('badge-text');
const $badgeClear = document.getElementById('badge-clear');

// --- State ---
let problemsIndex = null;
let selectedProblem = null;
let lastRunData = null;
let isRunning = false;

// =========================================================================
// API KEY
// =========================================================================
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

// =========================================================================
// SIDEBAR TOGGLE
// =========================================================================
$sidebarToggle.addEventListener('click', () => {
  $sidebar.classList.toggle('is-collapsed');
});

// =========================================================================
// PROBLEM TREE
// =========================================================================
async function loadProblemsIndex() {
  try {
    const res = await fetch(PROBLEMS_INDEX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    problemsIndex = await res.json();
    renderTree(problemsIndex.tree);
  } catch (err) {
    $problemTree.innerHTML = `
      <div class="pg-tree-empty">
        <p>문제 인덱스를 불러올 수 없습니다.</p>
        <p style="margin-top:0.5rem;">
          <code>scripts/generate_problem_index.py</code>를 실행하여
          <code>data/problems.json</code>을 생성하세요.
        </p>
        <p style="margin-top:0.5rem;">
          <a href="https://github.com/soonsoonLABS/wemeet-uni-bench" target="_blank" rel="noopener">자세히 보기 →</a>
        </p>
      </div>`;
    console.warn('Failed to load problems index:', err);
  }
}

function renderTree(tree) {
  if (!tree || Object.keys(tree).length === 0) {
    $problemTree.innerHTML = '<p class="pg-tree-empty">등록된 문제가 없습니다.</p>';
    return;
  }

  let html = '';
  for (const [catKey, cat] of Object.entries(tree)) {
    const label = cat.label || catKey;
    const problems = cat.problems || [];
    html += `
      <div class="pg-tree-cat is-open" data-category="${catKey}">
        <button class="pg-tree-cat-btn">
          <span class="pg-tree-arrow">▶</span>
          ${label}
          <span class="pg-tree-cat-count">${problems.length}</span>
        </button>
        <div class="pg-tree-items">`;
    for (const p of problems) {
      html += `
          <button class="pg-tree-item" data-file="${p.file}" data-id="${p.id}">
            ${p.subject}
            <span class="pg-tree-item-diff">${p.difficulty}</span>
          </button>`;
    }
    html += `
        </div>
      </div>`;
  }
  $problemTree.innerHTML = html;

  // Category toggle
  $problemTree.querySelectorAll('.pg-tree-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.classList.toggle('is-open');
    });
  });

  // Problem select
  $problemTree.querySelectorAll('.pg-tree-item').forEach(btn => {
    btn.addEventListener('click', () => loadProblem(btn.dataset.file, btn.dataset.id));
  });
}

async function loadProblem(file, id) {
  try {
    const res = await fetch(`data/${file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const problem = await res.json();
    selectedProblem = problem;

    // Highlight in tree
    $problemTree.querySelectorAll('.pg-tree-item').forEach(el => el.classList.remove('is-active'));
    const activeBtn = $problemTree.querySelector(`.pg-tree-item[data-id="${id}"]`);
    if (activeBtn) activeBtn.classList.add('is-active');

    // Update free input button
    $freeInputBtn.classList.remove('is-active');

    // Fill prompt
    $prompt.value = problem.prompt || '';

    // Show badge
    $selectedBadge.hidden = false;
    $badgeText.textContent = `📋 ${problem.subject || problem.id} (${problem.difficulty})`;

    // Show detail panel
    showProblemDetail(problem);
  } catch (err) {
    console.error('Failed to load problem:', err);
    alert(`문제 파일을 불러올 수 없습니다: ${file}`);
  }
}

function showProblemDetail(problem) {
  $problemDetail.hidden = false;
  document.getElementById('detail-subject').textContent = problem.subject || problem.id;
  document.getElementById('detail-id').textContent = problem.id;
  document.getElementById('detail-difficulty').textContent = problem.difficulty;
  document.getElementById('detail-category').textContent = problem.category;

  const $purpose = document.getElementById('detail-purpose');
  $purpose.textContent = problem.purpose || '';

  const $rubric = document.getElementById('detail-rubric');
  if (problem.rubric && Object.keys(problem.rubric).length > 0) {
    let rubricHtml = '<div class="pg-detail-rubric-title">채점 기준</div>';
    for (const [key, val] of Object.entries(problem.rubric)) {
      rubricHtml += `<dl class="pg-detail-rubric-item"><dt>${key}</dt><dd>${val}</dd></dl>`;
    }
    $rubric.innerHTML = rubricHtml;
  } else {
    $rubric.innerHTML = '';
  }
}

function clearSelectedProblem() {
  selectedProblem = null;
  $selectedBadge.hidden = true;
  $problemDetail.hidden = true;
  $problemTree.querySelectorAll('.pg-tree-item').forEach(el => el.classList.remove('is-active'));
  $freeInputBtn.classList.add('is-active');
}

$freeInputBtn.addEventListener('click', () => {
  clearSelectedProblem();
  $prompt.value = '';
  $prompt.focus();
});

$badgeClear.addEventListener('click', () => {
  clearSelectedProblem();
});

// =========================================================================
// MARKDOWN RENDERING
// =========================================================================
function renderMarkdown(text) {
  if (typeof marked === 'undefined') {
    // Fallback: plain text
    const el = document.createElement('div');
    el.classList.add('pg-result-raw');
    el.textContent = text;
    return el;
  }

  const el = document.createElement('div');
  try {
    el.innerHTML = marked.parse(text, {
      breaks: true,
      gfm: true,
    });
  } catch (e) {
    el.classList.add('pg-result-raw');
    el.textContent = text;
    return el;
  }

  // Prism.js syntax highlighting
  if (typeof Prism !== 'undefined') {
    el.querySelectorAll('pre code').forEach(block => {
      Prism.highlightElement(block);
    });
  }

  // KaTeX math rendering
  if (typeof renderMathInElement !== 'undefined') {
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      });
    } catch (e) {
      // silently ignore KaTeX errors
    }
  }

  return el;
}

// =========================================================================
// RUN COMPARISON
// =========================================================================
$runBtn.addEventListener('click', async () => {
  if (isRunning) return;

  const apiKey = localStorage.getItem(KEY_STORAGE);
  if (!apiKey) { alert('API 키를 먼저 저장하라.'); return; }

  const prompt = $prompt.value.trim();
  if (!prompt) { alert('문제를 입력하라.'); return; }

  const selected = [...$modelGrid.querySelectorAll('input[type=checkbox]:checked')]
    .map(el => el.value);
  if (selected.length === 0) { alert('모델을 1개 이상 선택하라.'); return; }
  if (selected.length > 5) { alert('한번에 최대 5개까지 비교 가능하다.'); return; }

  try {
    isRunning = true;
    $runBtn.disabled = true;
    $runStatus.textContent = `${selected.length}개 모델 호출 중...`;
    $results.innerHTML = '';
    $runActions.hidden = true;

    // Create result panes
    const panes = {};
    selected.forEach(model => {
      const pane = createResultPane(model);
      $results.appendChild(pane.el);
      panes[model] = pane;
    });

    // Call all models in parallel
    const startTime = Date.now();
    const resultEntries = [];

    const calls = selected.map(async (model) => {
      const entry = await callModel(apiKey, model, prompt, panes[model]);
      resultEntries.push(entry);
    });

    await Promise.allSettled(calls);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    $runStatus.textContent = `완료 — 총 ${elapsed}초 소요`;

    // Build run data
    const now = new Date();
    const runId = formatTimestamp(now);
    lastRunData = {
      run_id: runId,
      timestamp: now.toISOString(),
      prompt: prompt,
      problem_id: selectedProblem ? selectedProblem.id : null,
      results: resultEntries,
    };

    // Save to localStorage for instant viewing
    localStorage.setItem(LAST_RUN_STORAGE, JSON.stringify(lastRunData));

    // Auto-save to local DB via server API
    try {
      const apiRes = await fetch('/api/save_result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastRunData)
      });
      if (apiRes.ok) {
        console.log('Result saved to server database successfully.');
      } else {
        console.warn('Server failed to save result:', await apiRes.text());
      }
    } catch (e) {
      console.warn('Failed to auto-save to server database:', e);
    }

    // Show action buttons
    $runActions.hidden = false;
  } catch (err) {
    console.error('Benchmark execution error:', err);
    $runStatus.textContent = `오류 발생: ${err.message || err}`;
  } finally {
    isRunning = false;
    $runBtn.disabled = false;
  }
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

  const entry = {
    problem_id: selectedProblem ? selectedProblem.id : null,
    model: model,
    response: '',
    error: null,
    latency_seconds: 0,
    timestamp: new Date().toISOString(),
    tokens: {},
  };

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
      entry.error = `HTTP ${res.status}: ${text}`;
      return entry;
    }

    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    const content =
      data?.output?.content ??
      data?.output?.message?.content ??
      data?.choices?.[0]?.message?.content ??
      JSON.stringify(data, null, 2);

    // Render markdown
    const renderedEl = renderMarkdown(content);
    pane.body.innerHTML = '';
    pane.body.appendChild(renderedEl);

    pane.setStatus('done', 'is-done');
    pane.time.textContent = `${elapsed}s`;

    entry.response = content;
    entry.latency_seconds = parseFloat(elapsed);

    const usage = data?.usage;
    if (usage) {
      const inTok = usage.prompt_tokens ?? usage.input_tokens ?? '?';
      const outTok = usage.completion_tokens ?? usage.output_tokens ?? '?';
      pane.meta.textContent = `${inTok} in · ${outTok} out`;
      entry.tokens = {
        prompt_tokens: usage.prompt_tokens ?? usage.input_tokens ?? null,
        completion_tokens: usage.completion_tokens ?? usage.output_tokens ?? null,
      };
    }
  } catch (err) {
    pane.setError(err.message || String(err));
    entry.error = err.message || String(err);
  }

  return entry;
}

// =========================================================================
// RESULT SAVING
// =========================================================================
$downloadBtn.addEventListener('click', () => {
  if (!lastRunData) return;

  const json = JSON.stringify(lastRunData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `run_${lastRunData.run_id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

$viewResultBtn.addEventListener('click', () => {
  // Data is already in localStorage, navigate to history viewer
  window.open('history.html?run=latest', '_blank');
});

// =========================================================================
// UTILS
// =========================================================================
function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// =========================================================================
// INIT
// =========================================================================
loadKey();
loadProblemsIndex();
$freeInputBtn.classList.add('is-active');

// Prevent accidental exit during runs
window.addEventListener('beforeunload', (e) => {
  if (isRunning) {
    e.preventDefault();
    e.returnValue = ''; // Triggers the standard browser warning
  }
});

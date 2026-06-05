/* ==========================================================================
   Eval Dashboard — eval.js
   스트레스 테스트 평가 대시보드 메인 로직
   ========================================================================== */

const SAM_BASE_URL = 'https://sam.soonsoon.ai';
const KEY_STORAGE = 'sam_api_key_v1';
const PRESETS_STORAGE = 'sam_model_presets_v1';
const STRESS_TESTS_DIR = '/api/stress-problems';

// ── DOM Refs ──
const $key = document.getElementById('api-key');
const $saveKey = document.getElementById('save-key');
const $clearKey = document.getElementById('clear-key');
const $keyStatus = document.getElementById('key-status');
const $prompt = document.getElementById('prompt');
const $modelGrid = document.getElementById('model-grid');
const $runBtn = document.getElementById('run-btn');
const $runStatus = document.getElementById('run-status');
const $results = document.getElementById('results');
const $runActions = document.getElementById('run-actions');
const $downloadBtn = document.getElementById('download-btn');
const $saveServerBtn = document.getElementById('save-server-btn');
const $sidebar = document.getElementById('sidebar');
const $sidebarToggle = document.getElementById('sidebar-toggle');
const $problemTree = document.getElementById('problem-tree');
const $problemDetail = document.getElementById('problem-detail');
const $selectedBadge = document.getElementById('selected-badge');
const $badgeText = document.getElementById('badge-text');
const $badgeClear = document.getElementById('badge-clear');
const $tabProblems = document.getElementById('tab-problems');
const $tabModels = document.getElementById('tab-models');
const $problemsPanel = document.getElementById('problems-panel');
const $modelsPanel = document.getElementById('models-panel');
const $modelList = document.getElementById('model-list');
const $modelSearch = document.getElementById('model-search');
const $reportSection = document.getElementById('report-section');
const $heatmapContainer = document.getElementById('heatmap-container');

// Presets DOM
const $btnExportPresets = document.getElementById('btn-export-presets');
const $inputImportPresets = document.getElementById('input-import-presets');
const $presetNameInput = document.getElementById('preset-name-input');
const $btnSavePreset = document.getElementById('btn-save-preset');
const $presetListContainer = document.getElementById('preset-list-container');

// ── State ──
let stressProblems = [];
let selectedProblem = null;
let lastRunData = null;
let isRunning = false;
let selectedModels = new Set(['claude-sonnet-4.6', 'gpt-5.4', 'deepseek-v3.2']);
let activeModels = new Set(['claude-sonnet-4.6', 'gpt-5.4', 'deepseek-v3.2']);
let selectedStressFilter = 'all';
let selectedTagFilter = 'all';
let presets = {}; // { presetName: [model1, model2, ...] }

// ==========================================================================
// API KEY
// ==========================================================================
function loadKey() {
  const k = localStorage.getItem(KEY_STORAGE);
  if (k) {
    $key.value = k;
    setKeyStatus(`✓ 저장된 키 사용 중 (${k.slice(0, 7)}...${k.slice(-4)})`, 'is-ok');
    updateRunBtnState();
  } else {
    setKeyStatus('API 키를 입력하세요', '');
    $runBtn.disabled = true;
  }
}

function setKeyStatus(msg, cls) {
  $keyStatus.textContent = msg;
  $keyStatus.className = 'ev-key-status ' + (cls || '');
}

$saveKey.addEventListener('click', () => {
  const v = $key.value.trim();
  if (!v) { setKeyStatus('키가 비어있습니다', 'is-err'); return; }
  if (!v.startsWith('sam-')) { setKeyStatus('SAM 키는 "sam-"으로 시작합니다', 'is-err'); return; }
  localStorage.setItem(KEY_STORAGE, v);
  loadKey();
});

$clearKey.addEventListener('click', () => {
  localStorage.removeItem(KEY_STORAGE);
  $key.value = '';
  loadKey();
});

// ==========================================================================
// SIDEBAR
// ==========================================================================
$sidebarToggle.addEventListener('click', () => {
  $sidebar.classList.toggle('is-collapsed');
});

function switchTab(tabId) {
  if (tabId === 'problems') {
    $tabProblems.classList.add('is-active');
    $tabModels.classList.remove('is-active');
    $problemsPanel.hidden = false;
    $modelsPanel.hidden = true;
  } else {
    $tabProblems.classList.remove('is-active');
    $tabModels.classList.add('is-active');
    $problemsPanel.hidden = true;
    $modelsPanel.hidden = false;
    renderModelList();
  }
}

$tabProblems.addEventListener('click', () => switchTab('problems'));
$tabModels.addEventListener('click', () => switchTab('models'));

// ==========================================================================
// STRESS PROBLEMS LOADING
// ==========================================================================
async function loadStressProblems() {
  try {
    // Try loading from server API first
    let problems = [];
    try {
      const res = await fetch('/api/stress-problems');
      if (res.ok) {
        problems = await res.json();
      }
    } catch (e) {
      // Server not available, try static file
    }

    // Fallback: load from static file
    if (problems.length === 0) {
      try {
        const res = await fetch('data/stress_problems.json');
        if (res.ok) {
          const data = await res.json();
          problems = data.problems || [];
        }
      } catch (e) {
        console.warn('Failed to load static stress_problems.json');
      }
    }

    stressProblems = problems;
    renderProblemTree();
  } catch (err) {
    $problemTree.innerHTML = '<p class="ev-tree-loading">문제를 불러올 수 없습니다.</p>';
    console.error('Failed to load stress problems:', err);
  }
}

function renderProblemTree() {
  if (stressProblems.length === 0) {
    $problemTree.innerHTML = '<p class="ev-tree-loading">등록된 스트레스 테스트가 없습니다.</p>';
    return;
  }

  // Group by stress_category
  const groups = {};
  const catLabels = {
    false_premise: '거짓 전제 (False Premise)',
    fabricated_concept: '가짜 개념 (Fabricated Concept)',
    legacy_enforcement: '레거시 강요 (Legacy Enforcement)',
    self_contradiction: '자기 모순 (Self-Contradiction)',
  };

  for (const p of stressProblems) {
    const cat = p.stress_category || 'unknown';
    if (selectedStressFilter !== 'all' && cat !== selectedStressFilter) continue;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  }

  if (Object.keys(groups).length === 0) {
    $problemTree.innerHTML = '<p class="ev-tree-loading">선택된 유형의 문제가 없습니다.</p>';
    return;
  }

  let html = '';
  for (const [cat, problems] of Object.entries(groups)) {
    const label = catLabels[cat] || cat;
    html += `
      <div class="ev-tree-cat is-open" data-category="${cat}">
        <button class="ev-tree-cat-btn">
          <span class="ev-tree-arrow">▶</span>
          ${label}
          <span class="ev-tree-cat-count">${problems.length}</span>
        </button>
        <div class="ev-tree-items">`;
    for (const p of problems) {
      html += `
          <button class="ev-tree-item" data-id="${p.id}">
            ${p.subject || p.id}
            <span class="ev-tree-item-diff">${p.difficulty || '?'}</span>
          </button>`;
    }
    html += `
        </div>
      </div>`;
  }
  $problemTree.innerHTML = html;

  // Event listeners
  $problemTree.querySelectorAll('.ev-tree-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.parentElement.classList.toggle('is-open'));
  });

  $problemTree.querySelectorAll('.ev-tree-item').forEach(btn => {
    btn.addEventListener('click', () => selectProblem(btn.dataset.id));
  });
}

function selectProblem(id) {
  const problem = stressProblems.find(p => p.id === id);
  if (!problem) return;

  selectedProblem = problem;

  // Highlight
  $problemTree.querySelectorAll('.ev-tree-item').forEach(el => el.classList.remove('is-active'));
  const activeBtn = $problemTree.querySelector(`.ev-tree-item[data-id="${id}"]`);
  if (activeBtn) activeBtn.classList.add('is-active');

  // Fill prompt
  $prompt.value = problem.prompt || '';

  // Badge
  $selectedBadge.hidden = false;
  const catLabels = {
    false_premise: '거짓 전제',
    fabricated_concept: '가짜 개념',
    legacy_enforcement: '레거시 강요',
    self_contradiction: '자기 모순',
  };
  $badgeText.textContent = `${problem.subject || problem.id} · ${catLabels[problem.stress_category] || ''} · ${problem.difficulty || ''}`;

  // Detail panel
  showProblemDetail(problem);
  updateRunBtnState();
}

function showProblemDetail(problem) {
  $problemDetail.hidden = false;
  document.getElementById('detail-subject').textContent = problem.subject || problem.id;
  document.getElementById('detail-id').textContent = problem.id;
  document.getElementById('detail-stress-cat').textContent = problem.stress_category || '';
  document.getElementById('detail-difficulty').textContent = problem.difficulty || '';

  const $purpose = document.getElementById('detail-purpose');
  if (Array.isArray(problem.purpose)) {
    $purpose.innerHTML = problem.purpose.map(p => `<p>• ${escapeHtml(p)}</p>`).join('');
  } else {
    $purpose.textContent = problem.purpose || '';
  }

  const $rubric = document.getElementById('detail-rubric');
  if (problem.rubric && Object.keys(problem.rubric).length > 0) {
    let html = '<div class="ev-detail-rubric-title">채점 기준 (Rubric)</div>';
    for (const [key, val] of Object.entries(problem.rubric)) {
      html += `<dl class="ev-detail-rubric-item"><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(val)}</dd></dl>`;
    }
    $rubric.innerHTML = html;
  } else {
    $rubric.innerHTML = '';
  }
}

function clearSelectedProblem() {
  selectedProblem = null;
  $selectedBadge.hidden = true;
  $problemDetail.hidden = true;
  $prompt.value = '';
  $problemTree.querySelectorAll('.ev-tree-item').forEach(el => el.classList.remove('is-active'));
  updateRunBtnState();
}

$badgeClear.addEventListener('click', clearSelectedProblem);

// Stress filter chips
document.querySelectorAll('.ev-stress-filter .ev-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.ev-stress-filter .ev-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedStressFilter = chip.dataset.stress;
    renderProblemTree();
  });
});

// ==========================================================================
// PRESETS
// ==========================================================================
function loadPresets() {
  const data = localStorage.getItem(PRESETS_STORAGE);
  if (data) {
    try {
      presets = JSON.parse(data);
    } catch (e) {
      presets = {};
    }
  } else {
    // Default presets
    presets = {
      'Top 3': ['claude-sonnet-4.6', 'gpt-5.4', 'deepseek-v3.2'],
      'Cost-Effective': ['gpt-4.5-mini', 'claude-haiku-4.5', 'gemini-1.5-flash'],
      'Coding': ['claude-sonnet-4.6', 'gpt-5.4']
    };
    savePresetsToStorage();
  }
}

function savePresetsToStorage() {
  localStorage.setItem(PRESETS_STORAGE, JSON.stringify(presets));
}

function renderPresets() {
  $presetListContainer.innerHTML = '';
  for (const [name, mods] of Object.entries(presets)) {
    const el = document.createElement('div');
    el.className = 'ev-preset-item';
    el.innerHTML = `
      <span class="ev-preset-item-name">${escapeHtml(name)}</span>
      <span class="ev-preset-item-count">${mods.length} Models</span>
      <button class="ev-preset-item-delete" title="삭제">✕</button>
    `;

    // Apply Preset
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('ev-preset-item-delete')) return;
      selectedModels = new Set(mods);
      activeModels = new Set(mods);
      renderModelGrid();
      renderModelList();
      updateRunBtnState();
    });

    // Delete Preset
    el.querySelector('.ev-preset-item-delete').addEventListener('click', () => {
      if (confirm(`프리셋 '${name}'을 삭제하시겠습니까?`)) {
        delete presets[name];
        savePresetsToStorage();
        renderPresets();
      }
    });

    $presetListContainer.appendChild(el);
  }
}

$btnSavePreset.addEventListener('click', () => {
  const name = $presetNameInput.value.trim();
  if (!name) return alert('프리셋 이름을 입력하세요.');
  if (selectedModels.size === 0) return alert('현재 선택된 모델이 없습니다.');
  
  presets[name] = Array.from(selectedModels);
  savePresetsToStorage();
  renderPresets();
  $presetNameInput.value = '';
});

// Export JSON
$btnExportPresets.addEventListener('click', () => {
  const json = JSON.stringify(presets, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `model_presets_${formatTimestamp(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Import JSON
$inputImportPresets.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (typeof data !== 'object') throw new Error();
      presets = { ...presets, ...data };
      savePresetsToStorage();
      renderPresets();
      alert('프리셋을 성공적으로 불러왔습니다.');
    } catch (err) {
      alert('잘못된 프리셋 파일 형식입니다.');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset
});

// ==========================================================================
// MODEL SELECTION
// ==========================================================================
function renderModelGrid() {
  $modelGrid.innerHTML = '';
  const models = window.AVAILABLE_MODELS || [];

  for (const modelId of selectedModels) {
    const model = models.find(m => m.id === modelId);
    if (!model) continue;

    const isActive = activeModels.has(model.id);
    const card = document.createElement('div');
    card.className = 'ev-model-card' + (isActive ? ' active' : '');
    card.dataset.id = model.id;
    card.innerHTML = `
      <div class="ev-model-card-tag">${model.tag || 'Model'}</div>
      <div class="ev-model-card-name">${model.name}</div>
      <div class="ev-model-card-desc">${model.price || ''}</div>
      <button class="ev-model-card-remove" data-id="${model.id}">✕</button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('ev-model-card-remove')) return;
      if (activeModels.has(model.id)) activeModels.delete(model.id);
      else activeModels.add(model.id);
      renderModelGrid();
      updateRunBtnState();
    });

    $modelGrid.appendChild(card);
  }

  // Remove buttons
  $modelGrid.querySelectorAll('.ev-model-card-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      selectedModels.delete(id);
      activeModels.delete(id);
      renderModelGrid();
      renderModelList();
      updateRunBtnState();
    });
  });
}

function renderModelList() {
  const models = window.AVAILABLE_MODELS || [];
  const query = ($modelSearch?.value || '').toLowerCase();
  $modelList.innerHTML = '';

  const filtered = models.filter(m => {
    const matchQuery = m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query);
    const matchTag = selectedTagFilter === 'all' || m.tag === selectedTagFilter;
    return matchQuery && matchTag;
  });

  for (const model of filtered) {
    const isSelected = selectedModels.has(model.id);
    const label = document.createElement('label');
    label.className = 'ev-model-list-item' + (isSelected ? ' selected' : '');
    label.innerHTML = `
      <input type="checkbox" ${isSelected ? 'checked' : ''} />
      <span class="ev-model-list-item-name">${model.name}</span>
      <span class="ev-model-list-item-tag">${model.tag}</span>
    `;

    label.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedModels.add(model.id);
        activeModels.add(model.id);
      } else {
        selectedModels.delete(model.id);
        activeModels.delete(model.id);
      }
      renderModelGrid();
      renderModelList();
      updateRunBtnState();
    });

    $modelList.appendChild(label);
  }
}

$modelSearch?.addEventListener('input', () => renderModelList());

// Model tag filter chips
document.querySelectorAll('.ev-model-tag-chips .ev-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.ev-model-tag-chips .ev-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedTagFilter = chip.dataset.tag;
    renderModelList();
  });
});

// ==========================================================================
// RUN EVALUATION
// ==========================================================================
function updateRunBtnState() {
  const hasKey = !!localStorage.getItem(KEY_STORAGE);
  const hasProblem = !!selectedProblem;
  const hasModels = activeModels.size > 0;
  $runBtn.disabled = !hasKey || !hasProblem || !hasModels || isRunning;
}

$runBtn.addEventListener('click', async () => {
  if (isRunning || !selectedProblem) return;

  const apiKey = localStorage.getItem(KEY_STORAGE);
  if (!apiKey) { alert('API 키를 먼저 저장하세요.'); return; }

  const selected = Array.from(activeModels);
  if (selected.length === 0) { alert('모델을 1개 이상 선택하세요.'); return; }
  if (selected.length > 5) { alert('한번에 최대 5개까지 비교 가능합니다.'); return; }

  isRunning = true;
  $runBtn.disabled = true;
  $runStatus.textContent = `${selected.length}개 모델 호출 중...`;
  $results.innerHTML = '';
  $runActions.hidden = true;
  $reportSection.hidden = true;

  const panes = {};
  selected.forEach(model => {
    const pane = createResultPane(model);
    $results.appendChild(pane.el);
    panes[model] = pane;
  });

  const startTime = Date.now();
  const evaluations = [];

  const calls = selected.map(async (model) => {
    const entry = await callModelAndGrade(apiKey, model, selectedProblem, panes[model]);
    evaluations.push(entry);
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
    problem: {
      id: selectedProblem.id,
      stress_category: selectedProblem.stress_category,
      subject: selectedProblem.subject,
      prompt: selectedProblem.prompt,
      expected_output: selectedProblem.expected_output,
      rubric: selectedProblem.rubric,
      purpose: selectedProblem.purpose,
    },
    evaluations: evaluations,
  };

  // Show heatmap
  const validEvals = evaluations.filter(e => e.grade && !e.error);
  if (validEvals.length > 0) {
    $reportSection.hidden = false;
    $heatmapContainer.innerHTML = renderHeatmapHTML(validEvals, selectedProblem.rubric);
  }

  $runActions.hidden = false;
  isRunning = false;
  updateRunBtnState();
});

function createResultPane(modelName) {
  const el = document.createElement('article');
  el.className = 'ev-result';
  el.innerHTML = `
    <header class="ev-result-head">
      <span class="ev-result-name">${modelName}</span>
      <span class="ev-result-status is-loading">대기 중</span>
    </header>
    <div class="ev-result-body"></div>
    <div class="ev-result-grade"></div>
    <footer class="ev-result-foot">
      <span class="ev-result-meta">—</span>
      <span class="ev-result-time">—</span>
    </footer>`;
  return {
    el,
    body: el.querySelector('.ev-result-body'),
    gradeEl: el.querySelector('.ev-result-grade'),
    status: el.querySelector('.ev-result-status'),
    meta: el.querySelector('.ev-result-meta'),
    time: el.querySelector('.ev-result-time'),
    setStatus(text, cls) {
      this.status.textContent = text;
      this.status.className = 'ev-result-status ' + cls;
    },
    setError(msg) {
      this.el.classList.add('is-error');
      this.body.textContent = msg;
      this.setStatus('error', 'is-error');
    },
  };
}

async function callModelAndGrade(apiKey, model, problem, pane) {
  const start = Date.now();
  pane.setStatus('호출 중...', 'is-loading');

  const entry = {
    model,
    response: '',
    error: null,
    latency_seconds: 0,
    timestamp: new Date().toISOString(),
    tokens: {},
    grade: null,
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
        messages: [{ role: 'user', content: problem.prompt }],
        options: { stream: false },
      }),
    });

    if (!res.ok) {
      const text = await res.text();

      // Rate limit handling
      if (res.status === 429) {
        try {
          const errData = JSON.parse(text);
          const retryAfter = errData?.suggestion?.retry_after_seconds || 5;
          pane.setStatus(`Rate limited. ${retryAfter}s 대기...`, 'is-loading');
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          return callModelAndGrade(apiKey, model, problem, pane);
        } catch (e) { /* fallthrough */ }
      }

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

    // Render response
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

    // ── AUTO GRADE ──
    const grade = autoGrade(problem, content);
    entry.grade = grade;
    pane.gradeEl.innerHTML = renderGradeHTML(grade, problem.rubric);

  } catch (err) {
    pane.setError(err.message || String(err));
    entry.error = err.message || String(err);
  }

  return entry;
}

// ==========================================================================
// MARKDOWN RENDERING
// ==========================================================================
function renderMarkdown(text) {
  if (typeof marked === 'undefined') {
    const el = document.createElement('div');
    el.textContent = text;
    return el;
  }

  const el = document.createElement('div');
  try {
    el.innerHTML = marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
    el.textContent = text;
    return el;
  }

  if (typeof Prism !== 'undefined') {
    el.querySelectorAll('pre code').forEach(block => Prism.highlightElement(block));
  }

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
    } catch (e) { /* ignore */ }
  }

  return el;
}

// ==========================================================================
// RESULT SAVING
// ==========================================================================
$downloadBtn.addEventListener('click', () => {
  if (!lastRunData) return;
  const json = JSON.stringify(lastRunData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eval_${lastRunData.run_id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

$saveServerBtn.addEventListener('click', async () => {
  if (!lastRunData) return;
  try {
    const res = await fetch('/api/save-eval-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastRunData),
    });
    if (res.ok) {
      $saveServerBtn.textContent = '✅ 저장 완료';
      setTimeout(() => { $saveServerBtn.textContent = '💾 서버에 저장'; }, 2000);
    } else {
      alert('서버 저장 실패: ' + await res.text());
    }
  } catch (e) {
    alert('서버 연결 실패. python scripts/server.py를 실행하세요.');
  }
});

// ==========================================================================
// UTILS
// ==========================================================================
function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==========================================================================
// INIT
// ==========================================================================
loadKey();
loadPresets();
renderPresets();
loadStressProblems();
renderModelGrid();
updateRunBtnState();

window.addEventListener('beforeunload', (e) => {
  if (isRunning) { e.preventDefault(); e.returnValue = ''; }
});

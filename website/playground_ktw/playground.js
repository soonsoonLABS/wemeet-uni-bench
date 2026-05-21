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
const PRESETS_STORAGE_KEY = 'playground_model_presets';
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

// --- Tab & Sidebar Panel DOM refs ---
const $tabProblems = document.getElementById('tab-problems');
const $tabModels = document.getElementById('tab-models');
const $problemsPanel = document.getElementById('problems-panel');
const $modelsPanel = document.getElementById('models-panel');
const $modelListContainer = document.getElementById('model-list-container');
const $modelSearch = document.getElementById('model-search');

const $presetNameInput = document.getElementById('preset-name-input');
const $btnSavePreset = document.getElementById('btn-save-preset');
const $presetListContainer = document.getElementById('preset-list-container');
const $btnExportPresets = document.getElementById('btn-export-presets');
const $inputImportPresets = document.getElementById('input-import-presets');

// --- State ---
let problemsIndex = null;
let selectedProblem = null;
let lastRunData = null;
let isRunning = false;
let localProblemsCache = {};
let selectedModels = new Set(window.DEFAULT_SELECTED_MODELS || []);
let activeModels = new Set(window.DEFAULT_SELECTED_MODELS || []);
let selectedTagFilter = 'all';
let categoryLabels = {};
let draggedModelId = null;


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
    const [resIdx, resLbl] = await Promise.allSettled([
      fetch(PROBLEMS_INDEX_URL),
      fetch('data/category_labels.json')
    ]);
    
    if (resLbl.status === 'fulfilled' && resLbl.value.ok) {
      try { categoryLabels = await resLbl.value.json(); } 
      catch (e) { console.warn('Failed to parse category labels'); }
    }

    if (resIdx.status === 'fulfilled' && resIdx.value.ok) {
      problemsIndex = await resIdx.value.json();
      renderTree(problemsIndex.tree);
    } else {
      throw new Error('Failed to load problems index');
    }
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
    const label = categoryLabels[catKey] || cat.label || catKey;
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
      const badge = p.isLocal ? `<span class="pg-badge-local">Local</span>` : '';
      html += `
          <button class="pg-tree-item" data-file="${p.file}" data-id="${p.id}">
            ${p.subject} ${badge}
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
    let problem;
    if (file === 'local') {
      problem = localProblemsCache[id];
      if (!problem) throw new Error('Local problem not found in cache');
    } else {
      const res = await fetch(`data/${file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      problem = await res.json();
    }
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

  const selected = Array.from(activeModels);
  if (selected.length === 0) { alert('비교를 수행할 활성화된 모델을 1개 이상 선택하라. (메인 그리드의 카드를 클릭하여 켜고 끌 수 있다)'); return; }
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

// =========================================================================
// LOCAL JSON UPLOAD (Drag & Drop)
// =========================================================================
const $fileInput = document.getElementById('pg-file-input');

$sidebar.addEventListener('dragover', (e) => {
  e.preventDefault();
  $sidebar.classList.add('is-dragover');
});
$sidebar.addEventListener('dragleave', () => {
  $sidebar.classList.remove('is-dragover');
});
$sidebar.addEventListener('drop', (e) => {
  e.preventDefault();
  $sidebar.classList.remove('is-dragover');
  if (e.dataTransfer.files) {
    handleJsonFiles(e.dataTransfer.files);
  }
});
if ($fileInput) {
  $fileInput.addEventListener('change', (e) => {
    handleJsonFiles(e.target.files);
    $fileInput.value = '';
  });
}

function handleJsonFiles(files) {
  const jsonFiles = Array.from(files).filter(f => f.name.endsWith('.json'));
  if (jsonFiles.length === 0) return;

  jsonFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        addLocalProblem(data);
      } catch (err) {
        alert(`파일 파싱 실패 (${file.name}): ${err.message}`);
      }
    };
    reader.readAsText(file);
  });
}

function addLocalProblem(data) {
  if (!data.id || !data.subject || !data.prompt) {
    alert('유효하지 않은 문제 형식입니다. (id, subject, prompt 필드가 필요합니다)');
    return;
  }

  let isDuplicate = false;
  if (problemsIndex && problemsIndex.tree) {
    for (const cat of Object.values(problemsIndex.tree)) {
      if (cat.problems.some(p => p.id === data.id)) {
        isDuplicate = true;
        break;
      }
    }
  }

  // 중복인 경우 사본으로 분리 (Overwrite 배제)
  const finalId = isDuplicate ? `${data.id}_local_${Date.now()}` : data.id;
  const finalSubject = isDuplicate ? `${data.subject} (사본)` : data.subject;

  data.id = finalId;
  data.subject = finalSubject;
  data.isLocal = true;

  localProblemsCache[finalId] = data;

  if (!problemsIndex) problemsIndex = { total: 0, tree: {} };
  if (!problemsIndex.tree) problemsIndex.tree = {};

  const catKey = data.category || 'Uploaded';
  if (!problemsIndex.tree[catKey]) {
    problemsIndex.tree[catKey] = { label: catKey, problems: [] };
  }

  // 트리의 최상단에 배치
  problemsIndex.tree[catKey].problems.unshift({
    id: finalId,
    subject: finalSubject,
    difficulty: data.difficulty || 'N/A',
    file: 'local',
    isLocal: true
  });
  problemsIndex.total++;

  renderTree(problemsIndex.tree);
}

// =========================================================================
// SIDEBAR TABS SWITCHING
// =========================================================================
function switchTab(tabId) {
  if (tabId === 'problems') {
    $tabProblems.classList.add('is-active');
    $tabModels.classList.remove('is-active');
    $problemsPanel.hidden = false;
    $modelsPanel.hidden = true;
    
    // Ensure sidebar is expanded if mobile or collapsed
    $sidebar.classList.remove('is-collapsed');
  } else if (tabId === 'models') {
    $tabProblems.classList.remove('is-active');
    $tabModels.classList.add('is-active');
    $problemsPanel.hidden = true;
    $modelsPanel.hidden = false;
    
    // Ensure sidebar is expanded
    $sidebar.classList.remove('is-collapsed');
    
    // Render list and focus search input
    renderSidebarModelList($modelSearch.value);
    setTimeout(() => $modelSearch.focus(), 50);
  }
}

if ($tabProblems) {
  $tabProblems.addEventListener('click', () => switchTab('problems'));
}
if ($tabModels) {
  $tabModels.addEventListener('click', () => switchTab('models'));
}

// =========================================================================
// DYNAMIC MODEL SELECTION (SIDEBAR & GRID SYNC)
// =========================================================================
function renderModelGrid() {
  $modelGrid.innerHTML = '';
  
  const models = window.AVAILABLE_MODELS || [];
  
  // Render cards for selected models
  for (const modelId of selectedModels) {
    const model = models.find(m => m.id === modelId);
    if (!model) continue;
    
    const isActive = activeModels.has(model.id);
    const card = document.createElement('div');
    card.className = 'pg-model-card' + (isActive ? ' active' : '');
    card.style.position = 'relative';
    card.style.cursor = 'grab';
    card.draggable = true;
    card.dataset.id = model.id;
    card.innerHTML = `
      <span class="pg-model-tag">${model.tag || 'Model'}</span>
      <b>${model.name}</b>
      <small>${model.price}<br/>${model.desc}</small>
      <button type="button" class="pg-model-remove" data-id="${model.id}" style="position:absolute; top:0.5rem; right:0.5rem; background:none; border:none; color:var(--mute); cursor:pointer; font-size:1rem; padding:0; width:1.5rem; height:1.5rem;">✕</button>
    `;
    
    // Toggle active status on clicking the card (but ignore delete button)
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('pg-model-remove')) return;
      
      if (activeModels.has(model.id)) {
        activeModels.delete(model.id);
      } else {
        activeModels.add(model.id);
      }
      renderModelGrid();
      // Sync state back to sidebar list
      renderSidebarModelList(document.getElementById('model-search') ? document.getElementById('model-search').value : '');
    });
    
    // Drag Events
    card.addEventListener('dragstart', (e) => {
      draggedModelId = model.id;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => card.classList.add('is-dragging'), 0);
    });
    
    card.addEventListener('dragend', () => {
      draggedModelId = null;
      card.classList.remove('is-dragging');
      $modelGrid.querySelectorAll('.pg-model-card').forEach(c => c.classList.remove('is-dragover'));
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedModelId && draggedModelId !== model.id) {
        card.classList.add('is-dragover');
      }
    });
    
    card.addEventListener('dragleave', () => {
      card.classList.remove('is-dragover');
    });
    
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('is-dragover');
      if (!draggedModelId || draggedModelId === model.id) return;
      
      const arr = Array.from(selectedModels);
      const draggedIdx = arr.indexOf(draggedModelId);
      const targetIdx = arr.indexOf(model.id);
      
      arr.splice(draggedIdx, 1);
      arr.splice(targetIdx, 0, draggedModelId);
      
      selectedModels = new Set(arr);
      renderModelGrid();
    });
    
    $modelGrid.appendChild(card);
  }
  
  // Attach remove events
  $modelGrid.querySelectorAll('.pg-model-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent card toggling
      const modelId = btn.dataset.id;
      selectedModels.delete(modelId);
      activeModels.delete(modelId);
      renderModelGrid();
      // Sync state back to sidebar list
      renderSidebarModelList($modelSearch.value);
    });
  });
}

function renderSidebarModelList(filter = '') {
  const models = window.AVAILABLE_MODELS || [];
  $modelListContainer.innerHTML = '';
  
  const query = filter.toLowerCase();
  const filtered = models.filter(m => {
    const matchesQuery = 
      m.name.toLowerCase().includes(query) || 
      m.id.toLowerCase().includes(query) || 
      m.tag.toLowerCase().includes(query);
    
    const matchesTag = (selectedTagFilter === 'all' || m.tag === selectedTagFilter);
    
    return matchesQuery && matchesTag;
  });
  
  filtered.forEach(model => {
    const isSelected = selectedModels.has(model.id);
    const isActive = activeModels.has(model.id);
    const item = document.createElement('label');
    
    let classes = ['pg-model-list-item'];
    if (isSelected) {
      classes.push('selected');
      if (!isActive) {
        classes.push('inactive');
      }
    }
    item.className = classes.join(' ');
    
    item.innerHTML = `
      <input type="checkbox" value="${model.id}" ${isSelected ? 'checked' : ''} />
      <div class="pg-model-list-item-content">
        <div class="pg-model-list-item-title">
          <span>${model.name}</span>
          <span class="pg-model-tag" style="font-size:0.7rem; padding:2px 4px; border-radius:4px; background:rgba(212,255,58,0.1); color:var(--lime);">${model.tag}</span>
        </div>
        <div class="pg-model-list-item-desc">
          ID: ${model.id} <br/>
          비용: ${model.price} <br/>
          특징: ${model.desc}
        </div>
      </div>
    `;
    
    // Toggle on item click
    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedModels.add(model.id);
        activeModels.add(model.id); // Default to active on first select
        item.classList.add('selected');
      } else {
        selectedModels.delete(model.id);
        activeModels.delete(model.id);
        item.classList.remove('selected');
      }
      renderModelGrid();
    });
    
    $modelListContainer.appendChild(item);
  });
}

// Search Input Listener
if ($modelSearch) {
  $modelSearch.addEventListener('input', (e) => {
    renderSidebarModelList(e.target.value);
  });
}

// =========================================================================
// MODEL PRESETS (SAVED LISTS)
// =========================================================================
function loadModelPresets() {
  const data = localStorage.getItem(PRESETS_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse presets', e);
    }
  }
  return {};
}

function saveModelPresetsToStorage(presetsObj) {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presetsObj));
}

function renderModelPresets() {
  if (!$presetListContainer) return;
  const presets = loadModelPresets();
  $presetListContainer.innerHTML = '';
  
  for (const [name, presetData] of Object.entries(presets)) {
    const item = document.createElement('div');
    item.className = 'pg-preset-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    
    let selectedArr = [];
    let activeArr = [];
    if (presetData && typeof presetData === 'object' && !Array.isArray(presetData)) {
      selectedArr = presetData.selected || [];
      activeArr = presetData.active || [];
    } else if (Array.isArray(presetData)) {
      selectedArr = presetData;
      activeArr = presetData;
    }
    
    nameSpan.title = `선택: [${selectedArr.join(', ')}]\n활성: [${activeArr.join(', ')}]`;
    nameSpan.addEventListener('click', () => {
      // Apply preset
      selectedModels = new Set(selectedArr);
      activeModels = new Set(activeArr);
      renderModelGrid();
      renderSidebarModelList(document.getElementById('model-search') ? document.getElementById('model-search').value : '');
    });
    
    const delBtn = document.createElement('button');
    delBtn.className = 'pg-preset-item-delete';
    delBtn.textContent = '✕';
    delBtn.title = '프리셋 삭제';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = loadModelPresets();
      delete p[name];
      saveModelPresetsToStorage(p);
      renderModelPresets();
    });
    
    item.appendChild(nameSpan);
    item.appendChild(delBtn);
    $presetListContainer.appendChild(item);
  }
}

if ($btnSavePreset && $presetNameInput) {
  $btnSavePreset.addEventListener('click', () => {
    const baseName = $presetNameInput.value.trim();
    if (!baseName) { alert('프리셋 이름을 입력하세요.'); return; }
    if (selectedModels.size === 0) { alert('저장할 모델이 없습니다. (사이드바에서 모델을 1개 이상 선택해 주세요)'); return; }
    
    const presets = loadModelPresets();
    
    // 중복 이름 우회 (이름 (1), 이름 (2)...)
    let finalName = baseName;
    if (presets[finalName]) {
      let counter = 1;
      while (presets[`${baseName} (${counter})`]) {
        counter++;
      }
      finalName = `${baseName} (${counter})`;
    }
    
    presets[finalName] = {
      selected: Array.from(selectedModels),
      active: Array.from(activeModels)
    };
    saveModelPresetsToStorage(presets);
    
    $presetNameInput.value = '';
    renderModelPresets();
  });
  
  $presetNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $btnSavePreset.click();
  });
}

if ($btnExportPresets) {
  $btnExportPresets.addEventListener('click', () => {
    const presets = loadModelPresets();
    if (Object.keys(presets).length === 0) { alert('내보낼 프리셋이 없습니다.'); return; }
    
    const json = JSON.stringify(presets, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_presets.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

if ($inputImportPresets) {
  $inputImportPresets.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('올바른 프리셋 JSON 형식이 아닙니다.');
        }
        
        // Overwrite
        saveModelPresetsToStorage(data);
        renderModelPresets();
        alert('프리셋을 성공적으로 불러왔습니다.');
      } catch (err) {
        alert('프리셋 불러오기 실패: ' + err.message);
      } finally {
        $inputImportPresets.value = ''; // reset
      }
    };
    reader.readAsText(file);
  });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.AVAILABLE_MODELS !== 'undefined') {
    renderModelGrid();
    renderSidebarModelList();
    renderModelPresets();

    // Bind tag filter chips
    const $chips = document.querySelectorAll('#model-tag-chips .pg-chip');
    $chips.forEach(chip => {
      chip.addEventListener('click', () => {
        $chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedTagFilter = chip.dataset.tag;
        renderSidebarModelList(document.getElementById('model-search') ? document.getElementById('model-search').value : '');
      });
    });
  }
});

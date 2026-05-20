/* =========================================================================
   History Viewer — Load, list, and view benchmark run results
   - Loads from server DB API (/api/results, /api/results/{filename})
   - Loads from localStorage (latest run from Playground)
   - Loads from JSON file drag & drop or file picker
   - Renders Markdown with marked.js + Prism.js + KaTeX
   ========================================================================= */

const LAST_RUN_STORAGE = 'playground_last_run';

// --- DOM Refs ---
const $sidebar = document.getElementById('hv-sidebar');
const $sidebarToggle = document.getElementById('hv-sidebar-toggle');
const $refreshBtn = document.getElementById('refresh-btn');
const $dropZone = document.getElementById('drop-zone');
const $fileInput = document.getElementById('file-input');
const $runList = document.getElementById('run-list');

const $welcomeView = document.getElementById('welcome-view');
const $detailSection = document.getElementById('detail-section');
const $detailTitle = document.getElementById('detail-title');
const $detailMeta = document.getElementById('detail-meta');
const $detailPrompt = document.getElementById('detail-prompt');
const $detailResults = document.getElementById('detail-results');
const $detailClose = document.getElementById('detail-close');

// --- State ---
let allRuns = []; // Holds run summaries & loaded details

// =========================================================================
// SIDEBAR COLLAPSIBLE
// =========================================================================
$sidebarToggle.addEventListener('click', () => {
  $sidebar.classList.toggle('is-collapsed');
});

// =========================================================================
// MARKDOWN RENDERING (shared with playground)
// =========================================================================
function renderMarkdown(text) {
  if (typeof marked === 'undefined') {
    const el = document.createElement('div');
    el.classList.add('raw-text');
    el.textContent = text;
    return el;
  }

  const el = document.createElement('div');
  try {
    el.innerHTML = marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
    el.classList.add('raw-text');
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

// =========================================================================
// FILE LOADING (Drag & Drop + Input Picker)
// =========================================================================
$dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  $dropZone.classList.add('is-dragover');
});
$dropZone.addEventListener('dragleave', () => {
  $dropZone.classList.remove('is-dragover');
});
$dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  $dropZone.classList.remove('is-dragover');
  const files = [...e.dataTransfer.files].filter(f => f.name.endsWith('.json'));
  files.forEach(loadFile);
});

$dropZone.addEventListener('click', (e) => {
  // Prevent click triggering twice if clicking label
  if (e.target.tagName !== 'INPUT') {
    $fileInput.click();
  }
});
$fileInput.addEventListener('change', () => {
  [...$fileInput.files].forEach(loadFile);
  $fileInput.value = '';
});

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      addRun(data, 'Uploaded File');
    } catch (err) {
      alert(`파일 파싱 실패: ${file.name}\n${err.message}`);
    }
  };
  reader.readAsText(file);
}

// =========================================================================
// RUN MANAGEMENT
// =========================================================================
function addRun(data, source) {
  // Normalize: if data is an array (old CLI format), wrap it
  if (Array.isArray(data)) {
    data = {
      run_id: data[0]?.run_id || 'cli_' + Math.random().toString(36).substr(2, 9),
      timestamp: data[0]?.timestamp || new Date().toISOString(),
      prompt: '(CLI 실행 — 프롬프트 미포함)',
      problem_id: data[0]?.problem_id || null,
      results: data,
    };
  }

  data.source = source || 'DB';

  // Check for duplicate (by run_id and timestamp)
  const existsIdx = allRuns.findIndex(r => r.run_id === data.run_id && r.timestamp === data.timestamp);
  if (existsIdx !== -1) {
    // Merge full results if we are replacing metadata
    allRuns[existsIdx] = { ...allRuns[existsIdx], ...data };
  } else {
    allRuns.push(data);
  }

  // Sort: newest first
  allRuns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  renderRunList();
}

function renderRunList() {
  if (allRuns.length === 0) {
    $runList.innerHTML = '<p class="hv-list-empty">로딩된 결과 또는 DB 기록이 없습니다.</p>';
    return;
  }

  let html = '';
  for (let i = 0; i < allRuns.length; i++) {
    const run = allRuns[i];
    const time = formatTime(run.timestamp);
    const problemId = run.problem_id || '(자유 입력)';
    const modelCount = run.model_count ?? (run.results ? run.results.length : 0);
    
    // Formatting run_id for view
    const displayId = run.run_id.length > 17 ? run.run_id.substring(0, 15) + '...' : run.run_id;

    html += `
      <button class="hv-run-item" data-index="${i}" title="${run.run_id}">
        <div class="hv-run-head">
          <span class="hv-run-id">ID: ${displayId}</span>
          <span class="hv-run-count">${modelCount} Models</span>
        </div>
        <div class="hv-run-subject">${problemId}</div>
        <div class="hv-run-footer">
          <span>${time}</span>
          <span class="hv-run-source">${run.source}</span>
        </div>
      </button>`;
  }

  $runList.innerHTML = html;

  // Bind click event
  $runList.querySelectorAll('.hv-run-item').forEach(item => {
    item.addEventListener('click', async () => {
      const idx = parseInt(item.dataset.index, 10);
      let run = allRuns[idx];

      // Highlight item
      $runList.querySelectorAll('.hv-run-item').forEach(el => el.classList.remove('is-active'));
      item.classList.add('is-active');

      // Fetch full details if not loaded (lazy loading)
      if (!run.results) {
        item.style.opacity = '0.7';
        item.querySelector('.hv-run-id').textContent = '상세 로드 중...';
        run = await loadRunDetailsFromServer(run);
        item.style.opacity = '1';
        item.querySelector('.hv-run-id').textContent = `ID: ${run.run_id.length > 17 ? run.run_id.substring(0, 15) + '...' : run.run_id}`;
        
        if (!run) return; // Fail safe
      }

      showDetail(run);
    });
  });
}

async function loadRunDetailsFromServer(run) {
  if (!run.filename) return run;

  try {
    const res = await fetch(`/api/results/${run.filename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // Update memory cache
    run.results = data.results;
    run.prompt = data.prompt;
    run.problem_id = data.problem_id || run.problem_id;
    return run;
  } catch (err) {
    console.error('Failed to load run details:', err);
    alert(`서버에서 상세 데이터를 불러오지 못했습니다: ${err.message}`);
    return null;
  }
}

// =========================================================================
// DB API INTEGRATION
// =========================================================================
async function syncWithServerDB() {
  const oldLoading = $runList.innerHTML;
  $runList.innerHTML = '<p class="hv-loading">DB 목록 동기화 중...</p>';

  try {
    const res = await fetch('/api/results');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const results = await res.json();

    // Clear old DB items but preserve local uploads
    allRuns = allRuns.filter(r => r.source !== 'DB');

    // Add each summary
    results.forEach(summary => {
      summary.source = 'DB';
      // If it already exists in memory (from local upload), don't overwrite it entirely
      const existsIdx = allRuns.findIndex(r => r.run_id === summary.run_id && r.timestamp === summary.timestamp);
      if (existsIdx === -1) {
        allRuns.push(summary);
      }
    });

    // Sort: newest first
    allRuns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    renderRunList();

  } catch (err) {
    console.warn('API DB server offline or failed:', err);
    $runList.innerHTML = oldLoading;
    // Silent fail if it was just loaded, otherwise show message inside list
    if (allRuns.length === 0) {
      $runList.innerHTML = `
        <p class="hv-list-empty">
          로컬 API 서버가 오프라인이거나 연결할 수 없습니다.<br/>
          (JSON 파일을 이 영역에 업로드하여 수동 조회 가능)
        </p>`;
    }
  }
}

$refreshBtn.addEventListener('click', syncWithServerDB);

// =========================================================================
// DETAIL PANEL VIEW
// =========================================================================
function showDetail(run) {
  $welcomeView.hidden = true;
  $detailSection.hidden = false;

  $detailTitle.textContent = `실행 기록: ${run.run_id}`;
  $detailMeta.textContent = `${formatTime(run.timestamp)} · ${run.results?.length || 0}개 모델 · ${run.problem_id || '자유 입력'}`;
  $detailPrompt.textContent = run.prompt || '(프롬프트 데이터 없음)';

  // Build model response comparison cards
  let html = '';
  if (run.results && run.results.length > 0) {
    for (const r of run.results) {
      const latency = r.latency_seconds ? `${r.latency_seconds}s` : '—';
      const tokensIn = r.tokens?.prompt_tokens ?? r.tokens?.input_tokens ?? '?';
      const tokensOut = r.tokens?.completion_tokens ?? r.tokens?.output_tokens ?? '?';

      html += `
        <article class="hv-result-card">
          <header class="hv-result-head">
            <span class="hv-result-name">${r.model}</span>
            <span class="hv-result-time">${latency}</span>
          </header>
          <div class="hv-result-body" data-content="${encodeURIComponent(r.response || r.error || '')}">
            ${r.error ? `<div class="hv-result-error">${r.error}</div>` : '<p style="color:var(--mute); font-size:0.75rem; font-family:var(--ff-mono);">렌더링 대기 중...</p>'}
          </div>
          <footer class="hv-result-foot">
            <span>${tokensIn} in · ${tokensOut} out</span>
            <span>${latency}</span>
          </footer>
        </article>`;
    }
  } else {
    html = '<p class="hv-list-empty">응답 결과 데이터가 비어 있습니다.</p>';
  }

  $detailResults.innerHTML = html;

  // Render markdown with delay to avoid rendering blocks blocking DOM
  requestAnimationFrame(() => {
    $detailResults.querySelectorAll('.hv-result-body[data-content]').forEach(body => {
      const content = decodeURIComponent(body.dataset.content);
      if (!content || body.querySelector('.hv-result-error')) return;

      body.innerHTML = '';
      body.appendChild(renderMarkdown(content));
    });
  });

  // Scroll to details on mobile view
  if (window.innerWidth <= 960) {
    $detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

$detailClose.addEventListener('click', () => {
  $detailSection.hidden = true;
  $welcomeView.hidden = false;
  
  // Clear active sidebar highlights
  $runList.querySelectorAll('.hv-run-item').forEach(el => el.classList.remove('is-active'));
});

// =========================================================================
// UTILS
// =========================================================================
function formatTime(isoStr) {
  try {
    const d = new Date(isoStr);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return isoStr || '—';
  }
}

// =========================================================================
// INIT
// =========================================================================
(async function init() {
  // 1. Initial Sync with server DB API
  await syncWithServerDB();

  // 2. Check URL parameters
  const params = new URLSearchParams(window.location.search);

  // 3. Load latest run from localStorage if ?run=latest
  if (params.get('run') === 'latest') {
    const stored = localStorage.getItem(LAST_RUN_STORAGE);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        addRun(data, 'Local Sandbox');
        
        // Auto-select and show the top run (which is the local sandboxed latest run)
        if (allRuns.length > 0) {
          showDetail(allRuns[0]);
          const firstItem = $runList.querySelector('.hv-run-item');
          if (firstItem) firstItem.classList.add('is-active');
        }
      } catch (e) {
        console.warn('Failed to load latest run from localStorage:', e);
      }
    }
  }
})();

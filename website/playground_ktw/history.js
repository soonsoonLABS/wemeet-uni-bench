/* =========================================================================
   History Viewer — Load, list, and view benchmark run results
   - Loads from localStorage (latest run from Playground)
   - Loads from JSON file drag & drop or file picker
   - Renders Markdown with marked.js + Prism.js + KaTeX
   ========================================================================= */

const LAST_RUN_STORAGE = 'playground_last_run';

// --- DOM ---
const $dropZone = document.getElementById('drop-zone');
const $fileInput = document.getElementById('file-input');
const $runList = document.getElementById('run-list');
const $detailSection = document.getElementById('detail-section');
const $detailTitle = document.getElementById('detail-title');
const $detailMeta = document.getElementById('detail-meta');
const $detailPrompt = document.getElementById('detail-prompt');
const $detailResults = document.getElementById('detail-results');
const $detailClose = document.getElementById('detail-close');

// --- State ---
let allRuns = [];

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
// FILE LOADING
// =========================================================================

// Drag & Drop
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

// Click to select
$dropZone.addEventListener('click', () => $fileInput.click());
$fileInput.addEventListener('change', () => {
  [...$fileInput.files].forEach(loadFile);
  $fileInput.value = '';
});

function loadFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      addRun(data, file.name);
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
  // Normalize: if data is an array (old format from run_benchmark.py), wrap it
  if (Array.isArray(data)) {
    data = {
      run_id: source || 'unknown',
      timestamp: data[0]?.timestamp || new Date().toISOString(),
      prompt: '(CLI 실행 — 프롬프트 미포함)',
      problem_id: data[0]?.problem_id || null,
      results: data,
    };
  }

  // Check for duplicate
  const exists = allRuns.some(r => r.run_id === data.run_id && r.timestamp === data.timestamp);
  if (exists) return;

  allRuns.push(data);
  allRuns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  renderRunList();
}

function renderRunList() {
  if (allRuns.length === 0) {
    $runList.innerHTML = '';
    return;
  }

  let html = `
    <div class="hv-run-row hv-run-row-header">
      <span>시각</span>
      <span>문제</span>
      <span>모델 수</span>
      <span>평균 응답</span>
      <span></span>
    </div>`;

  for (let i = 0; i < allRuns.length; i++) {
    const run = allRuns[i];
    const time = formatTime(run.timestamp);
    const problemId = run.problem_id || '(자유입력)';
    const modelCount = run.results ? run.results.length : 0;
    const avgLatency = run.results
      ? (run.results.reduce((s, r) => s + (r.latency_seconds || 0), 0) / Math.max(modelCount, 1)).toFixed(1)
      : '—';

    html += `
      <div class="hv-run-row" data-index="${i}">
        <span class="hv-run-time">${time}</span>
        <span class="hv-run-problem">${problemId}</span>
        <span class="hv-run-models">${modelCount}개</span>
        <span class="hv-run-avg">${avgLatency}s</span>
        <span class="hv-run-action">보기 →</span>
      </div>`;
  }

  $runList.innerHTML = html;

  // Bind click events
  $runList.querySelectorAll('.hv-run-row:not(.hv-run-row-header)').forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.dataset.index, 10);
      showDetail(allRuns[idx]);

      // Highlight active row
      $runList.querySelectorAll('.hv-run-row').forEach(r => r.classList.remove('is-active'));
      row.classList.add('is-active');
    });
  });
}

// =========================================================================
// DETAIL VIEW
// =========================================================================
function showDetail(run) {
  $detailSection.hidden = false;

  $detailTitle.textContent = `실행 기록: ${run.run_id}`;
  $detailMeta.textContent = `${formatTime(run.timestamp)} · ${run.results?.length || 0}개 모델 · ${run.problem_id || '자유입력'}`;

  $detailPrompt.textContent = run.prompt || '(프롬프트 없음)';

  // Render results
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
            ${r.error ? `<div class="hv-result-error">${r.error}</div>` : '<p style="color:var(--mute);">렌더링 중...</p>'}
          </div>
          <footer class="hv-result-foot">
            <span>${tokensIn} in · ${tokensOut} out</span>
            <span>${latency}</span>
          </footer>
        </article>`;
    }
  }

  $detailResults.innerHTML = html;

  // Render markdown for each non-error result (deferred for DOM to settle)
  requestAnimationFrame(() => {
    $detailResults.querySelectorAll('.hv-result-body[data-content]').forEach(body => {
      const content = decodeURIComponent(body.dataset.content);
      if (!content || body.querySelector('.hv-result-error')) return;

      body.innerHTML = '';
      body.appendChild(renderMarkdown(content));
    });
  });

  // Scroll to detail
  $detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$detailClose.addEventListener('click', () => {
  $detailSection.hidden = true;
  $runList.querySelectorAll('.hv-run-row').forEach(r => r.classList.remove('is-active'));
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
(function init() {
  // Check URL params
  const params = new URLSearchParams(window.location.search);

  // Load latest run from localStorage if ?run=latest
  if (params.get('run') === 'latest') {
    const stored = localStorage.getItem(LAST_RUN_STORAGE);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        addRun(data, 'localStorage (latest)');
        // Auto-open detail
        if (allRuns.length > 0) {
          showDetail(allRuns[0]);
        }
      } catch (e) {
        console.warn('Failed to load latest run from localStorage:', e);
      }
    }
  }

  renderRunList();
})();

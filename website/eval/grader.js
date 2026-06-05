/**
 * grader.js — 클라이언트 사이드 자동 채점 엔진
 *
 * Python auto_grader.py와 동일한 로직을 JavaScript로 구현.
 * 브라우저에서 응답 수신 즉시 실시간 채점을 수행합니다.
 */

const CRITICAL_RUBRIC_KEYS = new Set([
  'core_detection',
  'hallucination_control',
  'compliance_refusal',
  'contradiction_detection',
  'legacy_detection',
  'modern_alternative',
  'correct_alternative',
  'logical_analysis',
]);

/**
 * 단일 문제 × 단일 모델 응답에 대한 자동 채점
 * @param {Object} problem - 정형 스키마를 따르는 문제 JSON
 * @param {string} response - 모델 응답 텍스트
 * @returns {Object} GradeReport
 */
function autoGrade(problem, response) {
  const rubric = problem.rubric || {};
  const expectedOutput = problem.expected_output || {};
  const mustInclude = expectedOutput.must_include || {};
  const mustNotInclude = expectedOutput.must_not_include || {};

  const rubricResults = {};
  let overallPass = true;
  const criticalFailures = [];
  const minorViolations = [];

  for (const [rubricKey, rubricDesc] of Object.entries(rubric)) {
    let keyPass = true;
    const includeDetails = [];
    const excludeDetails = [];

    // must_include (AND of ORs)
    if (mustInclude[rubricKey]) {
      const groups = mustInclude[rubricKey];
      for (const group of groups) {
        let matched = null;
        for (const kw of group) {
          if (response.includes(kw)) {
            matched = kw;
            break;
          }
        }
        const groupPass = matched !== null;
        includeDetails.push({ keywords: group, matched, pass: groupPass });
        if (!groupPass) keyPass = false;
      }
    }

    // must_not_include (NOR)
    if (mustNotInclude[rubricKey]) {
      const forbidden = mustNotInclude[rubricKey];
      for (const kw of forbidden) {
        const found = response.includes(kw);
        excludeDetails.push({ keyword: kw, found, pass: !found });
        if (found) keyPass = false;
      }
    }

    const severity = CRITICAL_RUBRIC_KEYS.has(rubricKey) ? 'critical' : 'minor';
    rubricResults[rubricKey] = {
      pass: keyPass,
      severity,
      details: { include: includeDetails, exclude: excludeDetails },
    };

    if (!keyPass) {
      overallPass = false;
      if (severity === 'critical') criticalFailures.push(rubricKey);
      else minorViolations.push(rubricKey);
    }
  }

  const totalKeys = Object.keys(rubricResults).length;
  const passedKeys = Object.values(rubricResults).filter(r => r.pass).length;
  const score = totalKeys > 0 ? Math.round((passedKeys / totalKeys) * 1000) / 1000 : 0;

  return {
    overallPass,
    score,
    criticalFailures,
    minorViolations,
    rubricResults,
  };
}

/**
 * 채점 결과를 사람이 읽기 좋은 HTML로 렌더링
 * @param {Object} grade - autoGrade()의 반환값
 * @param {Object} rubric - 문제의 rubric 객체 (설명 표시용)
 * @returns {string} HTML 문자열
 */
function renderGradeHTML(grade, rubric) {
  const totalKeys = Object.keys(grade.rubricResults).length;
  const passedKeys = Object.values(grade.rubricResults).filter(r => r.pass).length;

  const overallClass = grade.overallPass ? 'grade-pass' : 'grade-fail';
  const overallIcon = grade.overallPass ? '✅' : '❌';

  let html = `
    <div class="grade-summary ${overallClass}">
      <span class="grade-icon">${overallIcon}</span>
      <span class="grade-score">Score: ${passedKeys}/${totalKeys} (${grade.score})</span>
    </div>
    <div class="grade-items">`;

  for (const [key, result] of Object.entries(grade.rubricResults)) {
    const icon = result.pass ? '✅' : '❌';
    const severityBadge = (!result.pass && result.severity === 'critical')
      ? '<span class="severity-critical">CRITICAL</span>' : '';
    const desc = rubric?.[key] || '';

    let detailHtml = '';

    // include details
    for (const d of result.details.include) {
      const matchIcon = d.pass ? '✓' : '✗';
      const matchClass = d.pass ? 'match-pass' : 'match-fail';
      const kwList = d.keywords.map(kw => {
        const isMatched = kw === d.matched;
        return isMatched ? `<strong>${escapeHtml(kw)}</strong>` : escapeHtml(kw);
      }).join(' | ');
      detailHtml += `<div class="grade-detail ${matchClass}"><span>${matchIcon}</span> 포함 필수: [${kwList}]</div>`;
    }

    // exclude details
    for (const d of result.details.exclude) {
      if (d.found) {
        detailHtml += `<div class="grade-detail match-fail"><span>✗</span> 금지 키워드 감지: "${escapeHtml(d.keyword)}"</div>`;
      }
    }

    html += `
      <div class="grade-item ${result.pass ? '' : 'is-failed'}">
        <div class="grade-item-header">
          <span class="grade-item-icon">${icon}</span>
          <span class="grade-item-key">${escapeHtml(key)}</span>
          <span class="grade-item-status">${result.pass ? 'PASS' : 'FAIL'}</span>
          ${severityBadge}
        </div>
        ${detailHtml ? `<div class="grade-item-details">${detailHtml}</div>` : ''}
      </div>`;
  }

  html += '</div>';

  if (grade.criticalFailures.length > 0) {
    html += `
      <div class="grade-critical-warning">
        ⚠️ 치명적 실패: ${grade.criticalFailures.map(escapeHtml).join(', ')}
      </div>`;
  }

  return html;
}

/**
 * 종합 히트맵 테이블 생성
 * @param {Array} evaluations - [{model, grade}] 배열
 * @param {Object} rubric - 문제의 rubric 객체
 * @returns {string} HTML 테이블 문자열
 */
function renderHeatmapHTML(evaluations, rubric) {
  if (!evaluations || evaluations.length === 0) return '';

  const rubricKeys = Object.keys(rubric || {});
  const models = evaluations.map(e => e.model);

  let html = '<table class="heatmap-table"><thead><tr><th></th>';
  for (const model of models) {
    html += `<th>${escapeHtml(model)}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const rk of rubricKeys) {
    html += `<tr><td class="heatmap-key">${escapeHtml(rk)}</td>`;
    for (const ev of evaluations) {
      const result = ev.grade?.rubricResults?.[rk];
      if (!result) {
        html += '<td class="heatmap-cell heatmap-na">—</td>';
      } else {
        const cls = result.pass ? 'heatmap-pass' : 'heatmap-fail';
        const icon = result.pass ? '✅' : '❌';
        html += `<td class="heatmap-cell ${cls}">${icon}</td>`;
      }
    }
    html += '</tr>';
  }

  // Total row
  html += '<tr class="heatmap-total"><td><strong>Total Score</strong></td>';
  for (const ev of evaluations) {
    const g = ev.grade;
    if (!g) {
      html += '<td class="heatmap-cell heatmap-na">—</td>';
    } else {
      const total = Object.keys(g.rubricResults).length;
      const passed = Object.values(g.rubricResults).filter(r => r.pass).length;
      const cls = g.overallPass ? 'heatmap-pass' : 'heatmap-fail';
      html += `<td class="heatmap-cell ${cls}"><strong>${passed}/${total}</strong></td>`;
    }
  }
  html += '</tr></tbody></table>';

  return html;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

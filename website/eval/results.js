/* ==========================================================================
   Eval Results Dashboard — results.js
   스트레스 테스트 평가 결과를 불러와서 렌더링 및 그래프 출력
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const summaryContainer = document.getElementById('summary-content');

  // 1. Load Markdown Summary
  try {
    const res = await fetch('data/summary.md');
    if (res.ok) {
      const markdownText = await res.text();
      if (typeof marked !== 'undefined') {
        summaryContainer.innerHTML = marked.parse(markdownText, { breaks: true, gfm: true });
      } else {
        summaryContainer.textContent = markdownText;
      }
    }
  } catch (error) {
    console.error('Failed to load summary.md:', error);
  }

  // 2. Load JSON Data for Charts
  try {
    const [evalRes, probRes] = await Promise.all([
      fetch('data/latest_graded.json'),
      fetch('data/stress_problems.json')
    ]);
    
    if (!evalRes.ok || !probRes.ok) throw new Error('Failed to load JSON data files.');
    
    const evalData = await evalRes.json();
    const probData = await probRes.json();
    
    if (typeof Chart !== 'undefined') {
      renderCharts(evalData, probData);
    } else {
      console.error('Chart.js not loaded!');
    }
  } catch (error) {
    console.error('Failed to load JSON data for charts:', error);
  }
});

function renderCharts(evalData, probData) {
  if (!evalData || !evalData.evaluations) return;

  // Map problem IDs to stress categories
  const problemToCat = {};
  if (probData && probData.problems) {
    probData.problems.forEach(p => {
      problemToCat[p.id] = p.stress_category;
    });
  }

  const evals = evalData.evaluations;

  // Aggregate Data
  const modelStats = {};
  const failureCounts = {};
  
  const STRESS_CATEGORIES = ['false_premise', 'fabricated_concept', 'legacy_enforcement', 'self_contradiction'];
  const CAT_LABELS = {
    false_premise: '거짓 전제',
    fabricated_concept: '가짜 개념',
    legacy_enforcement: '레거시 강요',
    self_contradiction: '자기 모순',
    unknown: '기타'
  };

  evals.forEach(ev => {
    const model = ev.model;
    const cat = problemToCat[ev.problem_id] || 'unknown';
    
    if (!modelStats[model]) {
      modelStats[model] = { 
        total: 0, 
        pass: 0,
        errorCount: 0,
        catPass: { false_premise: 0, fabricated_concept: 0, legacy_enforcement: 0, self_contradiction: 0, unknown: 0 },
        criticalFails: { false_premise: 0, fabricated_concept: 0, legacy_enforcement: 0, self_contradiction: 0, unknown: 0 }
      };
    }
    modelStats[model].total += 1;
    
    let isError = false;
    if (ev.error) isError = true;
    if (ev.grade && ev.grade.critical_failures && ev.grade.critical_failures.includes('error')) isError = true;
    
    if (isError) {
      modelStats[model].errorCount += 1;
    }
    
    if (ev.grade && ev.grade.overall_pass) {
      modelStats[model].pass += 1;
      modelStats[model].catPass[cat] += 1;
    } else if (ev.grade && ev.grade.critical_failures && ev.grade.critical_failures.length > 0) {
      modelStats[model].criticalFails[cat] += 1;
      ev.grade.critical_failures.forEach(f => {
        failureCounts[f] = (failureCounts[f] || 0) + 1;
        if (f.includes('error')) {
          modelStats[model].hasError = true;
        }
      });
    } else if (ev.error) {
      modelStats[model].hasError = true;
      modelStats[model].criticalFails[cat] += 1;
      failureCounts['error (api_failure)'] = (failureCounts['error (api_failure)'] || 0) + 1;
    }
  });

  // Sort models by total pass descending
  const sortedModels = Object.keys(modelStats);
  sortedModels.sort((a, b) => modelStats[b].pass - modelStats[a].pass);
  
  const displayModels = sortedModels.map(m => modelStats[m].hasError ? `🚨 ${m} (Error)` : m);
  const tickColors = sortedModels.map(m => modelStats[m].hasError ? '#ef4444' : '#94a3b8');

  // Common Chart.js styling
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
  Chart.defaults.plugins.tooltip.titleColor = '#f8fafc';
  Chart.defaults.plugins.tooltip.bodyColor = '#e2e8f0';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxPadding = 6;

  // ==========================================
  // 1. Pass Count by Stress Category (Stacked Bar Chart)
  // ==========================================
  const ctxPass = document.getElementById('passRateChart');
  if (ctxPass) {
    if (typeof Chart !== 'undefined' && Chart.Interaction && Chart.Interaction.modes) {
      Chart.Interaction.modes.hoverOrRow = function(chart, e, options, useFinalPosition) {
        const nearest = Chart.Interaction.modes.nearest(chart, e, { intersect: true }, useFinalPosition);
        if (nearest && nearest.length > 0) return nearest;
        return Chart.Interaction.modes.y(chart, e, { intersect: false }, useFinalPosition);
      };
    }
    
    const catColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899']; // Indigo, Green, Amber, Pink
    
    const datasets = STRESS_CATEGORIES.map((cat, i) => {
      return {
        label: CAT_LABELS[cat],
        data: sortedModels.map(m => modelStats[m].catPass[cat]),
        backgroundColor: catColors[i],
        borderWidth: 0,
        borderRadius: 4,
        stack: 'Stack 0'
      };
    });

    new Chart(ctxPass.getContext('2d'), {
      type: 'bar',
      data: {
        labels: displayModels,
        datasets: datasets
      },
      options: {
        interaction: {
          mode: typeof Chart !== 'undefined' && Chart.Interaction && Chart.Interaction.modes && Chart.Interaction.modes.hoverOrRow ? 'hoverOrRow' : 'nearest',
          intersect: false
        },
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Horizontal
        plugins: {
          legend: { 
            position: 'top',
            labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 8 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.raw === 0) return null;
                return `${context.dataset.label}: ${context.raw}개`;
              },
              footer: function(tooltipItems) {
                if (tooltipItems.length === 0) return '';
                const dataIndex = tooltipItems[0].dataIndex;
                const modelName = sortedModels[dataIndex];
                const stats = modelStats[modelName];
                
                let lines = [];
                lines.push(`표시된 항목 합계: ${stats.pass}개`);
                if (stats.errorCount > 0) {
                  lines.push(`🚨 에러 발생 갯수: ${stats.errorCount}개`);
                }
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            max: 16,
            title: { display: true, text: '통과 개수 (총 16문제)', color: '#94a3b8' },
            ticks: { stepSize: 2 }
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: { 
              autoSkip: false, 
              font: { size: 11 }, 
              color: function(context) {
                return context.index !== undefined ? tickColors[context.index] : '#94a3b8';
              }
            }
          }
        }
      }
    });
  }

  // ==========================================
  // 2. Failure Reasons Chart (Doughnut)
  // ==========================================
  const ctxFail = document.getElementById('failureReasonChart');
  if (ctxFail) {
    const failureLabels = Object.keys(failureCounts);
    const failureData = Object.values(failureCounts);

    new Chart(ctxFail.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: failureLabels,
        datasets: [{
          data: failureData,
          backgroundColor: [
            '#ec4899', '#f43f5e', '#f97316', '#f59e0b', 
            '#84cc16', '#10b981', '#06b6d4', '#6366f1', '#a855f7'
          ],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e2e8f0', padding: 12, font: { size: 11 }, usePointStyle: true, boxWidth: 8 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const val = context.raw;
                const percent = ((val / total) * 100).toFixed(1);
                return `${context.label}: ${val}건 (${percent}%)`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}

/* ── Coca-Cola KO Stock Dashboard ── */

const C = {
  red:    '#E61028',
  green:  '#26d97f',
  blue:   '#4a90d9',
  yellow: '#f5c518',
  purple: '#a67cff',
  orange: '#ff7043',
  gray:   '#7b82a0',
  bg:     '#1a1d27',
  border: '#2e3350',
};

Chart.defaults.color = '#7b82a0';
Chart.defaults.font.family = "'Inter','Segoe UI',system-ui,sans-serif";
Chart.defaults.font.size = 12;

const chartInstances = {};

/* ── Helpers ── */
function fmt$(v)   { return '$' + Number(v).toFixed(2); }
function fmtPct(v) { return (v >= 0 ? '+' : '') + Number(v).toFixed(2) + '%'; }
function fmtVol(v) { return (v / 1e6).toFixed(1) + 'M'; }
function upDown(v) { return v >= 0 ? 'up' : 'down'; }

function setEl(id, text, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (cls) { el.classList.remove('up', 'down'); el.classList.add(cls); }
}

/* ── Populate stat cards ── */
function populateStats(s) {
  const dir = upDown(s.day_change);
  setEl('stat-price',    fmt$(s.current_price));
  setEl('stat-change',   fmtPct(s.day_change_pct) + '  (' + fmt$(s.day_change) + ')', dir);
  setEl('stat-hi52',     fmt$(s.week52_high));
  setEl('stat-lo52',     fmt$(s.week52_low));
  setEl('stat-vol',      fmtVol(s.avg_volume_10d));
  setEl('stat-ytd',      fmtPct(s.ytd_return_pct), upDown(s.ytd_return_pct));
  setEl('stat-total-ret', fmtPct(s.total_return_pct), upDown(s.total_return_pct));
  setEl('stat-prev',     fmt$(s.prev_close));
}

/* ── Default Chart.js options ── */
function baseLineOpts(title) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: '#22263a',
        borderColor: '#2e3350',
        borderWidth: 1,
        titleColor: '#e8eaf0',
        bodyColor: '#7b82a0',
        padding: 10,
        callbacks: {
          label: ctx => {
            const v = ctx.parsed.y;
            if (v === null) return null;
            return ` ${ctx.dataset.label}: ${v.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#1e2236' },
        ticks: { maxTicksLimit: 10, maxRotation: 0 }
      },
      y: {
        grid: { color: '#1e2236' },
        position: 'right',
        ticks: {
          callback: v => '$' + v.toFixed(0)
        }
      }
    }
  };
}

/* ── Price chart with MAs and Bollinger Bands ── */
function buildPriceChart(data) {
  const { dates, close, ma20, ma50, ma200, bb_upper, bb_lower } = data.price_chart;

  const ctx = document.getElementById('chartPrice').getContext('2d');

  const bbFill = bb_upper.map((u, i) => u !== null && bb_lower[i] !== null ? u : null);

  chartInstances.price = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Close',
          data: close,
          borderColor: '#fff',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          order: 1,
        },
        {
          label: 'MA 20',
          data: ma20,
          borderColor: C.yellow,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          borderDash: [],
          order: 2,
        },
        {
          label: 'MA 50',
          data: ma50,
          borderColor: C.blue,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          order: 3,
        },
        {
          label: 'MA 200',
          data: ma200,
          borderColor: C.purple,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          order: 4,
        },
        {
          label: 'BB Upper',
          data: bb_upper,
          borderColor: 'rgba(74,144,217,0.35)',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          order: 5,
        },
        {
          label: 'BB Lower',
          data: bb_lower,
          borderColor: 'rgba(74,144,217,0.35)',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: '-1',
          backgroundColor: 'rgba(74,144,217,0.06)',
          order: 6,
        },
      ]
    },
    options: {
      ...baseLineOpts('KO Price'),
      plugins: {
        ...baseLineOpts('KO Price').plugins,
        tooltip: {
          ...baseLineOpts('KO Price').plugins.tooltip,
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              if (v === null) return null;
              return ` ${ctx.dataset.label}: $${v.toFixed(2)}`;
            }
          }
        }
      }
    }
  });
}

/* ── RSI chart ── */
function buildRsiChart(data) {
  const { dates, rsi14 } = data.rsi_chart;
  const ctx = document.getElementById('chartRsi').getContext('2d');

  const colors = rsi14.map(v => v >= 70 ? C.red : v <= 30 ? C.green : C.blue);

  chartInstances.rsi = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'RSI 14',
        data: rsi14,
        borderColor: C.blue,
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#22263a',
          borderColor: '#2e3350',
          borderWidth: 1,
          titleColor: '#e8eaf0',
          bodyColor: '#7b82a0',
          padding: 10,
          callbacks: {
            label: ctx => ` RSI 14: ${ctx.parsed.y.toFixed(1)}`
          }
        },
        annotation: {
          annotations: {
            ob: { type: 'line', yMin: 70, yMax: 70, borderColor: C.red,   borderWidth: 1, borderDash: [4,4] },
            os: { type: 'line', yMin: 30, yMax: 30, borderColor: C.green, borderWidth: 1, borderDash: [4,4] },
            mid:{ type: 'line', yMin: 50, yMax: 50, borderColor: C.gray,  borderWidth: 1, borderDash: [2,4] },
          }
        }
      },
      scales: {
        x: { grid: { color: '#1e2236' }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
        y: {
          grid: { color: '#1e2236' },
          min: 0, max: 100,
          position: 'right',
          ticks: { callback: v => v }
        }
      }
    }
  });
}

/* ── Volume chart ── */
function buildVolumeChart(data) {
  const { labels, volumes } = data.volume_chart;
  const ctx = document.getElementById('chartVolume').getContext('2d');

  const barColors = volumes.map((v, i) => {
    const alpha = 0.5 + 0.5 * (v / Math.max(...volumes));
    return `rgba(230,16,40,${alpha.toFixed(2)})`;
  });

  chartInstances.volume = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Avg Daily Volume',
        data: volumes,
        backgroundColor: barColors,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#22263a',
          borderColor: '#2e3350',
          borderWidth: 1,
          titleColor: '#e8eaf0',
          bodyColor: '#7b82a0',
          padding: 10,
          callbacks: { label: ctx => ` Avg Volume: ${fmtVol(ctx.parsed.y)}` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10, maxRotation: 45 } },
        y: {
          grid: { color: '#1e2236' },
          position: 'right',
          ticks: { callback: v => fmtVol(v) }
        }
      }
    }
  });
}

/* ── Monthly Returns bar chart ── */
function buildMonthlyReturns(data) {
  const { labels, values } = data.monthly_returns;
  const ctx = document.getElementById('chartMonthly').getContext('2d');

  const colors = values.map(v => v >= 0 ? C.green : C.red);

  chartInstances.monthly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Monthly Return',
        data: values,
        backgroundColor: colors.map(c => c + 'aa'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#22263a',
          borderColor: '#2e3350',
          borderWidth: 1,
          titleColor: '#e8eaf0',
          bodyColor: '#7b82a0',
          padding: 10,
          callbacks: {
            label: ctx => ` Return: ${fmtPct(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12, maxRotation: 45 } },
        y: {
          grid: { color: '#1e2236' },
          position: 'right',
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

/* ── Return Distribution histogram ── */
function buildDistribution(data) {
  const { labels, counts } = data.return_distribution;
  const ctx = document.getElementById('chartDist').getContext('2d');

  const colors = labels.map(l => {
    const v = parseFloat(l);
    if (v >= 2)  return C.green;
    if (v <= -2) return C.red;
    return C.blue;
  });

  chartInstances.dist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Days',
        data: counts,
        backgroundColor: colors.map(c => c + '88'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 2,
        barPercentage: 1.0,
        categoryPercentage: 1.0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#22263a',
          borderColor: '#2e3350',
          borderWidth: 1,
          titleColor: '#e8eaf0',
          bodyColor: '#7b82a0',
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} trading days`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 45 } },
        y: {
          grid: { color: '#1e2236' },
          position: 'right',
          ticks: { stepSize: 50 }
        }
      }
    }
  });
}

/* ── Range filter for price chart ── */
function applyRange(days) {
  const chart = chartInstances.price;
  if (!chart) return;
  const n = chart.data.labels.length;
  const start = days === 'all' ? 0 : Math.max(0, n - days);
  chart.options.scales.x.min = start;
  chart.options.scales.x.max = n - 1;
  chart.update();
}

/* ── Custom legend toggle ── */
function buildLegend(chartId, containerId, colorMap) {
  const chart = chartInstances[chartId];
  if (!chart) return;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  chart.data.datasets.forEach((ds, i) => {
    if (!colorMap[ds.label]) return;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-dot" style="background:${colorMap[ds.label]}"></span>${ds.label}`;
    item.addEventListener('click', () => {
      const meta = chart.getDatasetMeta(i);
      meta.hidden = !meta.hidden;
      item.style.opacity = meta.hidden ? '0.4' : '1';
      chart.update();
    });
    container.appendChild(item);
  });
}

/* ── Boot ── */
function init(data) {
  // Hide loading
  document.getElementById('loading').classList.add('hidden');

  // Meta
  document.getElementById('last-updated-tag').textContent =
    'Last updated: ' + data.meta.last_updated;
  document.getElementById('data-range-tag').textContent =
    data.meta.data_start + ' – ' + data.meta.data_end;

  populateStats(data.stats);
  buildPriceChart(data);
  buildRsiChart(data);
  buildVolumeChart(data);
  buildMonthlyReturns(data);
  buildDistribution(data);

  buildLegend('price', 'price-legend', {
    'Close':    '#ffffff',
    'MA 20':    C.yellow,
    'MA 50':    C.blue,
    'MA 200':   C.purple,
    'BB Upper': 'rgba(74,144,217,0.6)',
    'BB Lower': 'rgba(74,144,217,0.6)',
  });

  // Range buttons
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.range;
      applyRange(val === 'all' ? 'all' : parseInt(val));
    });
  });

  // Default to 1Y
  document.querySelector('[data-range="252"]')?.click();
}

/* ── Entry point ── */
window.addEventListener('DOMContentLoaded', () => {
  if (window.DASHBOARD_DATA) {
    init(window.DASHBOARD_DATA);
  } else {
    document.querySelector('#loading p').textContent =
      'Error: dashboard_data.js not found. Run generate_data.py first.';
  }
});

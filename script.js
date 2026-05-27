const COLS = 12, ROWS = 9, TOTAL_SECS = 60;
const MAX_COST = 150;

const TILES = {
  pipe_h:   { l:1,r:1,u:0,d:0, cost:1,  svg:'h',  label:'Cijev ━',       group:'Ravne' },
  pipe_v:   { l:0,r:0,u:1,d:1, cost:1,  svg:'v',  label:'Cijev ┃',       group:'Ravne' },
  pipe_ne:  { l:0,r:1,u:1,d:0, cost:2,  svg:'ne', label:'Kut ╰',          group:'Kutovi' },
  pipe_nw:  { l:1,r:0,u:1,d:0, cost:2,  svg:'nw', label:'Kut ╯',          group:'Kutovi' },
  pipe_se:  { l:0,r:1,u:0,d:1, cost:2,  svg:'se', label:'Kut ╭',          group:'Kutovi' },
  pipe_sw:  { l:1,r:0,u:0,d:1, cost:2,  svg:'sw', label:'Kut ╮',          group:'Kutovi' },
  pipe_tr:  { l:0,r:1,u:1,d:1, cost:3,  svg:'tr', label:'T-spoj ├',       group:'T-spojevi' },
  pipe_tl:  { l:1,r:0,u:1,d:1, cost:3,  svg:'tl', label:'T-spoj ┤',       group:'T-spojevi' },
  pipe_td:  { l:1,r:1,u:0,d:1, cost:3,  svg:'td', label:'T-spoj ┬',       group:'T-spojevi' },
  pipe_tu:  { l:1,r:1,u:1,d:0, cost:3,  svg:'tu', label:'T-spoj ┴',       group:'T-spojevi' },
  pipe_x:   { l:1,r:1,u:1,d:1, cost:4,  svg:'x',  label:'Križ ╋',         group:'Križ' },
  machine:  { l:1,r:1,u:1,d:1, cost:15, svg:'m1', label:'Stroj ×2',       group:'Strojevi' },
  machine2: { l:1,r:1,u:1,d:1, cost:35, svg:'m2', label:'Super stroj ×4', group:'Strojevi' },
  empty:    { l:0,r:0,u:0,d:0, cost:0,  svg:null, label:'Obriši',          group:'Alati' },
};
const GROUPS = ['Ravne','Kutovi','T-spojevi','Križ','Strojevi','Alati'];
const OPP   = { l:'r', r:'l', u:'d', d:'u' };
const DELTA = { l:[0,-1], r:[0,1], u:[-1,0], d:[1,0] };
const SCORES_KEY = 'pf_scores_v1';

let SOURCES = [], SINKS = [];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resetEndpoints() {
  const all = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) all.push([r, c]);
  const chosen = shuffle(all).slice(0, 8);
  SOURCES = chosen.slice(0, 7);
  SINKS   = [chosen[7]];
}

function makeSVG(key, size=30) {
  const s=size, h=s/2, t=Math.round(s*.18);
  const PC='#c8920a', MC='#8b80e8', M2='#e06030';
  const hB=(x1,x2)=>`<rect x="${x1}" y="${h-t/2}" width="${x2-x1}" height="${t}" rx="2" fill="${PC}"/>`;
  const vB=(y1,y2)=>`<rect x="${h-t/2}" y="${y1}" width="${t}" height="${y2-y1}" rx="2" fill="${PC}"/>`;
  function arc(cx,cy,r,a1,a2) {
    const R=a=>a*Math.PI/180;
    const x1=cx+Math.cos(R(a1))*r, y1=cy+Math.sin(R(a1))*r;
    const x2=cx+Math.cos(R(a2))*r, y2=cy+Math.sin(R(a2))*r;
    return `<path d="M${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2}" stroke="${PC}" stroke-width="${t}" fill="none" stroke-linecap="round"/>`;
  }
  const shapes = {
    h: hB(0,s), v: vB(0,s),
    ne: arc(0,s,h,-90,0), nw: arc(s,s,h,180,270),
    se: arc(0,0,h,0,90),  sw: arc(s,0,h,90,180),
    tr: vB(0,s)+hB(h,s), tl: vB(0,s)+hB(0,h),
    td: hB(0,s)+vB(h,s), tu: hB(0,s)+vB(0,h),
    x: hB(0,s)+vB(0,s),
    m1:`<rect x="3" y="3" width="${s-6}" height="${s-6}" rx="4" fill="${MC}" opacity=".25"/>
        <text x="${h}" y="${h+5}" text-anchor="middle" font-size="${Math.round(s*.55)}" fill="${MC}">⚙</text>`,
    m2:`<rect x="3" y="3" width="${s-6}" height="${s-6}" rx="4" fill="${M2}" opacity=".25"/>
        <text x="${h}" y="${h+5}" text-anchor="middle" font-size="${Math.round(s*.5)}" fill="${M2}">🏭</text>`,
  };
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">${shapes[key]||''}</svg>`;
}

function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY)||'[]'); } catch { return []; }
}
function saveScore(entry) {
  const sc = loadScores();
  sc.push(entry);
  localStorage.setItem(SCORES_KEY, JSON.stringify(sc, null, 2));
  return sc;
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(loadScores(), null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pipe-factory-scores-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

let grid, selected = 'pipe_h', running = false;
let secsLeft = TOTAL_SECS, ticker = null;
let currentPlayer = '', totalScore = 0;

function initGrid() { grid = Array.from({length:ROWS}, () => Array(COLS).fill('empty')); }
function isSource(r,c) { return SOURCES.some(([sr,sc]) => sr===r && sc===c); }
function isSink(r,c)   { return SINKS.some(([sr,sc])   => sr===r && sc===c); }
function getConn(r,c) {
  if (isSource(r,c) || isSink(r,c)) return {l:1,r:1,u:1,d:1};
  const t = grid[r][c];
  return (t && TILES[t]) ? TILES[t] : {l:0,r:0,u:0,d:0};
}

function computeOutput() {
  let total = 0;
  function dfs(r, c, mult, visited) {
    if (isSink(r, c)) { total += mult; return; }
    let key;
    try {
      key = r * COLS + c;
      if (visited.has(key)) return;
      visited.add(key);
      const cellType = grid[r][c];
      const m = cellType === 'machine' ? 2 : cellType === 'machine2' ? 4 : 1;
      const conn = getConn(r, c);
      for (const dir of ['l','r','u','d']) {
        if (!conn[dir]) continue;
        const [dr, dc] = DELTA[dir];
        const nr = r+dr, nc = c+dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        if (!getConn(nr, nc)[OPP[dir]]) continue;
        dfs(nr, nc, mult * m, visited);
      }
    } finally {
      if (typeof key !== 'undefined') visited.delete(key);
    }
  }
  for (const [sr, sc] of SOURCES) {
    dfs(sr, sc, 1, new Set());
  }
  return total;
}

function computeCost() {
  let c = 0;
  for (let r = 0; r < ROWS; r++)
    for (let cc = 0; cc < COLS; cc++)
      c += (TILES[grid[r][cc]]?.cost || 0);
  return c;
}

function renderGrid() {
  const el = document.getElementById('grid');
  el.style.gridTemplateColumns = `repeat(${COLS},42px)`;
  el.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const div = document.createElement('div');
      div.className = 'cell';
      if (isSource(r, c)) {
        div.classList.add('source');
        div.innerHTML = '<span style="font-size:20px">💧</span>';
      } else if (isSink(r, c)) {
        div.classList.add('sink');
        div.innerHTML = `<div style="text-align:center;line-height:1.15">
          <div style="font-size:15px">🏁</div>
          <div style="font-size:8px;font-weight:700;color:#5ab4ff;letter-spacing:.3px">IZLAZ</div>
        </div>`;
      } else {
        const t = grid[r][c];
        if (t && t !== 'empty') {
          const svg = TILES[t]?.svg;
          if (svg) div.innerHTML = makeSVG(svg, 30);
          div.classList.add(t === 'machine2' ? 'machine2' : t.startsWith('machine') ? 'machine' : 'placed');
        }
        div.addEventListener('click', () => {
          if (!running) return;
          const prev = grid[r][c];
          const next = (prev === selected) ? 'empty' : selected;
          const prevCost = TILES[prev]?.cost || 0;
          const nextCost = TILES[next]?.cost || 0;
          const newTotal = computeCost() - prevCost + nextCost;
          if (newTotal > MAX_COST) {
            showMessage(`Maksimalni trošak je ${MAX_COST}/s`);
            return;
          }
          grid[r][c] = next;
          renderGrid();
          updateStats();
        });
        div.addEventListener('contextmenu', e => {
          e.preventDefault();
          if (!running) return;
          grid[r][c] = 'empty';
          renderGrid();
          updateStats();
        });
      }
      el.appendChild(div);
    }
  }
  updateStats();
}

function renderPalette() {
  const el = document.getElementById('palette');
  el.innerHTML = '';
  for (const grp of GROUPS) {
    const items = Object.entries(TILES).filter(([,t]) => t.group === grp);
    if (!items.length) continue;
    const head = document.createElement('div');
    head.className = 'pal-head';
    head.textContent = grp;
    el.appendChild(head);
    for (const [id, t] of items) {
      const btn = document.createElement('button');
      btn.className = 'pal-btn' + (selected === id ? ' sel' : '');
      const icon = t.svg
        ? `<span class="pal-icon">${makeSVG(t.svg, 22)}</span>`
        : `<span class="pal-icon" style="font-size:16px">🗑</span>`;
      const cost = t.cost === 0
        ? `<span class="pal-cost free">besplatno</span>`
        : `<span class="pal-cost">−${t.cost}/s</span>`;
      btn.innerHTML = `${icon}<span style="flex:1">${t.label}</span>${cost}`;
      btn.onclick = () => { selected = id; renderPalette(); };
      el.appendChild(btn);
    }
  }
}

function showMessage(text) {
  const ov = document.getElementById('overlay');
  ov.innerHTML = `<div class="ov-box"><h2>${text}</h2></div>`;
  ov.style.display = 'flex';
  clearTimeout(ov._hide);
  ov._hide = setTimeout(() => { ov.style.display = 'none'; }, 900);
}

function updateStats() {
  const out  = computeOutput();
  const cost = computeCost();
  document.getElementById('s-out').textContent = out;
  const costEl = document.getElementById('s-cost');
  costEl.textContent = `${cost}/${MAX_COST}`;
  costEl.style.color = cost > MAX_COST ? '#d63e3e' : '';
  document.getElementById('s-total').textContent = totalScore.toLocaleString();
}

function startGame(name) {
  currentPlayer = name;
  totalScore = 0;
  document.getElementById('player-name-display').textContent = name;
  resetEndpoints();
  initGrid();
  running  = true;
  secsLeft = TOTAL_SECS;
  selected = 'pipe_h';
  renderGrid();
  renderPalette();
  document.getElementById('overlay').style.display = 'none';
  showScreen('screen-game');

  clearInterval(ticker);
  ticker = setInterval(() => {
    if (!running) return;
    const out  = computeOutput();
    const cost = computeCost();
    totalScore += out;
    secsLeft--;
    const pct = secsLeft / TOTAL_SECS * 100;
    document.getElementById('s-out').textContent = out;
    const costEl = document.getElementById('s-cost');
    costEl.textContent = `${cost}/${MAX_COST}`;
    costEl.style.color = cost > MAX_COST ? '#d63e3e' : '';
    document.getElementById('s-total').textContent = totalScore.toLocaleString();
    const bar = document.getElementById('timer-bar');
    bar.style.width = pct + '%';
    bar.style.background = pct > 50 ? '#1a7f5a' : pct > 20 ? '#c8820a' : '#d63e3e';
    const m = Math.floor(secsLeft / 60), s = secsLeft % 60;
    document.getElementById('s-time').textContent = `${m}:${s.toString().padStart(2,'0')}`;
    if (secsLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  running = false;
  clearInterval(ticker);
  const entry = {
    name:  currentPlayer,
    score: totalScore,
    date:  new Date().toISOString(),
  };
  saveScore(entry);
  renderLeaderboard(entry);
  showScreen('screen-lb');
}

function renderLeaderboard(highlight) {
  const scores = loadScores().sort((a,b) => b.score - a.score).slice(0, 15);
  const el = document.getElementById('lb-table');
  el.innerHTML = '';
  scores.forEach((s, i) => {
    const row = document.createElement('div');
    const medalClass = i===0?'gold':i===1?'silver':i===2?'bronze':'';
    const isNew = highlight
      && s.name  === highlight.name
      && s.score === highlight.score
      && s.date  === highlight.date;
    row.className = 'lb-row' + (medalClass?' '+medalClass:'') + (isNew?' new':'');
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
    const d = new Date(s.date);
    const dateStr = `${d.getDate()}.${d.getMonth()+1}. ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    row.innerHTML = `
      <span class="lb-rank">${medal}</span>
      <span class="lb-name">${s.name}</span>
      <span class="lb-score">${s.score.toLocaleString()}</span>
      <span class="lb-date">${dateStr}</span>
    `;
    el.appendChild(row);
  });
  if (!scores.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:#555">Nema rezultata još.</div>';
  }
}

document.getElementById('intro-start-btn').onclick = () => {
  const name = document.getElementById('intro-name').value.trim();
  if (!name) { document.getElementById('intro-name').focus(); return; }
  startGame(name);
};
document.getElementById('intro-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('intro-start-btn').click();
});
document.getElementById('quit-btn').onclick = () => {
  running = false;
  clearInterval(ticker);
  showScreen('screen-intro');
};
document.getElementById('lb-play-again').onclick = () => {
  showScreen('screen-intro');
  document.getElementById('intro-name').value = '';
};
document.getElementById('lb-export').onclick = exportJSON;

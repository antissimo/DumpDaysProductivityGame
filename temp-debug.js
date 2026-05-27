const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');
const start = code.indexOf('const TILES = {');
const end = code.indexOf('};', start) + 2;
const tilesText = code.slice(start + 'const TILES = '.length, end);
const TILES = eval('(' + tilesText + ')');
const COLS = 12, ROWS = 9;
const OPP = { l:'r', r:'l', u:'d', d:'u' };
const DELTA = { l:[0,-1], r:[0,1], u:[-1,0], d:[1,0] };
let SOURCES = [[4,0]], SINKS = [[4,4]];
let grid = Array.from({length: ROWS }, () => Array(COLS).fill('empty'));
function isSource(r,c){return SOURCES.some(([sr,sc])=>sr===r&&sc===c);}
function isSink(r,c){return SINKS.some(([sr,sc])=>sr===r&&sc===c);}
function getConn(r,c){ if (isSource(r,c)||isSink(r,c)) return {l:1,r:1,u:1,d:1}; const t = grid[r][c]; return (t && TILES[t]) ? TILES[t] : {l:0,r:0,u:0,d:0}; }
function computeOutput(){ let total = 0; function dfs(r,c,mult,visited){ if (isSink(r,c)){ total += mult; return; } let key; try{ key = r * COLS + c; if (visited.has(key)) return; visited.add(key); const cellType = grid[r][c]; const m = cellType === 'machine' ? 2 : cellType === 'machine2' ? 4 : 1; const conn = getConn(r,c); for(const dir of ['l','r','u','d']){ if(!conn[dir]) continue; const [dr,dc] = DELTA[dir]; const nr = r + dr, nc = c + dc; if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(!getConn(nr,nc)[OPP[dir]]) continue; dfs(nr,nc,mult*m,visited);} } finally { if(typeof key !== 'undefined') visited.delete(key); } } for(const [sr,sc] of SOURCES) dfs(sr,sc,1,new Set()); return total; }
grid[4][1] = 'pipe_h';
grid[4][2] = 'pipe_ne';
grid[3][2] = 'pipe_v';
grid[2][2] = 'pipe_h';
grid[2][3] = 'pipe_h';
console.log('conn 4,2 =', getConn(4,2));
console.log('conn 3,2 =', getConn(3,2));
console.log('conn 2,2 =', getConn(2,2));
console.log('output =', computeOutput());

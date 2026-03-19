// server.js — cobrinhaLAN Web Server
// Requer: npm install ws
// Rodar:  node server.js [porta=12345]
//
// Clientes conectam via WebSocket: ws://SEU-IP:12345

const WebSocket = require('ws');

const PORT      = parseInt(process.argv[2]) || 12345;
const GRID_W    = 30;
const GRID_H    = 30;
const MAX_PLAYERS = 4;
const TICK_MS   = 110; // ~9 ticks/s

const COLORS = ['#33e566', '#3d9dff', '#ff7a1a', '#f23490'];
const START_POSITIONS = [
  {x:4,  y:15}, {x:10, y:15},
  {x:16, y:15}, {x:22, y:15},
];

// ── State ─────────────────────────────────────────────────────────────────────
let players   = [];   // { ws, id, name, snake, score, alive }
let food      = {x:15, y:10};
let gameState = 'lobby'; // 'lobby' | 'playing' | 'gameover'
let tickTimer = null;

// ── Snake helpers ─────────────────────────────────────────────────────────────
function makeSnake(pid) {
  const p = START_POSITIONS[pid];
  return {
    body: [{ x: p.x, y: p.y }],
    dir: 'RIGHT',
    nextDir: 'RIGHT',
  };
}

function spawnFood() {
  const occupied = new Set();
  for (const p of players)
    if (p.alive) for (const b of p.snake.body) occupied.add(`${b.x},${b.y}`);
  for (let tries = 0; tries < 300; tries++) {
    const f = { x: Math.floor(Math.random()*GRID_W), y: Math.floor(Math.random()*GRID_H) };
    if (!occupied.has(`${f.x},${f.y}`)) { food = f; return; }
  }
}

const OPPOSITE = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT' };

// ── Broadcast ─────────────────────────────────────────────────────────────────
function broadcast(msg) {
  const raw = JSON.stringify(msg);
  for (const p of players)
    if (p.ws.readyState === WebSocket.OPEN) p.ws.send(raw);
}

function broadcastState() {
  broadcast({
    type: 'state',
    food,
    players: players.map(p => ({
      id:    p.id,
      name:  p.name,
      color: COLORS[p.id],
      score: p.score,
      alive: p.alive,
      body:  p.snake ? p.snake.body : [],
    })),
    gameState,
  });
}

// ── Game tick ─────────────────────────────────────────────────────────────────
function tick() {
  for (const p of players) {
    if (!p.alive) continue;
    const s = p.snake;

    // Apply direction (no 180 flip)
    if (s.nextDir !== OPPOSITE[s.dir]) s.dir = s.nextDir;

    const head = { ...s.body[0] };
    if      (s.dir==='UP')    head.y--;
    else if (s.dir==='DOWN')  head.y++;
    else if (s.dir==='LEFT')  head.x--;
    else                      head.x++;

    // Wall collision
    if (head.x<0||head.x>=GRID_W||head.y<0||head.y>=GRID_H) {
      p.alive = false;
      broadcast({ type:'death', id:p.id, name:p.name });
      continue;
    }

    // Self collision
    if (s.body.some(b => b.x===head.x && b.y===head.y)) {
      p.alive = false;
      broadcast({ type:'death', id:p.id, name:p.name });
      continue;
    }

    const ateFood = head.x===food.x && head.y===food.y;
    s.body.unshift(head);
    if (!ateFood) s.body.pop();
    else { p.score++; spawnFood(); }
  }

  // Cross-snake collision
  for (const p of players) {
    if (!p.alive) continue;
    const head = p.snake.body[0];
    for (const q of players) {
      if (q === p) continue;
      if (q.snake.body.some(b => b.x===head.x && b.y===head.y)) {
        p.alive = false;
        broadcast({ type:'death', id:p.id, name:p.name });
      }
    }
  }

  broadcastState();

  const anyAlive = players.some(p => p.alive);
  if (!anyAlive) {
    gameState = 'gameover';
    clearInterval(tickTimer);
    tickTimer = null;
    const winner = players.reduce((a,b) => a.score>=b.score ? a : b, players[0]);
    broadcast({ type:'gameover', winner: winner ? winner.name : '??', scores: players.map(p=>({name:p.name,score:p.score})) });
    console.log(`[cobrinhaLAN] Fim de jogo! Vencedor: ${winner?.name}`);
  }
}

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
  if (players.length >= MAX_PLAYERS || gameState === 'playing') {
    ws.send(JSON.stringify({ type:'reject', reason: gameState==='playing' ? 'Partida em andamento' : 'Sala cheia' }));
    ws.close();
    return;
  }

  const pid = players.length;
  const player = { ws, id:pid, name:`Jogador${pid}`, snake:makeSnake(pid), score:0, alive:true };
  players.push(player);
  console.log(`[cobrinhaLAN] Jogador ${pid} conectou. (${players.length}/${MAX_PLAYERS})`);

  ws.send(JSON.stringify({ type:'welcome', id:pid, color:COLORS[pid], maxPlayers:MAX_PLAYERS }));
  broadcastState();

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      switch (msg.type) {
        case 'setname':
          player.name = String(msg.name).slice(0,16) || player.name;
          broadcastState();
          break;
        case 'dir':
          if (['UP','DOWN','LEFT','RIGHT'].includes(msg.dir))
            player.snake.nextDir = msg.dir;
          break;
        case 'start':
          if (gameState==='lobby' && players.length>=1) {
            gameState = 'playing';
            spawnFood();
            broadcast({ type:'start', numPlayers:players.length });
            console.log(`[cobrinhaLAN] Jogo iniciado com ${players.length} jogadores!`);
            tickTimer = setInterval(tick, TICK_MS);
          }
          break;
        case 'restart':
          if (gameState==='gameover') {
            for (const p of players) {
              p.snake = makeSnake(p.id);
              p.score = 0;
              p.alive = true;
            }
            gameState = 'playing';
            spawnFood();
            broadcast({ type:'start', numPlayers:players.length });
            tickTimer = setInterval(tick, TICK_MS);
          }
          break;
      }
    } catch(e) { /* ignore bad messages */ }
  });

  ws.on('close', () => {
    console.log(`[cobrinhaLAN] Jogador ${player.id} (${player.name}) desconectou.`);
    player.alive = false;
    players = players.filter(p => p !== player);
    if (players.length === 0 && tickTimer) { clearInterval(tickTimer); tickTimer=null; gameState='lobby'; }
    broadcastState();
  });
});

// ── Também serve o index.html via HTTP ────────────────────────────────────────
const http = require('http');
const fs   = require('fs');
const path = require('path');

const httpServer = http.createServer((req, res) => {
  const file = path.join(__dirname, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('index.html not found'); return; }
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(data);
  });
});
httpServer.listen(8080, () => {
  console.log(`\n=== cobrinhaLAN ===`);
  console.log(`WebSocket : ws://localhost:${PORT}`);
  console.log(`Navegador : http://localhost:8080`);
  console.log(`\nCompartilhe o IP da sua máquina para jogar na rede local.`);
  console.log(`Ex: http://192.168.1.X:8080\n`);
});

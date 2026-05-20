import React, { useEffect, useRef, useState } from "react";

// Three built-in HTML5 games: Snake, 2048, Tic-Tac-Toe

export function BuiltinGame({ gameKey }) {
  if (gameKey === "snake") return <Snake />;
  if (gameKey === "2048") return <Game2048 />;
  if (gameKey === "tictactoe") return <TicTacToe />;
  return <div className="grid place-items-center h-full text-mono">Game key not found</div>;
}

function Snake() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const stateRef = useRef({ snake: [{ x: 10, y: 10 }], dir: { x: 1, y: 0 }, food: { x: 15, y: 10 } });
  useEffect(() => {
    const c = canvasRef.current; const ctx = c.getContext("2d");
    const S = 20; c.width = 600; c.height = 400;
    const cols = c.width / S, rows = c.height / S;
    let raf, last = 0;
    const onKey = (e) => {
      const d = stateRef.current.dir;
      if (e.key === "ArrowUp" && d.y === 0) stateRef.current.dir = { x: 0, y: -1 };
      if (e.key === "ArrowDown" && d.y === 0) stateRef.current.dir = { x: 0, y: 1 };
      if (e.key === "ArrowLeft" && d.x === 0) stateRef.current.dir = { x: -1, y: 0 };
      if (e.key === "ArrowRight" && d.x === 0) stateRef.current.dir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKey);
    const tick = (ts) => {
      if (ts - last > 100) {
        last = ts;
        const s = stateRef.current;
        const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
        if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || s.snake.some(p => p.x === head.x && p.y === head.y)) {
          setDead(true); return;
        }
        s.snake.unshift(head);
        if (head.x === s.food.x && head.y === s.food.y) {
          setScore((v) => v + 10);
          s.food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
        } else s.snake.pop();
        ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#FF003C"; ctx.fillRect(s.food.x * S, s.food.y * S, S - 1, S - 1);
        ctx.fillStyle = "#00FFA3"; s.snake.forEach(p => ctx.fillRect(p.x * S, p.y * S, S - 1, S - 1));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", onKey); };
  }, []);
  return (
    <div className="h-full w-full grid place-items-center" data-testid="builtin-snake">
      <div className="text-center">
        <div className="text-display text-2xl mb-2">Snake — Score: <span className="text-[var(--accent)]">{score}</span></div>
        <canvas ref={canvasRef} className="border border-[var(--accent)]/30 neon-border" />
        {dead && <div className="mt-4 text-display text-2xl text-[var(--negative)]">Game Over</div>}
        <div className="text-mono text-xs mt-3 text-[var(--text-muted)]">Use Arrow Keys</div>
      </div>
    </div>
  );
}

function Game2048() {
  const [board, setBoard] = useState(() => {
    const b = Array.from({ length: 4 }, () => Array(4).fill(0));
    add(b); add(b); return b;
  });
  const [score, setScore] = useState(0);
  function add(b) {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!b[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    b[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  function slide(row) {
    let a = row.filter(v => v); let gained = 0;
    for (let i = 0; i < a.length - 1; i++) {
      if (a[i] === a[i + 1]) { a[i] *= 2; gained += a[i]; a[i + 1] = 0; }
    }
    a = a.filter(v => v); while (a.length < 4) a.push(0);
    return { row: a, gained };
  }
  function move(dir) {
    const nb = board.map(r => [...r]); let gained = 0; let moved = false;
    const apply = (rowFn) => {
      for (let i = 0; i < 4; i++) {
        const before = rowFn(nb, i, "get");
        const { row, gained: g } = slide(before);
        gained += g;
        if (row.join() !== before.join()) moved = true;
        rowFn(nb, i, "set", row);
      }
    };
    const horiz = (b, i, mode, val) => { if (mode === "get") return b[i]; b[i] = val; };
    const horizR = (b, i, mode, val) => { if (mode === "get") return [...b[i]].reverse(); b[i] = [...val].reverse(); };
    const vert = (b, i, mode, val) => { if (mode === "get") return b.map(r => r[i]); val.forEach((v, j) => b[j][i] = v); };
    const vertR = (b, i, mode, val) => { if (mode === "get") return b.map(r => r[i]).reverse(); [...val].reverse().forEach((v, j) => b[j][i] = v); };
    if (dir === "L") apply(horiz);
    if (dir === "R") apply(horizR);
    if (dir === "U") apply(vert);
    if (dir === "D") apply(vertR);
    if (moved) { add(nb); setBoard(nb); setScore(s => s + gained); }
  }
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") move("L");
      if (e.key === "ArrowRight") move("R");
      if (e.key === "ArrowUp") move("U");
      if (e.key === "ArrowDown") move("D");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [board]); // eslint-disable-line
  const colors = { 0: "#0f1115", 2: "#1a1d24", 4: "#2a2f3a", 8: "#00FFA3", 16: "#00d68a", 32: "#FF5C00", 64: "#FFD700", 128: "#FF003C", 256: "#c084fc", 512: "#6ee7ff", 1024: "#fff", 2048: "#00FFA3" };
  return (
    <div className="h-full w-full grid place-items-center" data-testid="builtin-2048">
      <div className="text-center">
        <div className="text-display text-2xl mb-3">2048 — Score: <span className="text-[var(--accent)]">{score}</span></div>
        <div className="inline-grid grid-cols-4 gap-2 p-3 bg-[#0a0c10] rounded-xl">
          {board.flat().map((v, i) => (
            <div key={i} className="w-20 h-20 grid place-items-center rounded-md text-display text-2xl font-black" style={{ background: colors[v] || "#fff", color: v > 4 ? "#050505" : "#fff" }}>
              {v || ""}
            </div>
          ))}
        </div>
        <div className="text-mono text-xs mt-3 text-[var(--text-muted)]">Use Arrow Keys</div>
      </div>
    </div>
  );
}

function TicTacToe() {
  const [b, setB] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("X");
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const win = lines.find(l => b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]);
  const winner = win ? b[win[0]] : null;
  const click = (i) => {
    if (b[i] || winner) return;
    const nb = [...b]; nb[i] = turn; setB(nb); setTurn(turn === "X" ? "O" : "X");
  };
  const reset = () => { setB(Array(9).fill("")); setTurn("X"); };
  return (
    <div className="h-full w-full grid place-items-center" data-testid="builtin-tictactoe">
      <div className="text-center">
        <div className="text-display text-2xl mb-3">Tic-Tac-Toe — {winner ? `Winner: ${winner}` : `Turn: ${turn}`}</div>
        <div className="inline-grid grid-cols-3 gap-2">
          {b.map((v, i) => (
            <button key={i} onClick={() => click(i)} className="w-24 h-24 glass-strong text-display text-5xl font-black hover:border-[var(--accent)]" style={{ color: v === "X" ? "var(--accent)" : "#FF5C00" }}>{v}</button>
          ))}
        </div>
        <button onClick={reset} className="btn-accent mt-4">إعادة</button>
      </div>
    </div>
  );
}

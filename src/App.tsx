import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { Trophy, RotateCcw, Users, Cpu, Settings2, History } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getBestMove } from './lib/chessEngine';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Mode = 'PvP' | 'AI';
type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';

const PIECE_IMAGES: Record<string, string> = {
  wP: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  wN: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  wB: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  wR: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  wQ: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  wK: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  bP: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  bN: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  bB: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  bR: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  bQ: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  bK: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
};

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState<Mode>('AI');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const makeMove = useCallback((move: any) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setHistory(prev => [...prev, result.san]);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game]);

  useEffect(() => {
    if (mode === 'AI' && game.turn() === 'b' && !game.isGameOver()) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getBestMove(game, difficulty);
        if (aiMove) {
          makeMove(aiMove);
        }
        setIsAiThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game, mode, difficulty, makeMove]);

  const onSquareClick = (square: Square) => {
    if (game.isGameOver() || isAiThinking) return;

    if (selectedSquare) {
      const moveSuccessful = makeMove({
        from: selectedSquare,
        to: square,
        promotion: 'q', // Always promote to queen for simplicity
      });
      setSelectedSquare(null);
      if (moveSuccessful) return;
    }

    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setHistory([]);
    setSelectedSquare(null);
  };

  const getGameStatus = () => {
    if (game.isCheckmate()) return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`;
    if (game.isDraw()) return 'Draw!';
    if (game.isCheck()) return 'Check!';
    return `${game.turn() === 'w' ? "White's" : "Black's"} turn`;
  };

  const renderBoard = () => {
    const board = [];
    const squares = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let i = 7; i >= 0; i--) {
      for (let j = 0; j < 8; j++) {
        const squareName = `${squares[j]}${i + 1}` as Square;
        const piece = game.get(squareName);
        const isDark = (i + j) % 2 === 0;
        const isSelected = selectedSquare === squareName;

        board.push(
          <div
            key={squareName}
            onClick={() => onSquareClick(squareName)}
            className={cn(
              'square w-full h-full',
              isDark ? 'square-dark' : 'square-light',
              isSelected && 'square-selected'
            )}
          >
            {piece && (
              <img
                src={PIECE_IMAGES[`${piece.color}${piece.type.toUpperCase()}`]}
                alt={`${piece.color}${piece.type}`}
                className="piece-img"
              />
            )}
            {j === 0 && <span className="absolute left-0.5 top-0.5 text-[8px] opacity-40 select-none font-bold">{i + 1}</span>}
            {i === 0 && <span className="absolute right-0.5 bottom-0.5 text-[8px] opacity-40 select-none font-bold">{squares[j]}</span>}
          </div>
        );
      }
    }
    return board;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center gap-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          <Trophy className="text-yellow-500" /> 
          Grandmaster Pro
        </h1>
        <p className="text-zinc-400">Modern AI-Powered Chess Interface</p>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase flex items-center gap-2">
              <Settings2 size={16} /> Game Settings
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-300">Game Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(['PvP', 'AI'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); resetGame(); }}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm transition-all border",
                      mode === m ? "bg-zinc-100 text-zinc-950 border-white" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                    )}
                  >
                    {m === 'PvP' ? <Users size={14} className="inline mr-2" /> : <Cpu size={14} className="inline mr-2" />}
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'AI' && (
              <div className="space-y-2">
                <label className="text-sm text-zinc-300">AI Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-zinc-600"
                >
                  <option>Beginner</option>
                  <option>Easy</option>
                  <option>Hard</option>
                  <option>Master</option>
                </select>
              </div>
            )}

            <button
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-2 bg-red-950/30 text-red-400 border border-red-900/50 py-3 rounded-xl hover:bg-red-900/50 transition-colors"
            >
              <RotateCcw size={18} />
              Reset Match
            </button>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl space-y-4 hidden lg:block">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase flex items-center gap-2">
              <History size={16} /> Move History
            </h2>
            <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2 pr-2 custom-scrollbar">
              {history.map((move, i) => (
                <div key={i} className="text-xs bg-zinc-800/50 p-1.5 rounded text-zinc-400">
                  <span className="text-zinc-600 mr-2">{Math.floor(i / 2) + 1}.</span>
                  {move}
                </div>
              ))}
              {history.length === 0 && <span className="text-xs text-zinc-600">No moves yet</span>}
            </div>
          </section>
        </div>

        {/* Chess Board Container */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4 order-1 lg:order-2">
          <div className="w-full bg-zinc-900 p-2 rounded-t-xl border-x border-t border-zinc-800 flex justify-between px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-sm">{getGameStatus()}</span>
            </div>
            {isAiThinking && <span className="text-xs text-zinc-500 animate-pulse">AI is calculating...</span>}
          </div>
          <div className="chess-board shadow-2xl rounded overflow-hidden">
            {renderBoard()}
          </div>
          <div className="w-full flex justify-between text-xs text-zinc-500 px-2">
            <span>Captured Piece logic automated via chess.js</span>
            <span>Standard FIDE Rules</span>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-3 space-y-6 order-3">
           <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Trophy className={cn("w-8 h-8", game.isGameOver() ? "text-yellow-500" : "text-zinc-600")} />
              </div>
              <h3 className="text-xl font-bold">Match Result</h3>
              <p className="text-sm text-zinc-400 mt-2">
                {game.isGameOver() ? "The session has concluded." : "Game in progress..."}
              </p>
              {game.isGameOver() && (
                <button onClick={resetGame} className="mt-4 text-xs underline text-zinc-500">
                  Play Again
                </button>
              )}
           </div>
           
           <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 p-6 rounded-xl">
              <h3 className="text-indigo-400 font-bold mb-2">Pro Tips</h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                Control the center of the board (d4, d5, e4, e5) to dominate the match. 
                {mode === 'AI' && difficulty === 'Master' ? " Watch out! Master mode depth 4 is highly tactical." : ""}
              </p>
           </div>
        </div>
      </main>

      <footer className="mt-12 text-zinc-600 text-[10px] uppercase tracking-widest">
        Designed for Excellence • Powered by Vite
      </footer>
    </div>
  );
}

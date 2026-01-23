import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { Settings, Users, Cpu, Trophy, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getBestMove } from './utils/engine';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const PIECES: Record<string, string> = {
  'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
  'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚'
};

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState<'PvP' | 'AI'>('AI');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Easy' | 'Hard' | 'Master'>('Easy');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setMoveHistory(h => [...h, result.san]);
        if (game.isGameOver()) setIsGameOver(true);
        return true;
      }
    } catch (e) { return false; }
    return false;
  }, [game]);

  useEffect(() => {
    if (mode === 'AI' && game.turn() === 'b' && !isGameOver) {
      setIsAiThinking(true);
      setTimeout(() => {
        const aiMove = getBestMove(game, difficulty);
        makeMove(aiMove);
        setIsAiThinking(false);
      }, 500);
    }
  }, [game, mode, difficulty, isGameOver, makeMove]);

  const onSquareClick = (square: Square) => {
    if (isGameOver || isAiThinking) return;
    if (selectedSquare) {
      const success = makeMove({ from: selectedSquare, to: square, promotion: 'q' });
      setSelectedSquare(null);
      if (success) return;
    }
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) setSelectedSquare(square);
    else setSelectedSquare(null);
  };

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
    setIsGameOver(false);
    setSelectedSquare(null);
  };

  const board = game.board();
  const status = game.isCheckmate() ? 'Checkmate!' : game.isDraw() ? 'Draw!' : game.isCheck() ? 'Check!' : '';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-chess-dark p-2 rounded-lg">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Grandmaster Chess</h1>
        </div>
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl">
          <button onClick={() => setMode('PvP')} className={cn("px-4 py-2 rounded-lg flex items-center gap-2 transition-all", mode === 'PvP' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>
            <Users size={18} /> <span className="hidden sm:inline">Two Players</span>
          </button>
          <button onClick={() => setMode('AI')} className={cn("px-4 py-2 rounded-lg flex items-center gap-2 transition-all", mode === 'AI' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}>
            <Cpu size={18} /> <span className="hidden sm:inline">vs AI</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="grid grid-cols-8 grid-rows-8 w-[min(90vw,560px)] h-[min(90vw,560px)] border-4 border-zinc-800 rounded-sm overflow-hidden shadow-2xl">
              {board.map((row, i) => row.map((cell, j) => {
                const square = String.fromCharCode(97 + j) + (8 - i) as Square;
                const isDark = (i + j) % 2 === 1;
                const isSelected = selectedSquare === square;
                const lastMove = game.history({ verbose: true }).pop();
                const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
                
                return (
                  <div
                    key={square}
                    onClick={() => onSquareClick(square)}
                    className={cn(
                      "relative flex items-center justify-center text-[2.5rem] md:text-[3.5rem] cursor-pointer select-none transition-colors duration-200",
                      isDark ? "bg-chess-dark" : "bg-chess-light",
                      isSelected && "bg-chess-accent",
                      isLastMove && "ring-2 ring-inset ring-zinc-400 opacity-90"
                    )}
                  >
                    <span className={cn("z-10", cell?.color === 'w' ? "text-white drop-shadow-md" : "text-black drop-shadow-sm")}>
                      {cell ? PIECES[cell.color + cell.type] : ''}
                    </span>
                    {isSelected && <div className="absolute inset-0 bg-yellow-400/30" />}
                  </div>
                );
              }))}
            </div>
            {isGameOver && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-sm">
                <h2 className="text-4xl font-black mb-4">{game.turn() === 'w' ? 'Black Wins' : 'White Wins'}</h2>
                <p className="text-zinc-400 mb-6">{status}</p>
                <button onClick={resetGame} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                  <RotateCcw size={20} /> Play Again
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2"><Settings size={18} /> Game Settings</h3>
              <button onClick={resetGame} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"><RotateCcw size={18}/></button>
            </div>

            {mode === 'AI' && (
              <div className="space-y-4">
                <label className="text-sm text-zinc-500 uppercase tracking-widest">AI Difficulty</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Beginner', 'Easy', 'Hard', 'Master'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={cn(
                        "py-2 px-3 rounded-lg text-sm font-medium border transition-all",
                        difficulty === lvl ? "bg-zinc-100 text-zinc-900 border-white" : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm text-zinc-500 uppercase tracking-widest">History</h3>
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">{Math.ceil(moveHistory.length / 2)} Rounds</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {moveHistory.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-zinc-600 w-4">{i % 2 === 0 ? Math.floor(i / 2) + 1 + '.' : ''}</span>
                    <span className="text-zinc-300">{m}</span>
                  </div>
                ))}
                {isAiThinking && <div className="col-span-2 text-zinc-500 italic animate-pulse">AI is thinking...</div>}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", game.turn() === 'w' ? "bg-green-500" : "bg-zinc-700")} />
                <span className="text-sm font-medium">{game.turn() === 'w' ? 'White\'s Turn' : 'Black\'s Turn'}</span>
              </div>
              {status && <span className="text-xs font-bold text-red-500">{status}</span>}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Trophy, RefreshCw, Users, Cpu, History, ChevronRight, Settings2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getBestMove } from './lib/chess-ai';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [isPvP, setIsPvP] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('White to move');
  const [isThinking, setIsThinking] = useState(false);

  const makeAMove = useCallback(
    (move: any) => {
      try {
        const result = game.move(move);
        setGame(new Chess(game.fen()));
        setMoveHistory(game.history());
        return result;
      } catch (e) {
        return null;
      }
    },
    [game]
  );

  useEffect(() => {
    if (game.isCheckmate()) setStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    else if (game.isDraw()) setStatus('Draw!');
    else if (game.isCheck()) setStatus(`Check! ${game.turn() === 'w' ? 'White' : 'Black'} to move`);
    else setStatus(`${game.turn() === 'w' ? 'White' : 'Black'} to move`);

    if (!isPvP && game.turn() === 'b' && !game.isGameOver()) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        const bestMove = getBestMove(game, difficulty);
        if (bestMove) makeAMove(bestMove);
        setIsThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [game, isPvP, difficulty, makeAMove]);

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', 
    });
    if (move === null) return false;
    return true;
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 flex flex-col lg:flex-row items-center justify-center gap-8">
      <div className="w-full max-w-[600px] aspect-square shadow-2xl shadow-blue-500/10 rounded-lg overflow-hidden border border-zinc-800">
        <Chessboard 
          position={game.fen()} 
          onPieceDrop={onDrop} 
          boardOrientation={isPvP ? 'white' : 'white'}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
          }}
          customDarkSquareStyle={{ backgroundColor: '#27272a' }}
          customLightSquareStyle={{ backgroundColor: '#3f3f46' }}
        />
      </div>

      <div className="w-full max-w-[400px] flex flex-col gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Grandmaster AI
            </h1>
            <div className="p-2 bg-zinc-800 rounded-lg">
              <Settings2 className="w-5 h-5 text-zinc-400" />
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-zinc-800 rounded-lg">
            <button
              onClick={() => setIsPvP(false)}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                !isPvP ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Cpu size={16} /> AI Mode
            </button>
            <button
              onClick={() => setIsPvP(true)}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                isPvP ? "bg-zinc-700 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Users size={16} /> 2 Players
            </button>
          </div>

          {!isPvP && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Difficulty</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Beginner', 'Easy', 'Hard', 'Master'] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      "py-2 px-3 rounded-md text-xs font-semibold border transition-all",
                      difficulty === level
                        ? "bg-blue-500/10 border-blue-500 text-blue-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="py-4 border-y border-zinc-800">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                game.isGameOver() ? "bg-red-500" : "bg-green-500"
              )} />
              <p className="text-sm font-medium text-zinc-300">{isThinking ? 'AI is thinking...' : status}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetGame}
              className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={18} /> New Game
            </button>
            <button 
              onClick={() => { game.undo(); game.undo(); setGame(new Chess(game.fen())); }}
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              disabled={moveHistory.length === 0}
            >
              Undo
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex-1 flex flex-col min-h-[240px]">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-zinc-500" />
            <h2 className="font-semibold text-zinc-300">Move History</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 overflow-y-auto max-h-[200px] pr-2">
            {moveHistory.reduce((acc, move, i) => {
              if (i % 2 === 0) {
                acc.push(
                  <React.Fragment key={i}>
                    <div className="text-sm text-zinc-500 flex items-center gap-2">
                      <span className="w-4">{Math.floor(i / 2) + 1}.</span>
                      <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{move}</span>
                    </div>
                    {moveHistory[i + 1] && (
                      <div className="text-sm text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                        {moveHistory[i + 1]}
                      </div>
                    )}
                  </React.Fragment>
                );
              }
              return acc;
            }, [] as React.ReactNode[])}
            {moveHistory.length === 0 && (
              <p className="col-span-2 text-sm text-zinc-600 italic">No moves yet...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
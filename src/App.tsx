import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Trophy, RefreshCw, Settings2, Users, Cpu, Globe, ChevronLeft, History } from 'lucide-react';
import { getBestMove } from './lib/engine';
import { Difficulty, GameMode, PlayerColor } from './types/chess';

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w');
  const [status, setStatus] = useState('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const makeAMove = useCallback((move: any) => {
    try {
      const result = game.move(move);
      setGame(new Chess(game.fen()));
      setMoveHistory(game.history());
      return result;
    } catch (e) {
      return null;
    }
  }, [game]);

  useEffect(() => {
    if (mode === 'AI' && game.turn() !== playerColor && !game.isGameOver()) {
      setTimeout(() => {
        const aiMove = getBestMove(game, difficulty);
        makeAMove(aiMove);
      }, 600);
    }
    
    if (game.isGameOver()) {
      if (game.isCheckmate()) setStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
      else if (game.isDraw()) setStatus('Draw!');
      else setStatus('Game Over');
    } else {
      setStatus(`${game.turn() === 'w' ? "White's" : "Black's"} Turn`);
    }
  }, [game, mode, difficulty, playerColor, makeAMove]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (mode === 'AI' && game.turn() !== playerColor) return false;
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
    return move !== null;
  }

  const resetGame = () => {
    setGame(new Chess());
    setMoveHistory([]);
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Grandmaster</h1>
            <p className="text-zinc-500">Select your challenge level</p>
          </div>

          <div className="grid gap-4">
            <button onClick={() => setMode('Local')} className="group relative flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all">
              <Users className="w-6 h-6 text-blue-400" />
              <div className="text-left">
                <div className="font-semibold">Local Multiplayer</div>
                <div className="text-xs text-zinc-500">Play with a friend on one device</div>
              </div>
            </button>

            <button onClick={() => setMode('AI')} className="group relative flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all">
              <Cpu className="w-6 h-6 text-purple-400" />
              <div className="text-left">
                <div className="font-semibold">Versus AI</div>
                <div className="text-xs text-zinc-500">Test your skills against the engine</div>
              </div>
            </button>

            <button onClick={() => setMode('Multiplayer')} className="group relative flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all">
              <Globe className="w-6 h-6 text-emerald-400" />
              <div className="text-left">
                <div className="font-semibold">Online Multiplayer</div>
                <div className="text-xs text-zinc-500">Challenge players worldwide</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 lg:flex">
      {/* Game Sidebar / Controls */}
      <div className="lg:w-96 p-6 border-b lg:border-b-0 lg:border-r border-zinc-900 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode(null)} className="p-2 hover:bg-zinc-900 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-medium px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
            {mode} Mode
          </div>
          <button onClick={resetGame} className="p-2 hover:bg-zinc-900 rounded-lg transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {mode === 'AI' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Difficulty</label>
            <div className="grid grid-cols-2 gap-2">
              {(['Beginner', 'Easy', 'Hard', 'Master'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                    difficulty === d ? 'bg-zinc-100 text-zinc-950 border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 space-y-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="text-xs text-zinc-500 mb-1">Game Status</div>
            <div className="text-lg font-bold">{status}</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
              <History className="w-3 h-3" />
              <span>MOVE HISTORY</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm max-h-48 overflow-y-auto font-mono">
              {moveHistory.reduce((acc: any[], curr, i) => {
                if (i % 2 === 0) acc.push([curr]);
                else acc[acc.length - 1].push(curr);
                return acc;
              }, []).map((pair, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-zinc-600">{idx + 1}. {pair[0]}</span>
                  <span className="text-zinc-400">{pair[1] || ''}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <main className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-[600px] aspect-square shadow-2xl shadow-black/50">
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop} 
            boardOrientation={playerColor === 'w' ? 'white' : 'black'}
            customDarkSquareStyle={{ backgroundColor: '#27272a' }}
            customLightSquareStyle={{ backgroundColor: '#3f3f46' }}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            }}
          />
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { ChessBoard } from './components/ChessBoard';
import { getBestMove, Difficulty } from './lib/chessEngine';
import { supabase } from './lib/supabaseClient';
import { Swords, Bot, Users, Trophy, RotateCcw, Copy, LogOut, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type GameMode = 'local' | 'ai' | 'multiplayer';
type GameStatus = 'playing' | 'checkmate' | 'draw' | 'stalemate';

export default function App() {
  // Game State
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState<GameMode | null>(null);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  
  // Multiplayer State
  const [roomId, setRoomId] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  // UI State
  const [fen, setFen] = useState(game.fen());
  const [lastMove, setLastMove] = useState<{ from: string, to: string } | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Initialize Supabase Listener for Multiplayer
  useEffect(() => {
    if (mode === 'multiplayer' && roomId && supabase) {
      const channel = supabase.channel(`room:${roomId}`, { config: { broadcast: { self: true } } });
      
      channel.on('broadcast', { event: 'move' }, (payload) => {
        const { from, to, newFen } = payload.payload;
        // Apply move from opponent
        setGame(prev => {
          const clone = new Chess(prev.fen());
          try {
            clone.move({ from, to, promotion: 'q' });
            setFen(clone.fen());
            setLastMove({ from, to });
            checkGameOver(clone);
            return clone;
          } catch (e) {
            // Sync if drift occurs
            const syncGame = new Chess(newFen);
            setFen(newFen);
            return syncGame;
          }
        });
      }).subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
      });

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [mode, roomId]);

  // AI Turn Effect
  useEffect(() => {
    if (mode === 'ai' && game.turn() === 'b' && status === 'playing') {
      setIsAiThinking(true);
      setTimeout(() => {
        const bestMove = getBestMove(game, difficulty);
        if (bestMove) {
          safeMove(bestMove);
        }
        setIsAiThinking(false);
      }, 500);
    }
  }, [fen, mode, status]);

  const checkGameOver = (g: Chess) => {
    if (g.isCheckmate()) setStatus('checkmate');
    else if (g.isDraw()) setStatus('draw');
    else if (g.isStalemate()) setStatus('stalemate');
    else setStatus('playing');
  };

  const safeMove = (move: string | { from: string; to: string }) => {
    try {
      const result = game.move(typeof move === 'string' ? move : { ...move, promotion: 'q' });
      if (result) {
        setFen(game.fen());
        setLastMove({ from: result.from, to: result.to });
        checkGameOver(game);
        return true;
      }
    } catch (e) { return false; }
    return false;
  };

  const handleUserMove = (from: Square, to: Square) => {
    // Validate turn
    if (mode === 'ai' && game.turn() === 'b') return;
    if (mode === 'multiplayer' && game.turn() !== playerColor) return;
    if (status !== 'playing') return;

    const moveSuccess = safeMove({ from, to });
    
    if (moveSuccess && mode === 'multiplayer' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'move',
        payload: { from, to, newFen: game.fen() }
      });
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setStatus('playing');
    setLastMove(null);
  };

  const startMultiplayer = (isHost: boolean) => {
    if (!supabase) {
      alert('Supabase is not configured. Check .env');
      return;
    }
    const id = isHost ? Math.random().toString(36).substring(2, 7).toUpperCase() : prompt('Enter Room ID:');
    if (!id) return;
    
    setRoomId(id);
    setPlayerColor(isHost ? 'w' : 'b');
    setMode('multiplayer');
    resetGame();
  };

  // --- Render Views ---

  if (!mode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 space-y-8">
        <h1 className="text-5xl font-bold text-slate-100 mb-8 flex items-center gap-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          Chess Master
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {/* Local Mode */}
          <button 
            onClick={() => { setMode('local'); resetGame(); }}
            className="group p-8 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border-2 border-slate-700 hover:border-blue-500 flex flex-col items-center gap-4"
          >
            <Users className="w-16 h-16 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold">Pass & Play</span>
            <span className="text-slate-400 text-sm">Local multiplayer on one device</span>
          </button>

          {/* AI Mode */}
          <div className="group relative p-8 bg-slate-800 rounded-2xl border-2 border-slate-700 hover:border-emerald-500 flex flex-col items-center gap-4">
            <Bot className="w-16 h-16 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold">Vs Computer</span>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {(['Beginner', 'Easy', 'Hard', 'Master'] as Difficulty[]).map((d) => (
                <button 
                  key={d}
                  onClick={() => { setDifficulty(d); setMode('ai'); resetGame(); }}
                  className="px-3 py-1 text-xs rounded-full bg-slate-900 hover:bg-emerald-600 border border-slate-700 transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Online Mode */}
          <div className="group p-8 bg-slate-800 rounded-2xl border-2 border-slate-700 hover:border-purple-500 flex flex-col items-center gap-4">
            <Swords className="w-16 h-16 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-semibold">Online Multiplayer</span>
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => startMultiplayer(true)}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
              >
                Create Room
              </button>
              <button 
                onClick={() => startMultiplayer(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <button 
          onClick={() => { setMode(null); resetGame(); }}
          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Exit
        </button>
        
        <div className="flex items-center gap-4">
          {mode === 'ai' && <span className="text-emerald-400 font-medium">Vs AI ({difficulty})</span>}
          {mode === 'multiplayer' && (
            <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
              <span className="text-slate-400 text-sm">Room: <span className="text-white font-mono select-all">{roomId}</span></span>
              <button onClick={() => navigator.clipboard.writeText(roomId)} className="hover:text-blue-400"><Copy className="w-3 h-3"/></button>
              <div className={clsx("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500 animate-pulse")} />
            </div>
          )}
        </div>
      </header>

      {/* Game Content */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl justify-center">
        
        {/* Main Board */}
        <div className="flex-1 w-full max-w-[600px] mx-auto">
          <ChessBoard 
            game={game} 
            onMove={handleUserMove}
            orientation={mode === 'multiplayer' && playerColor === 'b' ? 'black' : 'white'}
            lastMove={lastMove}
            disabled={mode === 'ai' && isAiThinking}
          />
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Status Card */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Status
              {isAiThinking && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
            </h2>
            
            {status === 'playing' ? (
              <div className="flex items-center gap-3">
                <div className={clsx("w-4 h-4 rounded-full border-2 border-white/20", game.turn() === 'w' ? "bg-white" : "bg-black")} />
                <span className="text-lg">
                  {game.turn() === 'w' ? "White's Turn" : "Black's Turn"}
                </span>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-center font-bold text-xl">
                {status === 'checkmate' && `Winner: ${game.turn() === 'w' ? 'Black' : 'White'}`}
                {status === 'draw' && 'Draw'}
                {status === 'stalemate' && 'Stalemate'}
              </div>
            )}
            
            {(status !== 'playing' || mode === 'local') && (
              <button 
                onClick={resetGame}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> New Game
              </button>
            )}
          </div>

          {/* Captures or History could go here (Simplified for this version) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Instructions</h3>
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
              <li>Click a piece to select it.</li>
              <li>Click a valid square (marked with dot) to move.</li>
              {mode === 'multiplayer' && <li>Share the Room ID with a friend to play.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Swords, User, Brain, Globe, RefreshCw, ChevronLeft, Copy, Check } from 'lucide-react';
import { getBestMove } from './lib/engine';
import { supabase } from './lib/supabaseClient';

type GameMode = 'local' | 'ai' | 'online' | 'menu';
type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';

function App() {
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState<GameMode>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [playerId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [status, setStatus] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // --- Game Logic Helpers ---

  function makeAMove(move: any) {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      setGame(gameCopy);
      return result;
    } catch (e) {
      return null;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (mode === 'online') {
      if (game.turn() !== playerColor) return false;
    }

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move === null) return false;

    if (mode === 'ai') {
      setTimeout(makeRandomMove, 200);
    }

    if (mode === 'online' && onlineGameId) {
      updateOnlineGame(game.fen());
    }
    return true;
  }

  function makeRandomMove() {
    if (game.isGameOver() || game.isDraw()) return;
    const gameCopy = new Chess(game.fen());
    const move = getBestMove(gameCopy, difficulty);
    if (move) {
      makeAMove(move);
    }
  }

  // --- Online Logic ---

  async function createOnlineGame() {
    const { data, error } = await supabase
      .from('games')
      .insert([
        { 
          fen: game.fen(), 
          white_player_id: playerId, 
          status: 'waiting' 
        }
      ])
      .select()
      .single();

    if (data && !error) {
      setOnlineGameId(data.id);
      setPlayerColor('w');
      setMode('online');
      subscribeToGame(data.id);
    }
  }

  async function joinOnlineGame(id: string) {
    const { data, error } = await supabase
      .from('games')
      .select()
      .eq('id', id)
      .single();

    if (data && !error) {
      if (data.status !== 'waiting' && data.black_player_id !== playerId && data.white_player_id !== playerId) {
        alert('Game is full or finished');
        return;
      }

      // Join as black if not creator
      if (data.white_player_id !== playerId) {
        await supabase
          .from('games')
          .update({ black_player_id: playerId, status: 'playing' })
          .eq('id', id);
        setPlayerColor('b');
      } else {
        setPlayerColor('w');
      }

      setGame(new Chess(data.fen));
      setOnlineGameId(id);
      setMode('online');
      subscribeToGame(id);
    }
  }

  function subscribeToGame(id: string) {
    supabase
      .channel(`game:${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` }, (payload) => {
        const newFen = payload.new.fen;
        if (newFen !== game.fen()) {
          setGame(new Chess(newFen));
        }
      })
      .subscribe();
  }

  async function updateOnlineGame(fen: string) {
    if (!onlineGameId) return;
    await supabase
      .from('games')
      .update({ fen })
      .eq('id', onlineGameId);
  }

  const resetGame = () => {
    setGame(new Chess());
    if (mode === 'online' && onlineGameId) {
       updateOnlineGame(new Chess().fen());
    }
  };

  const copyInvite = () => {
    if (onlineGameId) {
      navigator.clipboard.writeText(onlineGameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (game.isGameOver()) setStatus('Game Over');
    else if (game.isCheck()) setStatus('Check');
    else setStatus('');
  }, [game]);


  // --- Render Views ---

  if (mode === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 space-y-8">
        <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
          Master Chess
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <button 
            onClick={() => setMode('local')} 
            className="p-8 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700 flex flex-col items-center gap-4 group"
          >
            <User className="w-12 h-12 text-blue-400 group-hover:scale-110 transition" />
            <span className="text-xl font-semibold">Pass & Play</span>
            <span className="text-slate-400 text-sm">Local multiplayer</span>
          </button>

          <button 
            onClick={() => setMode('ai')} 
            className="p-8 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700 flex flex-col items-center gap-4 group"
          >
            <Brain className="w-12 h-12 text-purple-400 group-hover:scale-110 transition" />
            <span className="text-xl font-semibold">Vs AI</span>
            <span className="text-slate-400 text-sm">Challenge the computer</span>
          </button>

          <button 
             onClick={() => { 
               const id = prompt("Enter Game ID to join, or leave empty to create new");
               if (id) joinOnlineGame(id);
               else createOnlineGame();
             }} 
            className="p-8 rounded-xl bg-slate-800 hover:bg-slate-700 transition border border-slate-700 flex flex-col items-center gap-4 group"
          >
            <Globe className="w-12 h-12 text-green-400 group-hover:scale-110 transition" />
            <span className="text-xl font-semibold">Online</span>
            <span className="text-slate-400 text-sm">Play with friends</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 mt-4">
        <button 
          onClick={() => { setMode('menu'); setGame(new Chess()); setOnlineGameId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
        >
          <ChevronLeft className="w-5 h-5" /> Menu
        </button>
        <h2 className="text-2xl font-bold text-white capitalize">
          {mode === 'ai' ? `Vs AI (${difficulty})` : mode === 'local' ? 'Pass & Play' : 'Online Match'}
        </h2>
        <div className="w-24"></div> {/* Spacer */}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
        {/* Chess Board */}
        <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800">
           <Chessboard 
             position={game.fen()} 
             onPieceDrop={onDrop} 
             boardOrientation={playerColor === 'w' ? 'white' : 'black'}
             customDarkSquareStyle={{ backgroundColor: '#779954' }}
             customLightSquareStyle={{ backgroundColor: '#e9edcc' }}
           />
        </div>

        {/* Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          
          {/* Game Status */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
             <h3 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-2">Status</h3>
             <div className="text-3xl font-bold text-white mb-2">
               {game.isGameOver() ? 'Game Over' : (game.turn() === 'w' ? 'White to Move' : 'Black to Move')}
             </div>
             {status && <div className="text-red-400 font-semibold">{status}</div>}
          </div>

          {/* AI Settings */}
          {mode === 'ai' && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h3 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-4">Difficulty</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['Beginner', 'Easy', 'Hard', 'Master'] as Difficulty[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition ${difficulty === level ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Online Info */}
          {mode === 'online' && onlineGameId && (
             <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                <h3 className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-2">Invite Code</h3>
                <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <code className="flex-1 text-sm text-yellow-500 font-mono">{onlineGameId}</code>
                  <button onClick={copyInvite} className="text-slate-400 hover:text-white transition">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
             </div>
          )}

          {/* Actions */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col gap-3">
             <button 
               onClick={resetGame}
               className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
             >
               <RefreshCw className="w-5 h-5" /> Reset Board
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
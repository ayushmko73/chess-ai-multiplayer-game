import React from 'react';
import { Chess, Square, Move } from 'chess.js';
import { clsx } from 'clsx';

interface ChessBoardProps {
  game: Chess;
  onMove: (from: Square, to: Square) => void;
  orientation?: 'white' | 'black';
  lastMove?: { from: string; to: string } | null;
  possibleMoves?: string[];
  disabled?: boolean;
}

const PieceIcon = ({ type, color }: { type: string; color: 'w' | 'b' }) => {
  const pieceMap: Record<string, string> = {
    pw: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Chess_plt45.svg',
    nw: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    bw: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    rw: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    qw: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    kw: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    pb: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    nb: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    bb: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    rb: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    qb: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    kb: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  };
  
  return (
    <img 
      src={pieceMap[`${type}${color}`]} 
      alt={`${color} ${type}`}
      className="w-full h-full p-1 select-none pointer-events-none"
    />
  );
};

export const ChessBoard: React.FC<ChessBoardProps> = ({ game, onMove, orientation = 'white', lastMove, disabled }) => {
  const [selectedSquare, setSelectedSquare] = React.useState<Square | null>(null);
  const board = game.board();
  
  // Flip board if playing as black
  const displayBoard = orientation === 'white' ? board : [...board].reverse().map(row => [...row].reverse());

  const getSquareName = (row: number, col: number): Square => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    if (orientation === 'black') {
      return `${files[7 - col]}${ranks[7 - row]}` as Square;
    }
    return `${files[col]}${ranks[row]}` as Square;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (disabled) return;
    
    const square = getSquareName(row, col);
    
    // If clicking same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    // If a square is already selected, try to move
    if (selectedSquare) {
      try {
        // Check if move is valid
        const moveAttempt = { from: selectedSquare, to: square, promotion: 'q' };
        const possibleMoves = game.moves({ verbose: true });
        const isValid = possibleMoves.find(m => m.from === selectedSquare && m.to === square);

        if (isValid) {
          onMove(selectedSquare, square);
          setSelectedSquare(null);
        } else {
          // If invalid move but clicked on own piece, select new piece
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      } catch (e) {
        setSelectedSquare(null);
      }
    } else {
      // Select piece
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  const isSelected = (r: number, c: number) => selectedSquare === getSquareName(r, c);
  
  const isLastMove = (r: number, c: number) => {
    if (!lastMove) return false;
    const sq = getSquareName(r, c);
    return sq === lastMove.from || sq === lastMove.to;
  };

  const isValidDestination = (r: number, c: number) => {
    if (!selectedSquare) return false;
    const dest = getSquareName(r, c);
    return game.moves({ verbose: true }).some(m => m.from === selectedSquare && m.to === dest);
  };

  return (
    <div className="grid grid-cols-8 border-4 border-slate-700 w-full max-w-[600px] aspect-square bg-slate-800 shadow-2xl rounded-lg overflow-hidden">
      {displayBoard.map((row, rIndex) =>
        row.map((piece, cIndex) => {
          const isBlackSq = (rIndex + cIndex) % 2 === 1;
          return (
            <div
              key={`${rIndex}-${cIndex}`}
              onClick={() => handleSquareClick(rIndex, cIndex)}
              className={clsx(
                'relative flex items-center justify-center cursor-pointer transition-colors duration-75',
                isBlackSq ? 'bg-slate-600' : 'bg-slate-300',
                isSelected(rIndex, cIndex) && 'ring-inset ring-4 ring-yellow-400 bg-yellow-200/50',
                isLastMove(rIndex, cIndex) && !isSelected(rIndex, cIndex) && 'bg-yellow-200/30',
                isValidDestination(rIndex, cIndex) && !piece && 'after:content-[""] after:w-3 after:h-3 after:bg-black/20 after:rounded-full',
                isValidDestination(rIndex, cIndex) && piece && 'ring-inset ring-4 ring-red-400/50'
              )}
            >
              {piece && <PieceIcon type={piece.type} color={piece.color} />}
              
              {/* Coordinates Overlay */}
              {cIndex === 0 && (
                <span className={clsx("absolute top-0 left-1 text-[10px] font-bold", isBlackSq ? "text-slate-300" : "text-slate-600")}>
                  {orientation === 'white' ? 8 - rIndex : rIndex + 1}
                </span>
              )}
              {rIndex === 7 && (
                <span className={clsx("absolute bottom-0 right-1 text-[10px] font-bold", isBlackSq ? "text-slate-300" : "text-slate-600")}>
                  {orientation === 'white' ? String.fromCharCode(97 + cIndex) : String.fromCharCode(104 - cIndex)}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

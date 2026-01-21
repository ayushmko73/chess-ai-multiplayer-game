import { Chess, Move } from 'chess.js';

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900
};

// Simplified Position Tables (Midgame) to encourage development
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 5, 5, -5, -5, 5, 5, 5],
  [1, 1, 2, 3, 3, 2, 1, 1],
  [0.5, 0.5, 1, 2.5, 2.5, 1, 0.5, 0.5],
  [0, 0, 0, 2, 2, 0, 0, 0],
  [0.5, -0.5, -1, 0, 0, -1, -0.5, 0.5],
  [0.5, 1, 1, -2, -2, 1, 1, 0.5],
  [0, 0, 0, 0, 0, 0, 0, 0]
];

const KNIGHT_TABLE = [
  [-5, -4, -3, -3, -3, -3, -4, -5],
  [-4, -2, 0, 0, 0, 0, -2, -4],
  [-3, 0, 1, 1.5, 1.5, 1, 0, -3],
  [-3, 0.5, 1.5, 2, 2, 1.5, 0.5, -3],
  [-3, 0, 1.5, 2, 2, 1.5, 0, -3],
  [-3, 0.5, 1, 1.5, 1.5, 1, 0.5, -3],
  [-4, -2, 0, 0.5, 0.5, 0, -2, -4],
  [-5, -4, -3, -3, -3, -3, -4, -5]
];

// Reverse tables for Black
const reverseArray = (array: number[][]) => [...array].reverse();

const evaluateBoard = (game: Chess): number => {
  let totalEvaluation = 0;
  const board = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        // Position bonus
        let positionBonus = 0;
        if (piece.type === 'p') positionBonus = piece.color === 'w' ? PAWN_TABLE[i][j] : PAWN_TABLE[7-i][j];
        if (piece.type === 'n') positionBonus = piece.color === 'w' ? KNIGHT_TABLE[i][j] : KNIGHT_TABLE[7-i][j];
        
        // Add random jitter for variety in equal positions
        const jitter = Math.random() * 0.1;

        if (piece.color === 'w') {
          totalEvaluation += (value + positionBonus + jitter);
        } else {
          totalEvaluation -= (value + positionBonus + jitter);
        }
      }
    }
  }
  return totalEvaluation;
};

const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  if (depth === 0 || game.isGameOver()) {
    return -evaluateBoard(game); // Negative because evaluation is from white's perspective usually, but here we simplify
  }

  const moves = game.moves();

  if (isMaximizingPlayer) {
    let bestEval = -9999;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      bestEval = Math.max(bestEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return bestEval;
  } else {
    let bestEval = 9999;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      bestEval = Math.min(bestEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return bestEval;
  }
};

export const getBestMove = (game: Chess, difficulty: string): string | null => {
  const possibleMoves = game.moves();
  if (possibleMoves.length === 0) return null;

  if (difficulty === 'Beginner') {
    // Random Move
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  }

  // Determine search depth
  let depth = 1;
  if (difficulty === 'Easy') depth = 1;
  if (difficulty === 'Hard') depth = 2;
  if (difficulty === 'Master') depth = 3;

  let bestMove = null;
  let bestValue = -99999;

  // We assume AI is Black usually in this simplified local engine if user is White
  // But for general purpose, let's detect turn.
  const isWhiteTurn = game.turn() === 'w';
  
  // If AI is playing, we maximize its own gain. 
  // Note: evaluateBoard returns positive for White advantage.
  // If AI is Black, it wants to Minimize evaluateBoard (Maximize Negative).
  
  // To simplify: we will just run minimax from the perspective of the current player
  // We need to adjust the evaluation function call inside minimax to respect side to move.

  // Reworking loop for generic Best Move Finder:
  
  const isMaximizing = isWhiteTurn;
  bestValue = isMaximizing ? -99999 : 99999;

  for (const move of possibleMoves) {
    game.move(move);
    // Look ahead
    // Note: evaluateBoard returns high for White. 
    const boardValue = minimax(game, depth - 1, -100000, 100000, !isMaximizing);
    game.undo();

    if (isMaximizing) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
  }

  return bestMove || possibleMoves[0];
};
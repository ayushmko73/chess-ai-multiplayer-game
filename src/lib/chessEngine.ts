import { Chess, Move } from 'chess.js';

export type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const evaluateBoard = (game: Chess) => {
  let totalEvaluation = 0;
  const board = game.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        totalEvaluation += piece.color === 'w' ? value : -value;
      }
    }
  }
  return totalEvaluation;
};

const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  if (depth === 0 || game.isGameOver()) {
    return -evaluateBoard(game);
  }

  const moves = game.moves();

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (game: Chess, difficulty: Difficulty): string | null => {
  const possibleMoves = game.moves();
  if (possibleMoves.length === 0) return null;

  if (difficulty === 'Beginner') {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }

  let bestMove = null;
  let bestValue = -Infinity;
  let depth = 2;

  if (difficulty === 'Easy') depth = 2;
  if (difficulty === 'Hard') depth = 3;
  if (difficulty === 'Master') depth = 3; // Keep 3 for performance in JS main thread, but could go 4 with worker

  // Sort moves to improve pruning (capture moves first usually helps)
  possibleMoves.sort(() => Math.random() - 0.5);

  for (const move of possibleMoves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -Infinity, Infinity, false);
    game.undo();
    
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove || possibleMoves[0];
};
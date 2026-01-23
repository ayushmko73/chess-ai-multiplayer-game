import { Chess, Move } from 'chess.js';

const pieceValues: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

const evaluateBoard = (game: Chess): number => {
  let totalEvaluation = 0;
  const board = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = pieceValues[piece.type] || 0;
        totalEvaluation += piece.color === 'w' ? value : -value;
      }
    }
  }
  return totalEvaluation;
};

const minimax = (
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): number => {
  if (depth === 0) return -evaluateBoard(game);

  const possibleMoves = game.moves();

  if (isMaximizingPlayer) {
    let bestEval = -9999;
    for (const move of possibleMoves) {
      game.move(move);
      bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      alpha = Math.max(alpha, bestEval);
      if (beta <= alpha) return bestEval;
    }
    return bestEval;
  } else {
    let bestEval = 9999;
    for (const move of possibleMoves) {
      game.move(move);
      bestEval = Math.min(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      beta = Math.min(beta, bestEval);
      if (beta <= alpha) return bestEval;
    }
    return bestEval;
  }
};

export const getBestMove = (game: Chess, difficulty: string): string | null => {
  const possibleMoves = game.moves();
  if (possibleMoves.length === 0) return null;

  if (difficulty === 'Beginner') {
    return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  }

  const depthMap: Record<string, number> = {
    Easy: 1,
    Hard: 2,
    Master: 3,
  };
  
  const depth = depthMap[difficulty] || 2;
  let bestMove = null;
  let bestValue = -9999;

  for (const move of possibleMoves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -10000, 10000, false);
    game.undo();
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove || possibleMoves[0];
};
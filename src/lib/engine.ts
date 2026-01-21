import { Chess, Move } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
  p: 10, r: 50, n: 30, b: 30, q: 90, k: 900,
};

// Simple Piece-Square Tables for positional evaluation
const PST: Record<string, number[][]> = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 5, 5, 5, 5, 5, 5, 5],
    [1, 1, 2, 3, 3, 2, 1, 1],
    [0.5, 0.5, 1, 2.5, 2.5, 1, 0.5, 0.5],
    [0, 0, 0, 2, 2, 0, 0, 0],
    [0.5, -0.5, -1, 0, 0, -1, -0.5, 0.5],
    [0.5, 1, 1, -2, -2, 1, 1, 0.5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ]
};

export const evaluateBoard = (game: Chess): number => {
  let totalEvaluation = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      totalEvaluation += getPieceValue(board[i][j], i, j);
    }
  }
  return totalEvaluation;
};

const getPieceValue = (piece: any, x: number, y: number): number => {
  if (piece === null) return 0;
  const absoluteValue = PIECE_VALUES[piece.type] || 0;
  return piece.color === 'w' ? absoluteValue : -absoluteValue;
};

export const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
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

export const getBestMove = (game: Chess, difficulty: string): string => {
  const possibleMoves = game.moves();
  if (possibleMoves.length === 0) return '';

  if (difficulty === 'Beginner') return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

  const depth = difficulty === 'Easy' ? 1 : difficulty === 'Hard' ? 2 : 3;
  let bestMove = '';
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
import { Chess, Move } from 'chess.js';

type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';

const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

const getPieceValue = (piece: any) => {
  if (!piece) return 0;
  const val = PIECE_VALUES[piece.type] || 0;
  return piece.color === 'w' ? val : -val;
};

const evaluateBoard = (game: Chess) => {
  let totalEvaluation = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      totalEvaluation += getPieceValue(board[i][j]);
    }
  }
  return totalEvaluation;
};

const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  if (depth === 0) return -evaluateBoard(game);

  const moves = game.moves();

  if (isMaximizingPlayer) {
    let bestEval = -9999;
    for (const move of moves) {
      game.move(move);
      bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      alpha = Math.max(alpha, bestEval);
      if (beta <= alpha) return bestEval;
    }
    return bestEval;
  } else {
    let bestEval = 9999;
    for (const move of moves) {
      game.move(move);
      bestEval = Math.min(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      beta = Math.min(beta, bestEval);
      if (beta <= alpha) return bestEval;
    }
    return bestEval;
  }
};

export const getBestMove = (game: Chess, difficulty: Difficulty): string | null => {
  const moves = game.moves();
  if (moves.length === 0) return null;

  if (difficulty === 'Beginner') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let depth = 2;
  if (difficulty === 'Hard') depth = 3;
  if (difficulty === 'Master') depth = 4;

  let bestMove = null;
  let bestValue = -9999;

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -10000, 10000, false);
    game.undo();
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
};
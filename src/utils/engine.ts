import { Chess, Move } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900
};

const PST: Record<string, number[][]> = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ]
};

const evaluateBoard = (game: Chess) => {
  let total = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        let val = PIECE_VALUES[piece.type] || 0;
        if (PST[piece.type]) val += PST[piece.type][piece.color === 'w' ? i : 7-i][j];
        total += (piece.color === 'w' ? val : -val);
      }
    }
  }
  return total;
};

const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
  if (depth === 0) return -evaluateBoard(game);
  const moves = game.moves();
  if (moves.length === 0) return game.isCheckmate() ? (isMaximizing ? -10000 : 10000) : 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, !isMaximizing));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, !isMaximizing));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
};

export const getBestMove = (game: Chess, difficulty: string): string | Move => {
  const moves = game.moves();
  if (difficulty === 'Beginner') return moves[Math.floor(Math.random() * moves.length)];
  
  const depth = difficulty === 'Easy' ? 1 : difficulty === 'Hard' ? 2 : 3;
  let bestMove = moves[0];
  let bestValue = -Infinity;

  for (const move of moves) {
    game.move(move);
    const boardValue = minimax(game, depth, -Infinity, Infinity, false);
    game.undo();
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }
  return bestMove;
};
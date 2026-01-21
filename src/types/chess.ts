export type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';
export type GameMode = 'Local' | 'AI' | 'Multiplayer';
export type PlayerColor = 'w' | 'b';

export interface GameState {
  fen: string;
  mode: GameMode;
  difficulty: Difficulty;
  isGameOver: boolean;
  winner: string | null;
  turn: PlayerColor;
  history: string[];
}
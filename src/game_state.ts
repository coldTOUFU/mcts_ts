export interface GameState<GameAction> {
  next(action: GameAction): GameState<GameAction>;

  legalActions(): GameAction[];

  isFinished(): boolean;

  getMyPlayerNum(): number;

  getScore(playerNum: number): number;

  getLastAction(): GameAction;
}

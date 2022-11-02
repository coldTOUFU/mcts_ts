import { GameState } from "./game_state";
import { NoActionsAllowedError, NoChildrenError } from "./monte_carlo_tree_node_error";

class MonteCarloTreeNode<GameAction> {
  /* 実行する節点を根とし、モンテカルロ木探索を実施して最善手を返す。 */
  public search(): GameAction {
    this.expand();
    /* 子節点がないことはあり得ないはず。 */
    if (this.children.length <= 0) {
      throw NoChildrenError;
    }

    /* 手が1つなら、それを出す。 */
    if (this.children.length == 1) {
      return this.children[0].currentState.getLastAction();
    }

    for (let searchCnt = 0; searchCnt < MonteCarloTreeNode.kSearchLimit; searchCnt++) {
      this.searchChild(searchCnt);
    }

    return this.selectChildAfterSearch().currentState.getLastAction();
  }

  private static kSearchLimit = 1000;
  private static kExpandThreshold = 3;
  private static kEvaluationMax = Infinity;

  private playerQuantity: number;
  private currentState: GameState<GameAction>;
  private children: MonteCarloTreeNode<GameAction>[] = [];
  private exploredCnt = 0;
  private sumScores: number[];
  private sumScoresSquared: number[];


  /* 1回の実行で、1回の根から葉までの探索を行い、得点を道を通じ逆伝播する。 */
  private searchChild(wholeSearchCnt: number): number[] {
    let result = <number[]>new Array(this.playerQuantity);

    this.exploredCnt++;

    /* 節点が葉の場合は、その結果を返す。 */
    if (this.currentState.isFinished()) {
      for (let i = 0; i < this.playerQuantity; i++) {
        result[i] = this.currentState.getScore(i);
        this.sumScores[i] += result[i];
        this.sumScoresSquared[i] = result[i] * result[i];
      }
      return result;
    }

    /* 子がおらず、十分この節点を探索した場合は、展開する。 */
    if (this.children.length <= 0 &&
        this.exploredCnt > MonteCarloTreeNode.kExpandThreshold) {
      this.expand();
    }

    /* 子がいれば、さらに探索してその結果を返す。いなければ、プレイアウトの結果を返す。 */
    if (this.children.length > 0) {
      const child = this.selectChildInSearch(wholeSearchCnt);
      result = child.searchChild(wholeSearchCnt);
    } else {
      result = this.playout();
    }

    for (let i = 0; i < this.playerQuantity; i++) {
      this.sumScores[i] += result[i];
      this.sumScoresSquared[i] = result[i] * result[i];
    }

    return result;
  }

  /* 探索中に、次に探索すべき子節点を返す。 */
  private selectChildInSearch(searchCnt: number): MonteCarloTreeNode<GameAction> {
    if (this.children.length <= 0) {
      throw NoChildrenError;
    }

    return this.children.reduce((preBestChild, curChild) => {
      return (preBestChild.evaluate(searchCnt) >= curChild.evaluate(searchCnt) ? preBestChild : curChild);
    }, this.children[0]);
  }

  private selectChildAfterSearch(): MonteCarloTreeNode<GameAction> {
    if (this.children.length <= 0) {
      throw NoChildrenError;
    }

    const myPlayerNum = this.currentState.getMyPlayerNum();

    return this.children.reduce((preBestChild, curChild) => {
      return (preBestChild.sumScores[myPlayerNum] >= curChild.sumScores[myPlayerNum] ? preBestChild : curChild);
    }, this.children[0]);
  }

  /* あり得る子局面すべてを子節点として追加。 */
  private expand(): void {
    const actions = this.currentState.legalActions();

    /* 何もできないということはあり得ない(パスはできるはず)。 */
    if (actions.length <= 0) {
      throw NoActionsAllowedError;
    }

    this.children = actions.map(action => {
      const state = this.currentState.next(action);
      return new MonteCarloTreeNode(state);
    });
  }

  /* プレイアウトを実施し、結果を返す。 */
  private playout(): number[] {
    let state = this.currentState; // TODO: cloneしよう。

    while (!state.isFinished()) {
      state = state.next();
    }

    let result = <number[]>new Array(this.playerQuantity);
    for (let i = 0; i < this.playerQuantity; i++) {
      result[i] = state.getScore(i);
    }

    return result;
  }

  private evaluate(wholeSearchCnt: number): number {
  }
}
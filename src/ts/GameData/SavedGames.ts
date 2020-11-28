import GameState, { SavedState } from "./GameState";

export default class SavedGames {
  static supported(): boolean {
    return typeof (Storage) !== "undefined";
  }

  static loadGame(): SavedState | null {
    if (!this.supported()) {
      return null;
    }

    const game = window.localStorage.getItem("saved_game");
    if (!game) {
      return null;
    }

    return JSON.parse(game);
  }

  static saveGame(state: GameState): boolean {
    if (!this.supported) {
      return false;
    }

    window.localStorage.setItem("saved_game", JSON.stringify(state.toSavedState()));
    return true;
  }

  static deleteGame() {
    window.localStorage.removeItem("saved_game");
  }
}

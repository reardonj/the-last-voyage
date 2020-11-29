import GameState, { SavedState } from "./GameState";

export default class SavedGames {
  static supported(): boolean {
    try {
      window.localStorage.setItem("supported", "true");
      return typeof (Storage) !== "undefined"
        && typeof (window.localStorage.getItem("test")) !== "undefined";
    }
    catch {
      return false;
    }
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
    if (!this.supported()) {
      return false;
    }

    window.localStorage.setItem("saved_game", JSON.stringify(state.toSavedState()));
    return true;
  }

  static deleteGame() {
    if (!this.supported()) {
      return;
    }
    window.localStorage.removeItem("saved_game");
  }

  static audioOn(): boolean {
    if (!this.supported()) {
      return false;
    }
    return (window.localStorage.getItem("audioOn") ?? "false") == "true"
  }

  static setAudioOn(on: boolean) {
    if (!this.supported()) {
      return;
    }
    window.localStorage.setItem("audioOn", on ? "true" : "false");
  }
}

/* 
Copyright 2020, Justin Reardon. 

This file is part of The Last Voyage.

The Last Voyage is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The Last Voyage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with The Last Voyage.  If not, see <https://www.gnu.org/licenses/>.
*/

import MissionLogs from "../Scenes/MissionLogs";
import GameState, { SavedState } from "./GameState";
import { initialLog, LogSummary } from "./MissionLog";

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

  static introShown(): boolean {
    if (!this.supported()) {
      return false;
    }
    return (window.localStorage.getItem("introShown") ?? "false") == "true"
  }

  static setIntroShown(shown: boolean) {
    if (!this.supported()) {
      return;
    }

    window.localStorage.setItem("introShown", shown ? "true" : "false");
  }

  static missionLogs(): LogSummary {
    if (!this.supported()) {
      return initialLog();
    }

    const logs = window.localStorage.getItem("mission_logs");
    if (!logs) {
      return initialLog();
    }

    return JSON.parse(logs);
  }

  static saveMissionLogs(logs: LogSummary) {
    if (!this.supported()) {
      return;
    }
    window.localStorage.setItem("mission_logs", JSON.stringify(logs));
  }
}

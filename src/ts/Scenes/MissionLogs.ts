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

import { AudioManager } from "../GameData/AudioManager";
import SavedGames from "../GameData/SavedGames";
import { StartTime } from "../Logic/Conversions";
import Utilities, { Colours, Fonts, UI } from "../Utilities";
import MainMenu from "./MainMenu";
import Transition from "./Transition";

export default class MissionLogs extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MissionLogs";

  public create(): void {
    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, Colours.PanelBackground, 1);
    AudioManager()?.changeBackground("opening");
    UI.centre(0, this.cameras.main.width,
      this.add.bitmapText(0, 150, Fonts.Proportional48, "Mission Logs").setTint(Colours.NeutralTint));

    const log = SavedGames.missionLogs();

    this.addEntry(320, 300, "Victories", log.victories.toFixed(0));
    this.addEntry(640, 300, "Posthumous Victories", log.posthumousVictories.toFixed(0));
    this.addEntry(960, 300, "Failures", log.failures.toFixed(0));
    this.addEntry(425, 400, "Quickest Victory", log.quickestVictory ? UI.createTimeString(log.quickestVictory - StartTime, 0, 0) : undefined);
    this.addEntry(855, 400, "Quickest Failure", log.quickestFailure ? UI.createTimeString(log.quickestFailure - StartTime, 0, 0) : undefined);

    const mainMenu = this.add.bitmapText(0, 550, Fonts.Proportional16, "[ Main Menu ]")
      .setTint(Colours.TextTint)
    UI.centre(0, this.cameras.main.width, mainMenu);
    UI.makeInteractive(mainMenu, true);
    mainMenu.on("pointerdown", () => {
      this.scene.add(MainMenu.Name, MainMenu, false);
      this.scene.sendToBack(MainMenu.Name);
      this.scene.transition({
        target: MainMenu.Name,
        duration: 300,
        remove: true
      });
      (<Transition>this.scene.get(Transition.Name)).startTransition(UI.TransitionLength);
    }, this);
  }

  private addEntry(x: number, y: number, title: string, value: string | undefined) {
    this.add.bitmapText(x, y, Fonts.Proportional24, title).setTint(Colours.NeutralTint).setOrigin(0.5, 0.5);
    this.add.bitmapText(x, y + 20, Fonts.Proportional16, value ?? "---").setTint(Colours.TextTint).setOrigin(0.5, 0.5);
  }

  public update(): void {
    // Update logic, as needed.
  }
}

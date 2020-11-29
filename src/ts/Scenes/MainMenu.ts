/* 
Portions copyright 2020, James Kemp.
Portions copyright 2020, Justin Reardon. 

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
import GameState from "../GameData/GameState";
import SavedGames from "../GameData/SavedGames";
import Utilities, { Colours, Fonts, Sprites, UI } from "../Utilities";
import MissionLogs from "./MissionLogs";
import SplashScreen from "./SplashScreen";
import Transition from "./Transition";

export default class MainMenu extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainMenu";

  public create(config: { animate?: boolean }): void {
    this.scene.sendToBack();
    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, Colours.PanelBackground, 1);
    AudioManager()?.changeBackground("opening");
    UI.centre(0, this.cameras.main.width,
      this.add.bitmapText(0, 150, Fonts.Proportional48, "The Last Voyage").setTint(Colours.NeutralTint));

    const lastSave = this.loadSave();
    if (lastSave) {
      this.addMenuItem(260, "Continue your voyage", () => {
        lastSave.transition(this)
      });
    } else {
      this.addMenuItem(260, "Launch the Sojourner", () => {
        const state = GameState.newGame(<Transition>this.scene.get(Transition.Name));
        state.transition(this);
      });
    }

    this.addMenuItem(328, "Mission Logs", () => {
      this.scene.add(MissionLogs.Name, MissionLogs, false).scene.sendToBack();
      this.scene.transition({
        target: MissionLogs.Name,
        duration: UI.TransitionLength,
        remove: true,
        allowInput: false
      });
      (<Transition>this.scene.get(Transition.Name)).startTransition(UI.TransitionLength);
    });

    this.addMenuItem(395, "Replay Intro", () => {
      this.scene.add(SplashScreen.Name, SplashScreen, false).scene.sendToBack();
      this.scene.transition({
        target: SplashScreen.Name,
        duration: UI.TransitionLength,
        remove: true,
        allowInput: false
      });
      (<Transition>this.scene.get(Transition.Name)).startTransition(UI.TransitionLength);
    });

    const controls = this.add.bitmapText(0, 460, Fonts.Proportional24, "Ship Controls").setTint(Colours.TextTint);
    UI.centre(0, this.cameras.main.width, controls);

    // Explanation
    this.add.bitmapText(320, 490, Fonts.Proportional16, "P to Pause\nHover for info\nClick on [ buttons ]").setTint(Colours.TextTint)

    // Thrust
    const thrust = this.add.bitmapText(610, 490, Fonts.Proportional16, "Thrust\nUp for main thrusters\nDown for reverse")
      .setTint(Colours.TextTint).setOrigin(0.5, 0);

    // Rotation
    const rotate = this.add.bitmapText(840, 490, Fonts.Proportional16, "Rotation\nRight for clockwise\nLeft for counterclockwise")
      .setTint(Colours.TextTint).setOrigin(0.5, 0);

    // Saves
    const saving = this.add.bitmapText(400, 550, Fonts.Proportional16,
      "Saves are automatic. There are no second chances. This is already our last shot.").setTint(Colours.WarningTint)
    UI.centre(0, this.cameras.main.width, saving);

    // Load animation
    if (config.animate) {
      this.cameras.main.y = 720;
      this.tweens.add({
        targets: this.cameras.main,
        y: 0,
        ease: 'cubic.inout',
        duration: 1500,
        delay: 100,
        repeat: 0,
      })
    }
  }

  private addMenuItem(y: number, text: string, action: Function) {
    const continueText = this.add.bitmapText(this.cameras.main.width / 2, y, Fonts.Proportional24, `[ ${text} ]`)
      .setOrigin(0.5, 0.5);
    UI.makeInteractive(continueText, true);
    continueText.on("pointerdown", action, this);
  }

  private loadSave(): GameState | null {
    try {
      const save = SavedGames.loadGame();
      return save ? new GameState(save, <Transition>this.scene.get(Transition.Name)) : null;
    } catch (e) {
      Utilities.Log("Failed to load saved game: " + e);
      return null;
    }
  }
}

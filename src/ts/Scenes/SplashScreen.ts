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
import SavedGames from "../GameData/SavedGames";
import { Colours, Fonts, UI } from "../Utilities";
import MainMenu from "./MainMenu";

export default class SplashScreen extends Phaser.Scene {
  public static Name = "SplashScreen";
  dying: Phaser.GameObjects.BitmapText;
  souls: Phaser.GameObjects.BitmapText;
  command: Phaser.GameObjects.BitmapText;
  shot: Phaser.GameObjects.BitmapText;
  start: Phaser.GameObjects.BitmapText;

  public create(): void {
    SavedGames.setIntroShown(true);

    this.dying = this.add.bitmapText(640, 200, Fonts.Proportional24, "The earth is dying...")
      .setTint(Colours.NeutralTint)
      .setOrigin(0.5, 0)
      .setMaxWidth(800)
      .setAlpha(0);

    this.souls = this.add.bitmapText(640, 270, Fonts.Proportional24,
      "But one million souls, and humanity's last hope for survival are launching for the stars aboard the Sojourner" +
      " - Earth's first, and last, interstellar voyager.")
      .setTint(Colours.NeutralTint)
      .setOrigin(0.5, 0)
      .setCenterAlign()
      .setMaxWidth(800)
      .setAlpha(0);

    this.command = this.add.bitmapText(640, 270, Fonts.Proportional24,
      "Take command of the Sojourner, scour the heavens for new Earths, and secure humanity's future.")
      .setTint(Colours.NeutralTint)
      .setOrigin(0.5, 0)
      .setMaxWidth(800)
      .setCenterAlign()
      .setAlpha(0);

    this.shot = this.add.bitmapText(640, 360, Fonts.Proportional24,
      "This is our last shot.")
      .setTint(Colours.NeutralTint)
      .setOrigin(0.5, 0)
      .setMaxWidth(800)
      .setCenterAlign()
      .setAlpha(0);

    if (SavedGames.introShown()) {
      this.runIntro();
    } else {
      this.start = this.add.bitmapText(640, 350, Fonts.Proportional16, "[ Click here to start ]")
        .setOrigin(0.5, 0.5)
        .setTint(Colours.TextTint)
      UI.makeInteractive(this.start, true);
      this.start.once("pointerdown", () => {
        this.runIntro();
      }, this);

      const skip = this.add.bitmapText(640, 370, Fonts.Proportional16, "[ Skip Intro ]")
        .setOrigin(0.5, 0.5)
        .setTint(Colours.TextTint);
      UI.makeInteractive(skip, true);
      skip.once("pointerdown", () => {
        this.loadMainMenu();
      }, this);
    }
  }

  private runIntro() {
    AudioManager()?.changeBackground("intro");
    // hide start button
    this.tweens.add({
      targets: this.start,
      alpha: { from: 1, to: 0 },
      duration: 500,
      ease: "Sin.easeOut",
    });

    // start at 2s, finish at 5s
    this.tweens.add({
      targets: this.dying,
      alpha: { from: 0, to: 1 },
      duration: 4000,
      delay: 2500,
      ease: "Sin.easeIn"
    });

    this.tweens.add({
      targets: this.souls,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      delay: 12000,
      ease: "Sin.easeIn",
      hold: 11000,
      yoyo: true
    });

    this.tweens.add({
      targets: this.command,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      delay: 25000,
      ease: "Sin.easeIn",
      hold: 11000,
      yoyo: true
    });

    this.tweens.add({
      targets: this.dying,
      alpha: { from: 1, to: 0 },
      duration: 3000,
      delay: 24000,
      ease: "Sin.easeOut",
    });

    this.tweens.add({
      targets: this.shot,
      alpha: { from: 0, to: 1 },
      duration: 1000,
      delay: 34000,
      ease: "Sin.easeIn",
      hold: 5000,
      yoyo: true
    });

    this.time.addEvent({
      // next track
      delay: 23000,
      callback: () => AudioManager()?.changeBackground("opening"),
      callbackScope: this,
      loop: false
    });

    this.time.addEvent({
      // Load the main menu after completion
      delay: 42000,
      callback: this.loadMainMenu,
      callbackScope: this,
      loop: false
    });
  }

  /**
   * Load the next scene, the main menu.
   */
  private loadMainMenu(): void {
    this.scene.add(MainMenu.Name, MainMenu, false);
    this.scene.start(MainMenu.Name, { animate: true });
  }
}

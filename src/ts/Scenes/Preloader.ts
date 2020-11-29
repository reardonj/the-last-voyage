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

import { audioAssets, AudioManager, AudioScene } from "../GameData/AudioManager";
import SavedGames from "../GameData/SavedGames";
import { Colours, Fonts, Sprites } from "../Utilities";
import MainMenu from "./MainMenu";
import SplashScreen from "./SplashScreen";

export default class Preloader extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Preloader";
  progressAnimation: Phaser.Tweens.Tween;

  public preload(): void {
    this.addProgressBar();

    this.load.path = "assets/";
    this.load.image(Sprites.Civilization, "civilization.png");
    this.load.image(Sprites.Dot, "dot.png");
    this.load.image(Sprites.Sun, "sun.png");
    this.load.image(Sprites.Planet, "planet.png");
    this.load.image(Sprites.Ship, "ship.png");
    this.load.image(Sprites.ShortGradient, "short-gradient.png");
    this.load.bitmapFont(Fonts.Proportional48, "fonts/kenvector_future_thin_48.png", "fonts/kenvector_future_thin_48.xml");
    this.load.bitmapFont(Fonts.Proportional24, "fonts/kenvector_future_thin_24.png", "fonts/kenvector_future_thin_24.xml");
    this.load.bitmapFont(Fonts.Proportional16, "fonts/kenvector_future_thin_16.png", "fonts/kenvector_future_thin_16.xml");

    for (const [key, file] of audioAssets()) {
      this.load.audio(key, file);
    }
  }

  public create(): void {
  }

  /**
   * Adds a progress bar to the display, showing the percentage of assets loaded and their name.
   */
  private addProgressBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const drawingColour = Colours.NeutralTint;

    const progressBar = this.add.graphics();
    progressBar
      .lineStyle(2, drawingColour)
      .fillStyle(0, 1)
      .beginPath()
      .arc(0, 0, 50, 0.25 + Math.PI * 0.5, Math.PI * 2.5 - 0.25)
      .strokePath()
      .fillCircle(0, 50, 14)
      .strokeCircle(0, 48, 10)
      .setPosition(width / 2, height / 2)
    this.progressAnimation = this.tweens.add({
      targets: progressBar,
      rotation: { from: 0, to: Math.PI * 2 },
      duration: 4000,
      repeat: -1
    })

    this.load.on("complete", () => {
      this.tweens.add({
        targets: progressBar,
        alpha: { from: 1, to: 0 },
        duration: 1000,
        completeDelay: 100,
        onComplete: () => {
          this.scene.run(AudioScene.Name)
          if (SavedGames.introShown()) {
            this.scene.add(MainMenu.Name, MainMenu, false);
            this.scene.start(MainMenu.Name, { animate: true });
          } else {
            this.scene.add(SplashScreen.Name, SplashScreen, false);
            this.scene.start(SplashScreen.Name);
          }
          progressBar.destroy();
        },
        onCompleteScope: this
      });
    });
  }
}

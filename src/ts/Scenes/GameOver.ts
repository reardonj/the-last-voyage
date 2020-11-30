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
import GameState, { Events, GameOverState } from "../GameData/GameState";
import { updateLog } from "../GameData/MissionLog";
import SavedGames from "../GameData/SavedGames";
import { YearInMinutes } from "../Logic/Conversions";
import { Colours, Fonts, Resources, UI } from "../Utilities";
import Hud from "./Hud";
import MainMenu from "./MainMenu";

export default class GameOver extends Phaser.Scene {
  static Name = "GameOver";

  private launchYear: number | undefined = undefined;
  private yearsPassed: number = 0;
  mainMenu: Phaser.GameObjects.BitmapText;

  public create(state: GameState): void {
    state.watch(Events.InterstellarLaunch, () => this.launchYear = this.yearsPassed, this);
    this.events.on('transitioncomplete',
      () => {
        this.scene.stop(Hud.Name);
        SavedGames.deleteGame();
      }, this);

    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 1);
    const title = this.add.bitmapText(0, 200, Fonts.Proportional24, "Your Voyage has Ended", 32)
      .setTint(Colours.TextTint)
      .setAlpha(0);
    UI.centre(0, this.cameras.main.width, title);

    const reason = this.add
      .bitmapText(0, 250, Fonts.Proportional24, this.getReasonText(state), undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
      .setMaxWidth(600)
      .setTint(Colours.TextTint)
      .setAlpha(0);
    UI.centre(0, this.cameras.main.width, reason);

    this.mainMenu = this.add.bitmapText(0, 0, Fonts.Proportional16, "[ Main Menu ]", undefined)
      .setTint(Colours.TextTint)
      .setAlpha(0);
    this.mainMenu.setY(reason.y + reason.height + 24);
    UI.centre(0, this.cameras.main.width, this.mainMenu);
    UI.makeInteractive(this.mainMenu, true);
    this.mainMenu.on("pointerdown", () => {
      this.scene.add(MainMenu.Name, MainMenu, false);
      this.scene.sendToBack(MainMenu.Name);
      this.scene.transition({
        target: MainMenu.Name,
        duration: 300,
        remove: true
      });
      state.transitionScene.startTransition(UI.TransitionLength);
    }, this);


    this.tweens.add({
      targets: title,
      alpha: { from: 0, to: 1 },
      ease: 'Sin',
      duration: 3000,
      repeat: 0,
      delay: 1300
    });
    this.tweens.add({
      targets: reason,
      alpha: { from: 0, to: 1 },
      ease: 'Sin',
      duration: 3000,
      repeat: 0,
      delay: 4000
    });

    if (this.isWin(state)) {
      this.yearsPassed = 501;
      SavedGames.saveMissionLogs(updateLog(SavedGames.missionLogs(), "victory", this.endTime(state)));
      this.tweens.add({
        targets: this.mainMenu,
        alpha: { from: 0, to: 1 },
        ease: 'Sin',
        duration: 500,
        repeat: 0,
        delay: 6800
      });
    }
  }

  private getReasonText(state: GameState): string {
    switch ((<GameOverState>state.currentScene[1]).reason) {
      case "fuel":
        return Resources.GameOver.Fuel;
      case "integrity":
        return Resources.GameOver.Integrity;
      case "resign":
        return Resources.GameOver.Resign;
      case "victory":
        return Resources.GameOver.Victory;
    }
  }

  private isWin(state: GameState): boolean {
    switch ((<GameOverState>state.currentScene[1]).reason) {
      case "victory":
        return true;
      default:
        return false;
    }
  }

  private endTime(state: GameState): number {
    return (<GameOverState>state.currentScene[1]).time;
  }

  public update(time: number): void {
    if (this.yearsPassed === 501) {
      return;
    }

    // Advance the game state to see if a civilization succeeds.
    const gameState = <GameState>this.scene.settings.data;
    if (!this.launchYear && this.yearsPassed < 500) {
      for (let i = 0; i < 10 && !this.launchYear; i++) {
        gameState.timeStep(0, 0, YearInMinutes, YearInMinutes);
        this.yearsPassed++;
      }
    }

    if (this.launchYear) {
      const year = this.launchYear + Phaser.Math.Between(80, 200);
      SavedGames.saveMissionLogs(updateLog(SavedGames.missionLogs(), "posthumous", year * YearInMinutes + this.endTime(gameState)));
      this.yearsPassed = 501;
      this.time.addEvent({
        delay: 15000,
        callback: () => this.showPosthumousVictory(year),
        callbackScope: this,
        loop: false
      })
    } else if (this.yearsPassed === 500) {
      const ending = (<GameOverState>gameState.currentScene[1]).reason === "resign" ? "resigned" : "failure";
      SavedGames.saveMissionLogs(updateLog(SavedGames.missionLogs(), ending, this.endTime(gameState)));
      this.yearsPassed = 501;
      this.tweens.add({
        targets: this.mainMenu,
        alpha: { from: 0, to: 1 },
        ease: 'Sin',
        duration: 500,
        repeat: 0,
        delay: 6000
      });
    }

  }

  showPosthumousVictory(years: number) {
    AudioManager()?.changeBackground("victory");
    const posthumousText = `But after ${years} years a new interstellar voyager from one of your colonies finally locates and recovers what remains of the Sojourner. ` +
      "You didn't get to see it, but your mission was a success.";
    const posthumous = this.add
      .bitmapText(0, this.mainMenu.y, Fonts.Proportional24, posthumousText, undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
      .setMaxWidth(600)
      .setTint(Colours.TextTint)
      .setAlpha(0);
    UI.centre(0, this.cameras.main.width, posthumous);
    this.mainMenu.y = posthumous.y + posthumous.height + 24;

    this.tweens.add({
      targets: posthumous,
      alpha: { from: 0, to: 1 },
      ease: 'Sin',
      duration: 3000,
      repeat: 0
    });
    this.tweens.add({
      targets: this.mainMenu,
      alpha: { from: 0, to: 1 },
      ease: 'Sin',
      duration: 500,
      repeat: 0,
      delay: 6800
    });
  }
}

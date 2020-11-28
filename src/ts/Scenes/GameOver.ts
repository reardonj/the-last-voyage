import GameState, { GameOverState } from "../GameData/GameState";
import SavedGames from "../GameData/SavedGames";
import { Colours, Fonts, Resources, UI } from "../Utilities";
import Hud from "./Hud";
import MainMenu from "./MainMenu";

export default class GameOver extends Phaser.Scene {
  static Name = "GameOver";

  public create(state: GameState): void {
    this.events.on('transitioncomplete',
      () => {
        this.scene.stop(Hud.Name);
        SavedGames.deleteGame();
      }, this);

    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 1);
    const title = this.add.bitmapText(0, 200, Fonts.Proportional24, "Your Journey has Ended", 32)
      .setTint(Colours.TextTint)
      .setAlpha(0);
    UI.centre(0, this.cameras.main.width, title);

    const reason = UI.centre(0, this.cameras.main.width,
      this.add.bitmapText(0, 250, Fonts.Proportional24, this.getReasonText(state), undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
        .setMaxWidth(600)
        .setTint(Colours.TextTint)
        .setAlpha(0));

    const mainMenu = this.add.bitmapText(0, 680, Fonts.Proportional16, "[ Main Menu ]", undefined)
      .setTint(Colours.TextTint)
      .setAlpha(0);
    UI.centre(0, this.cameras.main.width, mainMenu);
    UI.makeInteractive(mainMenu);
    mainMenu.on("pointerdown", () => {
      this.scene.add(MainMenu.Name, MainMenu, false);
      this.scene.sendToBack(MainMenu.Name);
      this.scene.transition({
        target: MainMenu.Name,
        duration: 300,
        remove: true
      });
      state.transitionScene.startTransition(300);
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
    this.tweens.add({
      targets: mainMenu,
      alpha: { from: 0, to: 1 },
      ease: 'Sin',
      duration: 500,
      repeat: 0,
      delay: 6800
    });
  }

  private getReasonText(state: GameState): string {
    switch ((<GameOverState>state.currentScene[1]).reason) {
      case "fuel":
        return Resources.GameOver.Fuel;
      case "integrity":
        return Resources.GameOver.Integrity;
      case "victory":
        return Resources.GameOver.Victory;
    }
  }

  public update(): void {

  }
}

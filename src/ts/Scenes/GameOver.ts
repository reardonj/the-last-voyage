import GameState, { GameOverState } from "../GameData/GameState";
import { Colours, Fonts, Resources, UI } from "../Utilities";
import Hud from "./Hud";
import MainMenu from "./MainMenu";

export default class GameOver extends Phaser.Scene {
  static Name = "GameOver";

  public create(state: GameState): void {
    this.events.on('transitioncomplete', () => this.scene.stop(Hud.Name), this);

    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 1);
    const title = this.add.bitmapText(0, 200, Fonts.Proportional24, "Game Over", 32)
      .setTint(Colours.TextTint);
    UI.centre(0, this.cameras.main.width, title);

    let reason = "";
    switch ((<GameOverState>state.currentScene[1]).reason) {
      case "fuel":
        reason = Resources.GameOver.Fuel
    }

    UI.centre(0, this.cameras.main.width,
      this.add.bitmapText(0, 250, Fonts.Proportional24, reason, undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
        .setTint(Colours.TextTint));

    const mainMenu = this.add.bitmapText(0, 680, Fonts.Proportional16, "[ Main Menu ]", undefined).setTint(Colours.TextTint);
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
  }

  public update(): void {

  }
}

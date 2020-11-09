import GameState, { GameOverState } from "../GameData/GameState";
import { Colours, Fonts, Resources } from "../Utilities";
import Hud from "./Hud";

export default class GameOver extends Phaser.Scene {
  static Name = "GameOver";

  public create(state: GameState): void {
    this.events.on('transitioncomplete', () => this.scene.stop(Hud.Name), this);

    this.add.rectangle(0, 0, this.cameras.main.width * 2, this.cameras.main.height * 2, 0x000000, 1);
    const title = this.add.bitmapText(0, 200, Fonts.Proportional24, "Game Over", 32)
      .setTint(Colours.TextTint);
    title.setX(this.cameras.main.width / 2 - title.width / 2);
    let reason = "";
    switch ((<GameOverState>state.currentScene[1]).reason) {
      case "fuel":
        reason = Resources.GameOver.Fuel
    }

    const reasonText =
      this.add.bitmapText(0, 250, Fonts.Proportional24, reason, undefined, Phaser.GameObjects.BitmapText.ALIGN_CENTER)
        .setTint(Colours.TextTint);
    reasonText.setX(this.cameras.main.width / 2 - reasonText.width / 2);
  }

  public update(): void {

  }
}

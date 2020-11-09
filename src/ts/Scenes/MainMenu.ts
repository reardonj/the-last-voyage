import GameState from "../GameData/GameState";
import Utilities, { Colours, Fonts } from "../Utilities";
import Hud from "./Hud";
import SolarSystemNavigation from "./SolarSystemNavigation";
import Transition from "./Transition";

export default class MainMenu extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainMenu";

  public create(): void {
    this.add.rectangle(0, 0, this.cameras.main.width * 2, this.cameras.main.height * 2, 0x000000, 1);

    const newGameText = this.add.bitmapText(0, 200, Fonts.Proportional24, "A New Beginning", 32).setTint(Colours.TextTint);
    newGameText.setX(this.cameras.main.width / 2 - newGameText.width / 2);
    newGameText.setInteractive({ useHandCursor: true });
    newGameText.on("pointerdown", () => {
      const state = GameState.newGame(<Transition>this.scene.get(Transition.Name));
      state.transition(this);
    }, this);

  }

  public update(): void {
    // Update logic, as needed.
  }
}

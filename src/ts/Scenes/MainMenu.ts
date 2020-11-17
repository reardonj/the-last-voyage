import GameState from "../GameData/GameState";
import SavedGames from "../GameData/SavedGames";
import Utilities, { Colours, Fonts, UI } from "../Utilities";
import Hud from "./Hud";
import SolarSystemNavigation from "./SolarSystemNavigation";
import Transition from "./Transition";

export default class MainMenu extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainMenu";

  public create(): void {
    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 1);
    const newGameText = this.add.bitmapText(0, 200, Fonts.Proportional24, "[ A New Beginning ]", 32);
    UI.centre(0, this.cameras.main.width, newGameText);
    UI.makeInteractive(newGameText);
    newGameText.on("pointerdown", () => {
      const state = GameState.newGame(<Transition>this.scene.get(Transition.Name));
      state.transition(this);
    }, this);

    const lastSave = this.loadSave();
    if (lastSave) {
      const continueText = this.add.bitmapText(0, 250, Fonts.Proportional24, "[ Continue Your Journey ]", 32);
      UI.centre(0, this.cameras.main.width, continueText);
      UI.makeInteractive(continueText);
      continueText.on("pointerdown", () => {
        lastSave.transition(this);
      }, this);
    }
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

  public update(): void {
    // Update logic, as needed.
  }
}

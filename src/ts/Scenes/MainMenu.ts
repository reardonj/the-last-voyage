import { AudioManager } from "../GameData/AudioManager";
import GameState from "../GameData/GameState";
import SavedGames from "../GameData/SavedGames";
import Utilities, { Colours, Fonts, Sprites, UI } from "../Utilities";
import Transition from "./Transition";

export default class MainMenu extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainMenu";

  public create(): void {
    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, 0x000000, 1);
    AudioManager()?.changeBackground("opening");
    UI.centre(0, this.cameras.main.width,
      this.add.bitmapText(0, 150, Fonts.Proportional48, "The Last Voyage").setTint(Colours.NeutralTint));

    const lastSave = this.loadSave();
    if (lastSave) {
      const continueText = this.add.bitmapText(0, 250, Fonts.Proportional24, "[ Continue Your Voyage ]");
      UI.centre(0, this.cameras.main.width, continueText);
      UI.makeInteractive(continueText, true);
      continueText.on("pointerdown", () => {
        lastSave.transition(this);
      }, this);
    } else {
      const newGameText = this.add.bitmapText(0, 250, Fonts.Proportional24, "[ Launch the Sojourner ]");
      UI.centre(0, this.cameras.main.width, newGameText);
      UI.makeInteractive(newGameText, true);
      newGameText.on("pointerdown", () => {
        const state = GameState.newGame(<Transition>this.scene.get(Transition.Name));
        state.transition(this);
      }, this);
    }

    const controls = this.add.bitmapText(0, 550, Fonts.Proportional24, "Ship Controls").setTint(Colours.NeutralTint);
    UI.centre(0, this.cameras.main.width, controls);

    // Explanation
    this.add.bitmapText(320, 580, Fonts.Proportional16, "P to Pause\nHover for info\nClick on [ buttons ]").setTint(Colours.NeutralTint)

    // Thrust
    const thrust = this.add.bitmapText(610, 580, Fonts.Proportional16, "Thrust\nUp for main thrusters\nDown for reverse")
      .setTint(Colours.NeutralTint).setOrigin(0.5, 0);

    // Rotation
    const rotate = this.add.bitmapText(840, 580, Fonts.Proportional16, "Rotation\nRight for clockwise\nLeft for counterclockwise")
      .setTint(Colours.NeutralTint).setOrigin(0.5, 0);

    // Saves
    const saving = this.add.bitmapText(400, 640, Fonts.Proportional16,
      "Saves are automatic. There are no second chances. This is our last chance.").setTint(Colours.WarningTint)
    UI.centre(0, this.cameras.main.width, saving);

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

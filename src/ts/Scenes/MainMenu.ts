import { AudioManager } from "../GameData/AudioManager";
import GameState from "../GameData/GameState";
import SavedGames from "../GameData/SavedGames";
import Utilities, { Colours, Fonts, Sprites, UI } from "../Utilities";
import MissionLogs from "./MissionLogs";
import Transition from "./Transition";

export default class MainMenu extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "MainMenu";

  public create(config: { animate?: boolean }): void {
    this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, this.cameras.main.width, this.cameras.main.height, Colours.PanelBackground, 1);
    AudioManager()?.changeBackground("opening");
    UI.centre(0, this.cameras.main.width,
      this.add.bitmapText(0, 150, Fonts.Proportional48, "The Last Voyage").setTint(Colours.NeutralTint));

    const lastSave = this.loadSave();
    if (lastSave) {
      this.addMenuItem(290, "Continue your voyage", () => { lastSave.transition(this) });
    } else {
      this.addMenuItem(290, "Launch the Sojourner", () => {
        const state = GameState.newGame(<Transition>this.scene.get(Transition.Name));
        state.transition(this);
      });
    }

    this.addMenuItem(350, "Mission Logs", () => {
      this.scene.add(MissionLogs.Name, MissionLogs, false).scene.sendToBack();
      this.scene.transition({
        target: MissionLogs.Name,
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
      "Saves are automatic. There are no second chances. This is our last chance.").setTint(Colours.WarningTint)
    UI.centre(0, this.cameras.main.width, saving);

    // Load animation
    if (config.animate) {
      this.cameras.main.y = 720;
      this.tweens.add({
        targets: this.cameras.main,
        y: 0,
        ease: 'cubic.inout',
        duration: 500,
        delay: 100,
        repeat: 0,
      })
    }
  }

  private addMenuItem(y: number, text: string, action: Function) {
    const continueText = this.add.bitmapText(0, y, Fonts.Proportional24, `[ ${text} ]`);
    UI.centre(0, this.cameras.main.width, continueText);
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

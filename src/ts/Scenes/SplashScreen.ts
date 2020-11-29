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
      this.start = this.add.bitmapText(640, 360, Fonts.Proportional16, "[ Click here to start ]")
        .setOrigin(0.5, 0.5)
        .setTint(Colours.TextTint)
      UI.makeInteractive(this.start, true);
      this.start.once("pointerdown", () => {
        this.runIntro();
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

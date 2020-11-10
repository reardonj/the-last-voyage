import { Fonts, Sprites } from "../Utilities";
import MainMenu from "./MainMenu";

export default class Preloader extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "Preloader";

  public preload(): void {
    this.addProgressBar();

    this.load.path = "assets/";
    this.load.image(Sprites.Planet, "planet.png");
    this.load.image(Sprites.Ship, "ship.png");
    this.load.image(Sprites.ShortGradient, "short-gradient.png");
    this.load.bitmapFont(Fonts.Proportional24, "fonts/kenvector_future_thin_24.png", "fonts/kenvector_future_thin_24.xml");
    this.load.bitmapFont(Fonts.Proportional16, "fonts/kenvector_future_thin_16.png", "fonts/kenvector_future_thin_16.xml");
  }

  public create(): void {
    this.scene.start(MainMenu.Name);
  }

  public update(): void {
    // preload handles updates to the progress bar, so nothing should be needed here.
  }

  /**
   * Adds a progress bar to the display, showing the percentage of assets loaded and their name.
   */
  private addProgressBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    /** Customizable. This text color will be used around the progress bar. */
    const outerTextColor = '#ffffff';

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        fill: outerTextColor
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: "0%",
      style: {
        font: "18px monospace",
        fill: "#ffffff"
      }
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: {
        font: "18px monospace",
        fill: outerTextColor
      }
    });

    assetText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      percentText.setText(parseInt(value * 100 + "", 10) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect((width / 4) + 10, (height / 2) - 30 + 10, (width / 2 - 10 - 10) * value, 30);
    });

    this.load.on("fileprogress", (file: Phaser.Loader.File) => {
      assetText.setText("Loading asset: " + file.key);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });
  }
}

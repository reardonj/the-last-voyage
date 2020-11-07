import GameState from "../GameData/GameState";
import Utilities, { Colours, Fonts } from "../Utilities";
import Hud from "./Hud";
import SolarSystemNavigation, { createSolarSystemNavigationState } from "./SolarSystemNavigation";

export default class MainMenu extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "MainMenu";

	public create(): void {
		const textYPosition = this.cameras.main.height / 3;

    const newGameText = this.add.bitmapText(0, 200, Fonts.Proportional24, "A New Beginning", 32).setTint(Colours.TextTint);
    newGameText.setX(this.cameras.main.width/2 - newGameText.width/2);
    newGameText.setInteractive({ useHandCursor: true  });
		newGameText.on("pointerdown", () => { 
      const state = new GameState({ earthTime: 0, relativeTime: 0});
      this.scene.start(Hud.Name, state);
      this.scene.start(
        SolarSystemNavigation.Name, 
        createSolarSystemNavigationState(state, new Phaser.Math.Vector2(-5000, -5000)));
    }, this);

	}

	public update(): void {
		// Update logic, as needed.
	}
}

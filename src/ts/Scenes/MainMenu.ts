import Utilities from "../Utilities";
import SolarSystemNavigation from "./SolarSystemNavigation";

export default class MainMenu extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "MainMenu";

	public create(): void {
		const textYPosition = this.cameras.main.height / 3;

		const newGameText = this.add.text(this.cameras.main.centerX, textYPosition, "Start");
		newGameText
			.setFontFamily("monospace")
			.setFontSize(40)
			.setFill("#fff")
			.setAlign("center")
			.setOrigin(0.5);
		newGameText.setInteractive();
		newGameText.on("pointerdown", () => { this.scene.start(SolarSystemNavigation.Name); }, this);

	}

	public update(): void {
		// Update logic, as needed.
	}
}

import Preloader from "./Preloader";
import Utilities from "../Utilities";
import MainGame from "./MainGame";

export default class Boot extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "Boot";

	public preload(): void {
		// Preload as needed.
	}

	public create(): void {
		Utilities.LogSceneMethodEntry("Boot", "create");

		this.scene.start(Preloader.Name);
	}
}

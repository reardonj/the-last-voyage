import Preloader from "./Preloader";
import Utilities from "../Utilities";
import SolarSystemNavigation from "./SolarSystemNavigation";

export default class Boot extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "Boot";

	public create(): void {
		this.scene.start(Preloader.Name);
	}
}

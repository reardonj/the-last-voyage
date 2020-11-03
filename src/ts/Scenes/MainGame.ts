import Utilities from "../Utilities";
import RelativisticMath from "../RelativisticMath"
import { GravitySimulation, GravityWell } from "../Logic/GravitySimulation";
import { GameObjects, Math as M } from "phaser";

export default class MainGame extends Phaser.Scene {
	/**
	 * Unique name of the scene.
	 */
	public static Name = "MainGame";

	private sim: GravitySimulation;
	private wells: GravityWell[];
	private position: M.Vector2;
	private nextVelocity = new M.Vector2(50, 0);

	private prediction: Phaser.GameObjects.Arc[];
	private currentPosition: Phaser.GameObjects.Arc;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

	public preload(): void {
		// Preload as needed.
	}

	public create(): void {
		Utilities.LogSceneMethodEntry("MainGame", "create");
		this.wells = [
			new GravityWell(new M.Vector2(300, 225), 20000),
			new GravityWell(new M.Vector2(500, 325), 20000)
		];
		
		this.sim = new GravitySimulation(this.wells);
		this.position = new M.Vector2(300, 100);

		for(let well of this.wells) {
			this.add.circle(well.position.x, well.position.y, 5, 0xffffff);
		}

		this.prediction = [];
		for(let i = 0; i < 180; i++) {
			const p = this.add.circle(50, 50, 1, 0xffff00);
			this.prediction.push(p);
		}

		this.currentPosition = this.add.circle(this.position.x, this.position.y, 10, 0x0000ff);
		this.cameras.main.startFollow(this.currentPosition, false);
    this.cursors = this.input.keyboard.createCursorKeys();
	}

	public update(time: number, delta: number) {
    let addX = 0;
    let addY = 0;
    if (this.cursors.left.isDown)
    {
        addX = -1
    }
    else if (this.cursors.right.isDown)
    {
        addX = 1;
    }

    if (this.cursors.up.isDown)
    {
        addY = -1;
    }
    else if (this.cursors.down.isDown)
    {
        addY = 1;
    }

    this.nextVelocity.add(new M.Vector2(addX, addY).scale(10*delta/1000));

		const path = this.sim.calculate(
			30, 
			1200, 
			new M.Vector2(this.position.x, this.position.y),
			this.nextVelocity);

		for(let i = 0; i < this.prediction.length && i*100 < path.length; i++) {
			this.prediction[i].setPosition(path[i*100][0].x, path[i*100][0].y);
		}

		this.position = path[50][0];
		this.nextVelocity = path[50][1];
		this.currentPosition.setPosition(this.position.x, this.position.y);
	}
}

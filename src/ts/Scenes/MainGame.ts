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
  private path: IterableIterator<[pos: M.Vector2, vel: M.Vector2]>;
  private nextPredictions: [pos: M.Vector2, vel: M.Vector2][];
  private predictionSpacing = 30;

  public preload(): void {
    // Preload as needed.
  }

  public create(): void {
    Utilities.LogSceneMethodEntry("MainGame", "create");
    this.wells = [
      new GravityWell(new M.Vector2(300, 225), 33300),
      new GravityWell(new M.Vector2(500, 325), 0.1),
      new GravityWell(new M.Vector2(200, 325), 30)
    ];

    this.sim = new GravitySimulation(this.wells);
    this.position = new M.Vector2(100, 100);

    for (let well of this.wells) {
      this.add.circle(well.position.x, well.position.y, 5, 0xffffff);
    }

    this.prediction = [];
    for (let i = 0; i < 60; i++) {
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
    const needsUpdate =
      !this.nextPredictions ||
      this.cursors.left.isDown ||
      this.cursors.right.isDown ||
      this.cursors.up.isDown ||
      this.cursors.down.isDown;

    if (this.cursors.left.isDown) {
      addX = -1
    }
    else if (this.cursors.right.isDown) {
      addX = 1;
    }

    if (this.cursors.up.isDown) {
      addY = -1;
    }
    else if (this.cursors.down.isDown) {
      addY = 1;
    }

    if (needsUpdate) {
      this.path = this.sim.calculate(
        delta,
        100,
        new M.Vector2(this.position.x, this.position.y),
        this.nextVelocity,
        new M.Vector2(addX, addY).scale(delta / 10000));
      this.nextPredictions = [];

      for (let i = 0; i < this.prediction.length * this.predictionSpacing; i++) {
        this.nextPredictions.push(this.path.next().value);
      }
    }
    else {
      this.nextPredictions.push(this.path.next().value);
      this.nextPredictions.shift();
    }

    for (let i = 0; i < this.prediction.length; i++) {
      this.prediction[i].setPosition(
        this.nextPredictions[i * this.predictionSpacing][0].x, 
        this.nextPredictions[i * this.predictionSpacing][0].y);
    }


    this.position = this.nextPredictions[1][0];
    this.nextVelocity = this.nextPredictions[1][1];
    this.currentPosition.setPosition(this.position.x, this.position.y);

  }
}

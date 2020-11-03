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
  private nextVelocity = new M.Vector2(30, -8);
  private nextAcceleration = new M.Vector2();

  private prediction: Phaser.GameObjects.Arc[];
  private currentPosition: Phaser.GameObjects.Arc;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private path: IterableIterator<[pos: M.Vector2, vel: M.Vector2, acc: M.Vector2]>;
  private nextPredictions: [pos: M.Vector2, vel: M.Vector2, acc: M.Vector2][];
  private predictionSpacing = 30;
  private frame = 0;
  velocityLabel: GameObjects.Text;
  accelerationLabel: GameObjects.Text;

  public preload(): void {
  }

  public create(): void {
    Utilities.LogSceneMethodEntry("MainGame", "create");
    const centre = new M.Vector2(0, 0);
    this.wells = [
      new GravityWell(centre, 33300),
      new GravityWell(new M.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI*2), 57), 0.1),
      new GravityWell(new M.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI*2), 108), 30),
      new GravityWell(new M.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI*2), 149), 3)
    ];

    this.sim = new GravitySimulation(this.wells);
    this.position = new M.Vector2(-100, -100);


		this.add.image(this.wells[0].position.x, this.wells[0].position.y, "sun").setDisplaySize(16, 16);
    for (let well of this.wells.slice(1)) {
      this.add.circle(well.position.x, well.position.y, Math.log(well.mass + 1), 0xffffff);
    }

    this.prediction = [];
    for (let i = 0; i < 60; i++) {
      const p = this.add.circle(50, 50, 1, 0xffff00);
      this.prediction.push(p);
    }

    this.currentPosition = this.add.circle(this.position.x, this.position.y, 10, 0x0000ff);
    this.cameras.main.startFollow(this.currentPosition, false);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.velocityLabel = this.add.text(10,10, "").setScrollFactor(0);
    this.accelerationLabel = this.add.text(10,30, "").setScrollFactor(0);
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
        200,
        new M.Vector2(this.position.x, this.position.y),
        this.nextVelocity,
        new M.Vector2(addX, addY).scale(delta / 10000).add(this.nextAcceleration));
      this.nextPredictions = [];

      for (let i = 0; i < this.prediction.length * this.predictionSpacing; i++) {
        this.nextPredictions.push(this.path.next().value);
      }
      this.frame = 0;
      for (let i = 0; i < this.prediction.length; i++) {
        this.prediction[i].setPosition(
          this.nextPredictions[i * this.predictionSpacing][0].x,
          this.nextPredictions[i * this.predictionSpacing][0].y);
      }
    }
    else {
      this.nextPredictions.push(this.path.next().value);
      this.nextPredictions.shift();

      if(this.frame == 0) {
        const toUpdate = this.prediction.shift();
        this.prediction.push(toUpdate);
        toUpdate.setPosition(
          this.nextPredictions[this.nextPredictions.length-1][0].x,
          this.nextPredictions[this.nextPredictions.length-1][0].y);
      }
      this.frame = (this.frame + 1) % this.predictionSpacing;
    }



    this.position = this.nextPredictions[1][0];
    this.nextVelocity = this.nextPredictions[1][1];
    this.nextAcceleration = this.nextPredictions[1][2];
    this.currentPosition.setPosition(this.position.x, this.position.y);

    this.velocityLabel.setText(`Velocity: [${this.nextVelocity.x.toFixed(2)}, ${this.nextVelocity.y.toFixed(2)}]`)
    this.accelerationLabel.setText(`Acceleration: [${this.nextAcceleration.x.toFixed(2)}, ${this.nextAcceleration.y.toFixed(2)}]`)

    const baseScale = this.game.canvas.height/2;
    const scaleDist = this.position.distance(M.Vector2.ZERO) * 1.2;
    this.cameras.main.setZoom(baseScale/scaleDist);
  }
}

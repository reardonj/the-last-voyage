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
  private nextVelocity: M.Vector2;

  private toScale: Phaser.GameObjects.Components.Transform[] = [];
  private prediction: Phaser.GameObjects.Arc[];
  private currentPosition: Phaser.GameObjects.Arc;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private path: IterableIterator<[pos: M.Vector2, vel: M.Vector2, acc: M.Vector2]>;
  private nextPredictions: [pos: M.Vector2, vel: M.Vector2, acc: M.Vector2][];
  private predictionSpacing = 10;
  private frame = 0;
  velocityLabel: GameObjects.Text;
  accelerationLabel: GameObjects.Text;


  public preload(): void {
  }

  public create(): void {
    Utilities.LogSceneMethodEntry("MainGame", "create");
    const centre = new M.Vector2(0, 0);
    this.wells = [
      new GravityWell(centre, 20000000),
      new GravityWell(this.randomOrbit(57), 3),
      new GravityWell(this.randomOrbit(108), 49),
      new GravityWell(this.randomOrbit(149), 50),
      new GravityWell(this.randomOrbit(227), 6.4),
      new GravityWell(this.randomOrbit(778), 18987),
      new GravityWell(this.randomOrbit(1426), 5685),
      new GravityWell(this.randomOrbit(2870), 868),
      new GravityWell(this.randomOrbit(4498), 1024)
    ];

    this.sim = new GravitySimulation(this.wells);
    this.position = new M.Vector2(-6000, -6000);
    this.nextVelocity = new M.Vector2(3, 2);

    this.toScale.push(this.add.image(this.wells[0].position.x, this.wells[0].position.y, "sun").setDisplaySize(16, 16));
    for (let well of this.wells.slice(1)) {
      this.toScale.push(this.add.circle(well.position.x, well.position.y, Math.log10(well.mass + 1), 0xffffff));
    }

    this.prediction = [];
    for (let i = 0; i < 60; i++) {
      const p = this.add.circle(50, 50, 1, 0xffff00);
      this.prediction.push(p);
      this.toScale.push(p);
    }

    this.currentPosition = this.add.circle(this.position.x, this.position.y, 2, 0xffffff);
    this.toScale.push(this.currentPosition);
    //this.cameras.main.startFollow(this.currentPosition, false);
    this.cameras.main.centerOn(0, 0);
    this.cameras.main.setZoom(0.05);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.velocityLabel = this.add.text(10, 10, "").setScrollFactor(0);
    this.accelerationLabel = this.add.text(10, 30, "").setScrollFactor(0);
  }

  private randomOrbit(distance: number): M.Vector2 {
    return new M.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI * 2), distance);
  }

  public update(time: number, delta: number) {
    const needsUpdate =
      !this.nextPredictions ||
      this.cursors.up.isDown ||
      this.cursors.down.isDown ||
      this.cursors.right.isDown ||
      this.cursors.left.isDown;


    if (needsUpdate) {
      let acc = this.nextAcc();

      this.path = this.sim.calculate(
        1,
        new M.Vector2(this.position.x, this.position.y),
        this.nextVelocity,
        acc);
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

      if (this.frame == 0) {
        const toUpdate = this.prediction.shift();
        this.prediction.push(toUpdate);
        toUpdate.setPosition(
          this.nextPredictions[this.nextPredictions.length - 1][0].x,
          this.nextPredictions[this.nextPredictions.length - 1][0].y);
      }
      this.frame = (this.frame + 1) % this.predictionSpacing;
    }

    this.position = this.nextPredictions[1][0];
    this.nextVelocity = this.nextPredictions[1][1];
    this.currentPosition.setPosition(this.position.x, this.position.y);

    const baseScale = this.game.canvas.height / 2;
    const scaleDist = this.position.distance(M.Vector2.ZERO) * 1.5;
    this.cameras.main.setZoom(baseScale / scaleDist);
    const scaleFactor = 1 / this.cameras.main.zoom;
    for (let p of this.toScale) {
      p.setScale(scaleFactor)
    }
  }

  private nextAcc(): M.Vector2 {
    let x = 0;
    let y = 0;
    if (this.cursors.up.isDown) {
      y = -1;
    } else if (this.cursors.down.isDown) {
      y = 1;
    }

    if (this.cursors.right.isDown) {
      x = 1;
    } else if (this.cursors.left.isDown) {
      x = -1;
    }
    return new M.Vector2(x, y).scale(0.1);
  }
}

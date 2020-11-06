import { GravitySimulation, GravityWell } from "../Logic/GravitySimulation";
import { GameObjects, Math as M } from "phaser";
import * as Conversions from "../Logic/Conversions";
import GameState, { Events } from "../GameData/GameState";

type ScaleSetting = [
  scale: number,
  orbitalDotFrequency: number,
  daysPerFrame: number
];

export default class SolarSystemNavigation extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "SolarSystemNavigation";

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
  private predictionSpacing = 30;
  private frame = 0;


  private scaleSettings: ScaleSetting[] = [
    [0.05, .001, 7]
  ]

  public preload(): void {
  }

  public create(): void {
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
    this.position = new M.Vector2(-5000, -5000);
    this.nextVelocity = new M.Vector2(15, 8);

    this.toScale.push(this.add.circle(this.wells[0].position.x, this.wells[0].position.y, 12, 0x8080ff));
    this.toScale.push(this.add.circle(this.wells[0].position.x, this.wells[0].position.y, 9, 0xffffff));
    for (let well of this.wells.slice(1)) {
      this.toScale.push(this.add.circle(well.position.x, well.position.y, Math.log10(well.mass + 1), 0xffffff));
      const radius = well.position.length();
      const dotSpacing = Math.PI * 2 / Math.round(radius * 0.01);
      for (let angle = 0; angle < Math.PI * 2; angle += dotSpacing) {
        const position = new M.Vector2().setToPolar(angle, radius);
        this.toScale.push(this.add.circle(position.x, position.y, 1, 0xffffff));
      }
    }

    this.prediction = [];
    for (let i = 0; i < 10; i++) {
      const p = this.add.circle(50, 50, 1, 0xffff00);
      this.prediction.push(p);
      this.toScale.push(p);
    }

    this.currentPosition = this.add.circle(this.position.x, this.position.y, 2, 0xffffff);
    this.toScale.push(this.currentPosition);

    this.cameras.main.centerOn(0, 0);
    this.cameras.main.setZoom(0.05);
    this.cursors = this.input.keyboard.createCursorKeys();
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
      const acc = this.nextAcc();
      this.path = this.sim.calculate(
        1,
        new M.Vector2(this.position.x, this.position.y),
        this.nextVelocity,
        acc);

      this.resetPredictions();
    }
    else {
      this.updatePredictions();
    }

    this.position = this.nextPredictions[1][0];
    this.nextVelocity = this.nextPredictions[1][1];
    this.currentPosition.setPosition(this.position.x, this.position.y);


    const baseScale = this.game.canvas.height / 2;
    const scaleDist = (this.position.distance(M.Vector2.ZERO) * 1.5);
    //this.cameras.main.setZoom(baseScale / scaleDist);
    const scaleFactor = 1 / this.cameras.main.zoom;
    for (let p of this.toScale) {
      p.setScale(scaleFactor)
    }

    (<GameState>this.scene.settings.data).updateTime(
        60 * 24,
        Conversions.contractTime(60 * 24, Conversions.gigametersPerDayToLightSpeedPercent(this.nextVelocity.length())));
  }

  private updatePredictions() {
    this.nextPredictions.push(this.path.next().value);
    this.nextPredictions.shift();

    this.renderPredictions();
  }


  private resetPredictions() {
    this.nextPredictions = [];
    for (let i = 0; i < (this.prediction.length + 1) * this.predictionSpacing; i++) {
      this.nextPredictions.push(this.path.next().value);
    }

    this.renderPredictions();
  }

  private renderPredictions() {
    this.frame = (this.frame + 1) % this.predictionSpacing;
    for (let i = 0; i < this.prediction.length; i++) {
      this.prediction[i].setPosition(
        this.nextPredictions[(i + 1) * this.predictionSpacing - this.frame][0].x,
        this.nextPredictions[(i + 1) * this.predictionSpacing - this.frame][0].y);
    }
  }

  private nextAcc(): M.Vector2 {
    let x = 0;
    let y = 0;
    if (this.cursors.up.isDown) {
      y = 1;
    } else if (this.cursors.down.isDown) {
      y = -1;
    }

    if (this.cursors.right.isDown) {
      x = -1;
    } else if (this.cursors.left.isDown) {
      x = 1;
    }
    return new M.Vector2(x, y).normalize().scale(0.1);
  }
}

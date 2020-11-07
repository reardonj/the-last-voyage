import { GravitySimulation, GravityWell } from "../Logic/GravitySimulation";
import { GameObjects, Math as M } from "phaser";
import * as Conversions from "../Logic/Conversions";
import GameState, { Events } from "../GameData/GameState";
import { Colours } from "../Utilities";

type ScaleSetting = [
  scale: number,
  orbitalDotFrequency: number,
  daysPerFrame: number
];

export interface SolarSystemState {
  game: GameState;
  init: SolarSystemParameters;
}

export interface SolarSystemParameters {
  initialPosition: M.Vector2
}

export function createSolarSystemNavigationState(game: GameState, initialPosition: M.Vector2): SolarSystemState {
  return { game: game, init: { initialPosition: initialPosition } };
}

export default class SolarSystemNavigation extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "SolarSystemNavigation";

  private sim: GravitySimulation;
  private wells: GravityWell[];
  private position: M.Vector2;
  private nextVelocity: M.Vector2;

  private toScale: (Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject)[] = [];
  private prediction: Phaser.GameObjects.Arc[];
  private currentPosition: Phaser.GameObjects.Arc;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private path: IterableIterator<[pos: M.Vector2, vel: M.Vector2, acc: M.Vector2]>;
  private nextPredictions: [pos: M.Vector2, vel: M.Vector2, acc: M.Vector2][];
  private predictionSpacing = 30;
  private frame = 0;
  orbits: GameObjects.Graphics;
  daysPassed: number;
  zoomLevels: number[] = [];

  public preload(): void {
  }

  public create(state: SolarSystemState): void {
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
    const radiuses = this.wells.map(x => x.position.length());
    for (let i = 1; i < radiuses.length; i++) {
      this.zoomLevels.push((radiuses[i-1] + radiuses[i])/2);
    }

    this.sim = new GravitySimulation(this.wells);
    this.position = state.init.initialPosition.clone();
    this.nextVelocity = new M.Vector2(10, 6);
    this.currentPosition = this.add.circle(this.position.x, this.position.y, 2, 0xffffff);
    this.toScale.push(this.currentPosition);

    this.cameras.main.centerOn(0, 0);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.toScale.push(this.add.circle(this.wells[0].position.x, this.wells[0].position.y, 12, 0x8080ff));
    this.toScale.push(this.add.circle(this.wells[0].position.x, this.wells[0].position.y, 9, 0xffffff));

    this.cameras.main.setZoom(0.04);
    this.setupOrbitals();
    this.updateScaledObjects();

    this.prediction = [];
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(50, 50, 1, 0xffffaa);
      this.prediction.push(p);
      this.toScale.push(p);
    }
  }

  private setupOrbitals() {
    this.orbits = this.add.graphics();
    for (let well of this.wells.slice(1)) {
      const radius = well.position.length();
      this.toScale.push(this.add.circle(well.position.x, well.position.y, Math.log10(well.mass + 1), 0xffffff));
    }
    this.drawOrbits();
  }

  private drawOrbits() {
    this.orbits.clear();
    this.orbits.lineStyle(2 / this.cameras.main.zoom, Colours.TextTint);
    for (let well of this.wells.slice(1)) {
      const radius = well.position.length();
      this.orbits.strokeCircle(0, 0, radius);
    }
  }

  private randomOrbit(distance: number): M.Vector2 {
    return new M.Vector2().setToPolar(Phaser.Math.FloatBetween(0, Math.PI * 2), distance);
  }

  public update(time: number, delta: number) {
    const daysPassed = this.doUpdates();
    this.updateScaledObjects();

    (<SolarSystemState>this.scene.settings.data).game.updateTime(
      60 * 24 * daysPassed,
      Conversions.contractTime(60 * 24 * daysPassed, Conversions.gigametersPerDayToLightSpeedPercent(this.nextVelocity.length())));
  }

  private updateScaledObjects() {
    const baseScale = this.game.canvas.height / 2;
    const distFromCentre = this.position.distance(M.Vector2.ZERO);
    const scaleDist = Math.ceil(this.zoomLevels.reduceRight((c, w) => w > distFromCentre ? w : c, 1000000) * 1.1);
    const scale = Math.max(0.05, Math.min(1, Math.round(100 * baseScale / scaleDist) / 100));

    if (this.cameras.main.zoom != scale) {
      this.cameras.main.zoomTo(scale, 500);
      const scaleFactor = 1 / scale;
      for (let p of this.toScale) {
        p.setScale(scaleFactor);
      }

      this.drawOrbits();
    }
  }

  private doUpdates(): number {
    const daysPassed = 0.05 / this.cameras.main.zoom;
    const needsUpdate =
      !this.nextPredictions ||
      this.daysPassed != daysPassed ||
      this.cursors.up.isDown ||
      this.cursors.down.isDown ||
      this.cursors.right.isDown ||
      this.cursors.left.isDown;


    if (needsUpdate) {
      const acc = this.nextAcc().scale(1 / 20 / daysPassed);
      if (this.nextPredictions) {
        acc.add(this.nextPredictions[1][2]);
      }
      this.path = this.sim.calculate(
        daysPassed,
        new M.Vector2(this.position.x, this.position.y),
        this.nextVelocity,
        acc);
      this.daysPassed = daysPassed;
      this.resetPredictions();
    }
    else {
      this.updatePredictions();
    }

    this.position = this.nextPredictions[1][0];
    this.nextVelocity = this.nextPredictions[1][1];
    this.currentPosition.setPosition(this.position.x, this.position.y);
    return daysPassed;
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
    return new M.Vector2(x, y).normalize();
  }
}

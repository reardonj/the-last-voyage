import { GravitySimulation, GravityWell } from "../Logic/GravitySimulation";
import { GameObjects, Math as M } from "phaser";
import * as Conversions from "../Logic/Conversions";
import GameState, { Events, SolarSystemState } from "../GameData/GameState";
import { Colours, Sprites } from "../Utilities";
import { createGameObjects, createZoomLevels, ScalableObject } from "../GameData/SolarSystemObject";
import Hud from "./Hud";

type TransformableObject =
  Phaser.GameObjects.Components.Transform &
  Phaser.GameObjects.Components.AlphaSingle &
  Phaser.GameObjects.GameObject;

export default class SolarSystemNavigation extends Phaser.Scene {
  /**
   * Unique name of the scene.
   */
  public static Name = "SolarSystemNavigation";

  private sim: GravitySimulation;
  private position: M.Vector2;
  private nextVelocity: M.Vector2;

  private toScale: TransformableObject[] = [];
  private prediction: TransformableObject[];
  private currentPosition: TransformableObject;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private path: IterableIterator<[pos: M.Vector2, vel: M.Vector2, acc: M.Vector2]>;
  private nextPredictions: [pos: M.Vector2, vel: M.Vector2, acc: M.Vector2][];
  private predictionSpacing = 50;
  private frame = 0;
  private daysPassed: number;
  private zoomLevels: number[] = [];
  private orbitalBodies: ScalableObject[];

  public preload(): void {
  }

  public create(state: GameState): void {
    this.events.once('transitioncomplete', () => this.scene.launch(Hud.Name, state), this);
    this.game.events.on("step", () => this.gameState().doStateBasedTransitions(this), this);
    this.events.on('destroy', () => this.game.events.off("step", undefined, this));

    this.add.rectangle(0, 0, 60000, 60000, 0x000000, 1)
      .setInteractive(true, () => true)
      .on("pointerdown", () => this.gameState().eventSource.emit(Events.ShowInfo, null));;
    this.zoomLevels = createZoomLevels(state.currentSystem());
    this.orbitalBodies = createGameObjects(state.currentSystem());
    this.orbitalBodies.forEach(x => this.setupScalableObject(x));
    this.sim = new GravitySimulation(this.orbitalBodies);

    const solarState = <SolarSystemState>state.currentScene[1];
    this.position = solarState.initPosition.clone();
    this.nextVelocity = solarState.initVelocity.clone();

    this.cameras.main.centerOn(0, 0);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.prediction = [];
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(50, 50, 1, 0xffffaa).setAlpha(1 - 0.8 * (i / 20));
      this.prediction.push(p);
      this.toScale.push(p);
    }
    this.currentPosition = this.add.image(this.position.x, this.position.y, Sprites.Ship).setTint(Colours.TextTint);
    this.toScale.push(this.currentPosition);

    this.updateScaledObjects(true);
  }

  private setupScalableObject(obj: ScalableObject) {
    obj.create(this);
    obj.interactionObject.setInteractive({ useHandCursor: true });
    obj.interactionObject.on("pointerdown", () => this.gameState().eventSource.emit(Events.ShowInfo, obj.info()));
  }

  public update(time: number, delta: number) {
    if (this.gameState().currentScene[0] != "solar-system") {
      return;
    }

    const daysPassed = this.updateShip();
    this.updateScaledObjects();
    this.orbitalBodies.forEach(x => x.update(this));
    this.currentPosition.setRotation(this.nextVelocity.angle());

    const minutesPassed = 60 * 24 * daysPassed;
    this.gameState().updateTime(
      minutesPassed,
      Conversions.contractTime(minutesPassed, Conversions.gigametersPerDayToLightSpeedPercent(this.nextVelocity.length())),
      minutesPassed);
  }

  private updateScaledObjects(force?: boolean) {
    const baseScale = this.game.canvas.height / 2;
    const distFromCentre = this.position.distance(M.Vector2.ZERO);
    const scaleDist = Math.ceil(this.zoomLevels.reduceRight((c, w) => w > distFromCentre ? w : c, 1000000) * 1.1);
    const scale = Math.max(0.05, Math.min(1, Math.round(100 * baseScale / scaleDist) / 100));

    if (force || this.cameras.main.zoom != scale) {
      if (force) {
        this.cameras.main.setZoom(scale);
      } else {
        this.cameras.main.zoomTo(scale, 500);
      }
      const scaleFactor = 1 / scale;
      for (let p of this.toScale) {
        p.setScale(scaleFactor);
      }
      for (let p of this.orbitalBodies) {
        p.setScale(scaleFactor);
      }
    }

    const location =
      scale == 0.05 ? "Outer System" :
        scale == 1 ? "Inner System" :
          "Mid System";
    this.gameState().eventSource.emit(Events.LocationChanged, [this.gameState().currentSystem().name, location]);
    return scale;
  }

  private updateShip(): number {
    const daysPassed = 0.01 / this.cameras.main.zoom;
    const needsUpdate =
      !this.nextPredictions ||
      this.daysPassed != daysPassed ||
      this.cursors.up?.isDown ||
      this.cursors.down?.isDown ||
      this.cursors.right?.isDown ||
      this.cursors.left?.isDown;


    if (needsUpdate) {
      const acc = this.nextAcc().scale(1 / 5 / daysPassed);
      this.gameState().useFuel(acc.length(), daysPassed * 60 * 24);
      if (this.nextPredictions) {
        acc.add(this.nextPredictions[1][2]);
      }
      this.path = this.sim.calculate(
        this.gameState().earthTime,
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
    if (this.cursors.up?.isDown) {
      y = 1;
    } else if (this.cursors.down?.isDown) {
      y = -1;
    }

    if (this.cursors.right?.isDown) {
      x = -1;
    } else if (this.cursors.left?.isDown) {
      x = 1;
    }
    return new M.Vector2(x, y).normalize();
  }

  private gameState() {
    return (<GameState>this.scene.settings.data);
  }
}

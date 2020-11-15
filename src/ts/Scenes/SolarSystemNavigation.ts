import { GravitySimulation, GravityWell } from "../Logic/GravitySimulation";
import { GameObjects, Math as M } from "phaser";
import * as Conversions from "../Logic/Conversions";
import GameState, { arrayToPosition, Events, SolarSystemState } from "../GameData/GameState";
import { Colours, Resources, Sprites, UI } from "../Utilities";
import { createGameObjects, createZoomLevels, ScalableObject } from "../GameData/NavigationObjects";
import Hud from "./Hud";
import AstronomicalMath from "../Logic/AstronomicalMath";

type TransformableObject =
  Phaser.GameObjects.Components.Transform &
  Phaser.GameObjects.Components.Visible &
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
  orientation: number;
  farthestOrbit: number;

  public preload(): void {
  }

  public create(state: GameState): void {
    this.events.once('transitioncomplete', () => this.scene.launch(Hud.Name, state), this);
    this.game.events.on("step", () => this.gameState().doStateBasedTransitions(this), this);
    this.events.on('destroy', () => this.game.events.removeListener("step", undefined, this));

    this.add.rectangle(0, 0, 1000000, 1000000, 0x000000, 1)
      .setInteractive(true, () => true)
      .on("pointerdown", () => this.gameState().emit(Events.ShowInfo, null));

    this.farthestOrbit = state.currentSystem()!.farthestOrbit();
    this.orbitalBodies = createGameObjects(state.currentSystem()!, state.systems);
    this.orbitalBodies.forEach(x => this.setupScalableObject(x));
    this.sim = new GravitySimulation(this.orbitalBodies);

    const solarState = <SolarSystemState>state.currentScene[1];
    this.position = arrayToPosition(state.ship.position);
    this.nextVelocity = arrayToPosition(state.ship.velocity);
    this.orientation = state.ship.orientation;

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
    UI.showHoverHint(this.currentPosition, this.gameState(), () => Resources.ShipName);

    this.updateScaledObjects(true);
  }

  private setupScalableObject(obj: ScalableObject) {
    obj.create(this);
    obj.interactionObject.setInteractive({ useHandCursor: true });
    obj.interactionObject.on("pointerdown", () => this.gameState().emit(Events.ShowInfo, obj.info()));
    UI.showHoverHint(obj.interactionObject, this.gameState(), () => obj.info().name);
  }

  public update(time: number, delta: number) {
    if (this.gameState().currentScene[0] != "solar-system") {
      return;
    }

    if (this.cameras.main.zoom > 0.01) {
      this.updateShip();
    } else {
      this.gameState().emit(
        Events.UpdateStatus,
        "Select a destination, or return to the current system.")
    }
    this.updateScaledObjects();
    this.orbitalBodies.forEach(x => x.update(this));

  }

  private updateScaledObjects(force?: boolean) {
    const baseScale = this.game.canvas.height / 2;
    const distFromCentre = this.position.distance(M.Vector2.ZERO);
    const scale = distFromCentre > this.farthestOrbit + 1000 ?
      0.001 :
      Math.max(0.05, Math.min(1, Math.round(100 * baseScale / (distFromCentre * 1.5)) / 100));

    if (force || Phaser.Math.Difference(this.cameras.main.zoom, scale) >= 0.01) {
      if (force) {
        this.cameras.main.setZoom(scale);
      } else {
        this.cameras.main.zoomTo(scale, 500);
      }
      if (scale == 0.001) {
        this.gameState().emit(Events.ShowInfo, null);
        this.gameState().emit(Events.HoverHint, null);
      }
    }
    const scaleFactor = 1 / this.cameras.main.zoom;
    for (let p of this.toScale) {
      p.setScale(scaleFactor);
    }
    for (let p of this.orbitalBodies) {
      p.setScale(scaleFactor);
    }

    if (scale == 0.001) {
      this.gameState().emit(
        Events.LocationChanged,
        [`Interstellar Space near ${this.gameState().currentSystem()!.name}`]);
    } else {
      const location = scale == 1 ? "Inner System" : "Outer System";
      this.gameState().emit(Events.LocationChanged, [this.gameState().currentSystem()!.name, location]);

    }
    return scale;
  }

  private updateShip(): number {
    const daysPassed = 1 / 12;
    const needsUpdate =
      !this.nextPredictions ||
      this.daysPassed != daysPassed ||
      this.cursors.up?.isDown ||
      this.cursors.down?.isDown ||
      this.cursors.right?.isDown ||
      this.cursors.left?.isDown;

    let ownAcc = new Phaser.Math.Vector2();
    const acc = new Phaser.Math.Vector2();
    if (this.nextPredictions) {
      acc.add(this.nextPredictions[1][2]);
    }

    if (needsUpdate) {
      ownAcc = this.nextAcc().scale(AstronomicalMath.Acceleration1GDay * daysPassed * daysPassed);
      acc.add(ownAcc);
      this.path = this.sim.calculate(
        this.gameState().earthTime,
        daysPassed,
        new M.Vector2(this.position.x, this.position.y),
        this.nextVelocity,
        acc.clone());
      this.daysPassed = daysPassed;
      this.resetPredictions();
    }
    else {
      this.updatePredictions();
    }

    this.position = this.nextPredictions[1][0];
    this.nextVelocity = this.nextPredictions[1][1];
    this.currentPosition.setPosition(this.position.x, this.position.y);
    this.currentPosition.setRotation(this.orientation);

    const state = this.gameState();
    if (state.currentScene[0] == "solar-system") {
      state.ship = {
        orientation: this.orientation,
        position: [this.position.x, this.position.y],
        velocity: [this.nextVelocity.x, this.nextVelocity.y]
      }
    }

    const minutesPassed = 60 * 24 * daysPassed;
    const relativeMinutes = Conversions.contractTime(
      minutesPassed,
      Conversions.gigametersPerDayToLightSpeedPercent(this.nextVelocity.length()));

    const acc1g = AstronomicalMath.Acceleration1GDay * daysPassed * daysPassed;
    const totalAccelerationMagnitude = acc.length() / (acc1g);
    if (this.nextPredictions.reduce((v, c) => v || c[2].length() / acc1g > 2, false)) {
      this.gameState().emit(Events.Warning, "Warning: Dangerous acceleration predicted");
    }

    this.gameState().timeStep(
      totalAccelerationMagnitude,
      ownAcc.length() / acc1g,
      minutesPassed,
      relativeMinutes,
    );

    const displayVelocity = (1000000 * this.nextVelocity.length() / 24 / 60 / 60).toFixed(0);
    const displayAcceleration = (totalAccelerationMagnitude).toFixed(2);
    this.gameState().emit(
      Events.UpdateStatus,
      `Velocity: ${displayVelocity} km/s  Acceleration: ${displayAcceleration} g`)

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
    let y = 0;
    if (this.cursors.up?.isDown) {
      y = 1;
    } else if (this.cursors.down?.isDown) {
      y = -0.5;
    }

    if (this.cursors.right?.isDown) {
      this.orientation += (Math.PI / 90);
    } else if (this.cursors.left?.isDown) {
      this.orientation += (-Math.PI / 90);
    }
    return new Phaser.Math.Vector2(1, 0).setToPolar(this.orientation).scale(y);
  }

  private gameState() {
    return (<GameState>this.scene.settings.data);
  }
}

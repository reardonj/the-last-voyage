import { GravitySimulation, GravityWell } from "../Logic/GravitySimulation";
import { GameObjects, Math as M } from "phaser";
import * as Conversions from "../Logic/Conversions";
import GameState, { arrayToPosition, Events, SolarSystemState } from "../GameData/GameState";
import { Colours, Resources, Sprites, UI } from "../Utilities";
import { createGameObjects, createZoomLevels, NavObject, ScalableObject } from "../GameData/NavigationObjects";
import Hud from "./Hud";
import AstronomicalMath from "../Logic/AstronomicalMath";
import SavedGames from "../GameData/SavedGames";
import { Planet, planetPositionAt } from "../GameData/SolarSystemObjects";

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
  private timePassed: number = 0;
  private orbitalBodies: NavObject[];
  orientation: number;
  farthestOrbit: number;
  launchEmitter: GameObjects.Particles.ParticleEmitter;
  launchDestination: GameObjects.Particles.GravityWell;


  public preload(): void {
  }

  public create(state: GameState): void {
    this.events.once('transitioncomplete', () => {
      if (!this.scene.get(Hud.Name)?.scene.isActive()) {
        this.scene.launch(Hud.Name, state);
      }
    }, this);

    this.game.events.on("step", () => this.gameState().doStateBasedTransitions(this), this);
    this.events.on('destroy', () => {
      this.game.events.removeListener("step", undefined, this);
      state.unwatch(Events.LaunchColonizationFleet, this);
    });

    this.add.rectangle(0, 0, 1000000, 1000000, 0x000000, 1)
      .setInteractive(true, () => true)
      .on("pointerdown", () => this.gameState().emit(Events.ShowInfo, null));

    this.farthestOrbit = state.currentSystem()!.farthestOrbit();
    this.orbitalBodies = createGameObjects(state.currentSystem()!, state.worlds);
    this.orbitalBodies.forEach(x => this.setupScalableObject(x));
    this.sim = new GravitySimulation(this.orbitalBodies.map(x => x.scalable));

    this.position = arrayToPosition(state.ship.position);
    this.nextVelocity = arrayToPosition(state.ship.velocity);
    this.orientation = state.ship.orientation;

    this.cameras.main.centerOn(0, 0);
    this.cursors = this.input.keyboard.createCursorKeys();

    // Set up position predictions
    this.prediction = [];
    for (let i = 0; i < 20; i++) {
      const p = this.add.circle(50, 50, 1, 0xffffaa);
      this.prediction.push(p);
      this.toScale.push(p);
    }

    // Set up ship
    this.currentPosition = this.add.image(this.position.x, this.position.y, Sprites.Ship).setTint(Colours.TextTint);
    this.toScale.push(this.currentPosition);
    UI.showHoverHint(this.currentPosition, this.gameState(), () => Resources.ShipName);

    // Set up launch particles
    const particleSource = this.add.particles(Sprites.Dot);
    this.launchEmitter = particleSource.createEmitter({
      lifespan: 2000,
      follow: this.currentPosition,
      frequency: -1,
      quantity: 5,
      moveToX: 10,
      moveToY: 10,
      emitZone: { source: new Phaser.Geom.Rectangle(-5, -5, 10, 10) }
    });

    this.updateScaledObjects(true);

    state.watch(Events.LaunchColonizationFleet, this.launchColonizationFleet, this);

    SavedGames.saveGame(state);
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => SavedGames.saveGame(state),
      callbackScope: this
    })
  }

  launchColonizationFleet(planet: Planet) {
    const civs = planet.civilizations;
    const planetPosition = this.orbitalBodies.find(x => x.definition === planet);
    if (planetPosition && civs) {
      const civ = civs[civs.length - 1];
      const time = (civ.established - this.gameState().earthTime - 60 * 24) / (1 / 12 * 60 * 24 * 60 / 1000);

      const foundingPosition = planetPosition.scalable.positionAt(civ.established - 60 * 24);

      this.launchEmitter.setDeathZone({ source: new Phaser.Geom.Circle(foundingPosition.x, foundingPosition.y, 10) });
      this.launchEmitter.setLifespan(time);
      this.launchEmitter.setTint(Colours.AllyTint)
      this.launchEmitter.moveTo = true;
      this.launchEmitter.moveToX.loadConfig({ moveToX: { min: foundingPosition.x - 8, max: foundingPosition.x + 8 } });
      this.launchEmitter.moveToY.loadConfig({ moveToY: { min: foundingPosition.y - 8, max: foundingPosition.y + 8 } });
      this.launchEmitter.emitParticle();
    }

  }

  private setupScalableObject(obj: NavObject) {
    obj.scalable.create(this);
    obj.scalable.interactionObject.setInteractive({ useHandCursor: true });
    obj.scalable.interactionObject.on("pointerdown", () => this.gameState().emit(Events.ShowInfo, obj.scalable.info()));
    UI.showHoverHint(obj.scalable.interactionObject, this.gameState(), () => obj.scalable.hint());
  }

  public update(time: number, delta: number) {
    if (this.gameState().currentScene[0] != "solar-system") {
      return;
    }

    if (this.cameras.main.zoom > 0.01) {
      this.updateShip(delta);
    } else {
      this.gameState().emit(
        Events.UpdateStatus,
        "Select a destination, or return to the current system.")
    }
    this.updateScaledObjects();
    this.orbitalBodies.forEach(x => x.scalable.update(this));

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
      p.scalable.setScale(scaleFactor);
    }
    this.launchEmitter.setScale(scaleFactor);

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

  private updateShip(deltaMs: number): number {
    const daysPassed = 7.2 / 60 / 24 * deltaMs;
    const needsUpdate =
      !this.nextPredictions ||
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
        1 / 12,
        new M.Vector2(this.position.x, this.position.y),
        this.nextVelocity,
        acc.clone());
      this.timePassed = 0;
      this.resetPredictions();
    }
    else {
      this.timePassed += deltaMs;
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

    while (this.timePassed >= 1000 / 60) {
      this.nextPredictions.push(this.path.next().value);
      this.nextPredictions.shift();
      this.timePassed -= 1000 / 60;
      this.renderPredictions();
    }

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

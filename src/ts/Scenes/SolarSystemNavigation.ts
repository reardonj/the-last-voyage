/* 
Copyright 2020-2021, Justin Reardon. 

This file is part of The Last Voyage.

The Last Voyage is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The Last Voyage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with The Last Voyage.  If not, see <https://www.gnu.org/licenses/>.
*/

import { GravitySimulation, GravityWell } from "../Logic/GravitySimulation";
import { GameObjects, Math as M } from "phaser";
import * as Conversions from "../Logic/Conversions";
import GameState, { Alert, arrayToPosition, Events, ObjectInfo, SolarSystemState } from "../GameData/GameState";
import { Colours, Resources, Sprites, UI } from "../Utilities";
import { createGameObjects, createZoomLevels, NavObject, ScalableObject } from "../GameData/NavigationObjects";
import Hud from "./Hud";
import AstronomicalMath from "../Logic/AstronomicalMath";
import { Planet, planetPositionAt } from "../GameData/SolarSystemObjects";
import { AudioManager } from "../GameData/AudioManager";

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
  paused: boolean = false;
  pauseKey: Phaser.Input.Keyboard.Key;
  selectionIndicator: GameObjects.Sprite;
  selection: ((t: number) => Phaser.Math.Vector2) | null = null;
  fastForwardKey: Phaser.Input.Keyboard.Key;

  public preload(): void {
  }

  public create(state: GameState): void {
    this.events.once('transitioncomplete', () => {
      if (!this.scene.get(Hud.Name)?.scene.isActive()) {
        this.scene.launch(Hud.Name, state);
        AudioManager()?.changeBackground("game");
      }
    }, this);

    this.game.events.on("step", () => this.gameState().doStateBasedTransitions(this), this);
    this.events.on('destroy', () => {
      this.game.events.removeListener("step", undefined, this);
      state.unwatch(Events.LaunchColonizationFleet, this.launchColonizationFleet);
      state.unwatch(Events.ShowInfo, this.showIndicator);
      state.unwatch(Events.Alert, this.pause);
    });

    this.add.rectangle(0, 0, 2000000, 1000000, 0x000000, 1)
      .setInteractive(true, () => true)
      .on("pointerdown", () => this.gameState().emit(Events.ShowInfo, null));

    this.farthestOrbit = state.currentSystem()!.farthestOrbit();
    this.orbitalBodies = createGameObjects(state.currentSystem()!, state.worlds);
    this.orbitalBodies.forEach(x => this.setupScalableObject(x));

    this.sim = new GravitySimulation(this.orbitalBodies.map(x => x.scalable).filter(x => x.mass > 0));

    this.position = arrayToPosition(state.ship.position);
    this.nextVelocity = arrayToPosition(state.ship.velocity);
    this.orientation = state.ship.orientation;

    this.cameras.main.centerOn(0, 0);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey("P");
    this.fastForwardKey = this.input.keyboard.addKey("F");

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

    const zoneRect = new Phaser.Geom.Rectangle(-5, -5, 10, 10);
    // Set up launch particles
    const particleSource = this.add.particles(Sprites.Dot);
    this.launchEmitter = particleSource.createEmitter({
      lifespan: 2000,
      follow: this.currentPosition,
      frequency: -1,
      quantity: 5,
      moveToX: 10,
      moveToY: 10,
      emitZone: {
        source: {
          // Definition of source type is broken in current Phaser.
          // It is using Vector2Like as the param, but that can't
          // be passed to getRandomPoint.
          getRandomPoint: (point) => {
            const random = zoneRect.getRandomPoint()
            point.x = random.x;
            point.y = random.y;
          }
        }
      }
    });

    // Set up selection indicator
    this.anims.create({
      key: "blink",
      frames: this.anims.generateFrameNumbers("selectionIndicator", {}),
      frameRate: 2,
      repeat: -1
    });
    this.selectionIndicator = this.add
      .sprite(0, 0, "selectionIndicator")
      .setTint(Colours.Highlight)
      .play("blink");
    this.toScale.push(this.selectionIndicator);

    this.updateScaledObjects(true);

    state.watch(Events.LaunchColonizationFleet, this.launchColonizationFleet, this);
    state.watch(Events.ShowInfo, this.showIndicator, this);
    state.watch(Events.Alert, this.pause, this);
  }

  showIndicator(info: ObjectInfo | null) {
    this.selection = info?.position ?? null;
  }

  pause(x: any) {
    this.paused = x !== null;
  }

  launchColonizationFleet(planet: Planet) {
    const civs = planet.civilizations;
    const planetPosition = this.orbitalBodies.find(x => x.definition === planet);
    if (planetPosition && civs) {
      const civ = civs[civs.length - 1];
      const time = (civ.established - this.gameState().earthTime - 60 * 24) / (1 / 12 * 60 * 24 * 60 / 1000);

      const foundingPosition = planetPosition.scalable.positionAt(civ.established - 60 * 24);

      this.launchEmitter.setDeathZone({ source: new Phaser.Geom.Circle(foundingPosition.x, foundingPosition.y, 8) });
      this.launchEmitter.setLifespan(time);
      this.launchEmitter.setTint(Colours.AllyTint)
      this.launchEmitter.moveTo = true;
      this.launchEmitter.moveToX.loadConfig({ moveToX: { min: foundingPosition.x - 8, max: foundingPosition.x + 8 } });
      this.launchEmitter.moveToY.loadConfig({ moveToY: { min: foundingPosition.y - 8, max: foundingPosition.y + 8 } });
      this.launchEmitter.emitParticle(civ.type === "colony" ? 5 : 1);
    }

  }

  private setupScalableObject(obj: NavObject) {
    obj.scalable.create(this);
    if (obj.scalable.interactionObject) {
      obj.scalable.interactionObject.setInteractive({ useHandCursor: true });
      obj.scalable.interactionObject.on("pointerdown", () => this.gameState().emit(Events.ShowInfo, obj.scalable.info()));
      UI.showHoverHint(obj.scalable.interactionObject, this.gameState(), () => obj.scalable.hint());
    }
  }

  public update(time: number, delta: number) {
    if (this.gameState().currentScene[0] != "solar-system") {
      return;
    }

    if (this.selection == null) {
      this.selectionIndicator.alpha = Math.max(0, this.selectionIndicator.alpha - delta / 300);
    } else {
      const position = this.selection(this.gameState().earthTime);
      this.selectionIndicator.setPosition(position.x, position.y);
      this.selectionIndicator.alpha = Math.min(1, this.selectionIndicator.alpha + delta / 200);
    }

    if (this.paused) {
      return;
    }

    if (this.pauseKey.isDown) {
      const alert: Alert = {
        title: "Game Paused",
        text: [" ", " "],
        action: { name: "Continue", hint: "", action: x => x.emit(Events.Alert, null) }
      };
      this.gameState().emit(Events.Alert, alert)
    }

    if (this.cameras.main.zoom > 0.01) {
      const times = this.fastForwardKey.isDown ? 16 : 1;
      for (let i = 0; i < times; i++) {
        this.updateShip(this.fastForwardKey.isDown, delta);
      }
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
      0.0004 :
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

    if (scale <= 0.001) {
      this.currentPosition.visible = false;
      this.prediction.forEach(x => x.visible = false);
      this.gameState().emit(
        Events.LocationChanged,
        [`Interstellar Space near ${this.gameState().currentSystem()!.name}`]);
    } else {
      this.currentPosition.visible = true;
      this.prediction.forEach(x => x.visible = true);
      const location = scale == 1 ? "Inner System" : "Outer System";
      this.gameState().emit(Events.LocationChanged, [this.gameState().currentSystem()!.name, location]);

    }
    return scale;
  }

  private updateShip(isFastForward: boolean, deltaMs: number): number {
    const daysPassed = 7.2 / 60 / 24 * deltaMs;

    let ownAcc = new Phaser.Math.Vector2();
    const acc = new Phaser.Math.Vector2();
    if (this.nextPredictions) {
      acc.add(this.nextPredictions[1][2]);
    }
    if (!isFastForward && this.cursors.right?.isDown) {
      this.orientation += (Math.PI / 90);
    } else if (!isFastForward && this.cursors.left?.isDown) {
      this.orientation += (-Math.PI / 90);
    }

    const hasInput = !isFastForward && (this.cursors.up?.isDown || this.cursors.down?.isDown);
    const needsUpdate = !this.nextPredictions || hasInput;
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
    const velocityKmSecond = (1000000 * this.nextVelocity.length() / 24 / 60 / 60);

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

    const displayVelocity = velocityKmSecond.toFixed(0);
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

    return new Phaser.Math.Vector2(1, 0).setToPolar(this.orientation).scale(y);
  }

  private gameState() {
    return (<GameState>this.scene.settings.data);
  }
}

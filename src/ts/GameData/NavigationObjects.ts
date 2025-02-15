/* 
Copyright 2020, Justin Reardon. 

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

import { GravityWell } from "../Logic/GravitySimulation";
import AstronomicalMath from "../Logic/AstronomicalMath";
import Utilities, { Colours, Sprites, UI } from "../Utilities";
import GameState, { arrayToPosition, calculateFuelUsage, Events, InteractiveObject, ObjectDetail, ObjectInfo, SolarSystemDefinition, StatusMaxValue } from "./GameState";
import { AsteroidBelt, Civilization, isBlackHole, Planet, planetInfo, planetPositionAt, SolarSystemObject, Sun } from "./SolarSystemObjects";
import { civilizationHint, civilizationInfo } from "./Civilization";

export interface ScalableObject extends GravityWell, InteractiveObject {
  create(scene: Phaser.Scene): void
  update(scene: Phaser.Scene): void
  setScale(scale: number): void
  readonly interactionObject?: Phaser.GameObjects.GameObject
}

export type NavObject = { definition?: SolarSystemObject, scalable: ScalableObject };

export function createGameObjects(system: SolarSystemDefinition, others: { [id: string]: SolarSystemDefinition })
  : NavObject[] {

  const objects: NavObject[] = [];
  // technically gets the mass of all suns, but that's fine
  const sunMass = Object.keys(system.objects)
    .filter(x => system.objects[x].type == "sun")
    .map(x => (<Sun>system.objects[x]).mass)
    .reduce((a, x) => a + x, 0);
  const planets: (PlanetSprite | Asteroids)[] = [];
  for (let key in system.objects) {
    const object = system.objects[key];
    switch (object.type) {
      case "sun":
        objects.push({ definition: object, scalable: new SunSprite(object) });
        break;
      case "planet":
        const sprite = new PlanetSprite(object, sunMass);
        planets.push(sprite);
        objects.push({ definition: object, scalable: sprite });
        break;
      case "asteroids":
        const asteroids = new Asteroids(object);
        planets.push(asteroids);
        objects.push({ definition: object, scalable: asteroids })
    }
  }
  objects.unshift({ scalable: new InvisibleObjectIndicator(planets) });

  for (let id in others) {
    objects.push({ scalable: new InterstellarObject(system, others[id]) });
  }

  objects.push({ scalable: new InterstellarSpace(system.farthestOrbit()) })
  return objects;
}

export function createZoomLevels(system: SolarSystemDefinition): number[] {
  const radii: number[] = [0, 10000];
  for (let key in system.objects) {
    const planet = system.objects[key];
    if (planet.type == "planet") {
      radii.push(planet.orbitalRadius);
    }
  }

  radii.sort((a, b) => a - b);

  const levels: number[] = []
  for (let i = 1; i < radii.length; i++) {
    levels.push((radii[i - 1] + radii[i]) / 2);
  }

  return levels;
}

class InterstellarSpace implements ScalableObject {
  interactionObject: Phaser.GameObjects.GameObject;
  mass: number = 0;
  graphics: Phaser.GameObjects.Graphics;
  beginning: number;

  constructor(farthestOrbit: number) {
    this.beginning = farthestOrbit + 1000;
  }

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add.graphics();
    const innerCircle = new Phaser.Geom.Circle(0, 0, this.beginning);
    UI.showHoverHint(this.graphics, <GameState>scene.scene.settings.data, () => this.hint())
    this.graphics
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Circle(0, 0, this.beginning),
        hitAreaCallback: (circle: Phaser.Geom.Circle, x: number, y: number) =>
          !Phaser.Geom.Circle.Contains(circle, x, y)
      })
      .disableInteractive();
  }

  update(scene: Phaser.Scene): void {
  }

  setScale(scale: number): void {
    const isVisible = scale < 100;
    this.graphics.setVisible(isVisible)

    if (this.graphics.visible) {
      this.graphics
        .clear()
        .setInteractive()
        .lineStyle(this.beginning * 6, 0x200924)
        .beginPath()
        .arc(0, 0, this.beginning * 4, 0, Math.PI * 2, false, 0.02)
        .closePath()
        .strokePath();
    } else {
      this.graphics.disableInteractive();
    }
  }

  positionAt(minutes: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(0, 0)
  }

  info(): ObjectInfo {
    throw new Error("Method not implemented.");
  }

  hint(): string {
    return "Interstellar space.\nTravel into to begin an interstellar voyage."
  }

}

class Asteroids implements ScalableObject {
  interactionObject: Phaser.GameObjects.GameObject;
  mass: number = 0;
  graphics: Phaser.GameObjects.Graphics;
  scaledGraphics: Phaser.GameObjects.Graphics;

  constructor(public definition: AsteroidBelt) { }

  create(scene: Phaser.Scene): void {
    this.graphics = scene.add
      .graphics()
      .lineStyle(this.definition.radius * 2, 0x444400)
      .beginPath()
      .arc(0, 0, this.definition.orbitalRadius, 0, Math.PI * 2, false, 0.02)
      .closePath()
      .strokePath();
    this.scaledGraphics = scene.add.graphics();

    const innerCircle = new Phaser.Geom.Circle(0, 0, this.definition.orbitalRadius - this.definition.radius);
    this.graphics
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Circle(0, 0, this.definition.orbitalRadius + this.definition.radius),
        hitAreaCallback: (circle: Phaser.Geom.Circle, x: number, y: number) =>
          Phaser.Geom.Circle.Contains(circle, x, y) && !Phaser.Geom.Circle.Contains(innerCircle, x, y)
      })
      .disableInteractive();
    this.interactionObject = this.graphics;
  }

  update(scene: Phaser.Scene): void {
  }

  setScale(scale: number): void {
    const isVisible = scale < 100 && this.definition.orbitalRadius / scale > 30;
    this.graphics.setVisible(isVisible)
    this.scaledGraphics.setVisible(this.graphics.visible);

    if (this.scaledGraphics.visible) {
      this.scaledGraphics
        .clear()
        .lineStyle(scale * 2, 0xffffcc)
        .strokeCircle(0, 0, this.definition.orbitalRadius + this.definition.radius)
        .strokeCircle(0, 0, this.definition.orbitalRadius - this.definition.radius)
    }
  }

  positionAt(minutes: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2();
  }

  info(): ObjectInfo {
    return {
      name: this.definition.name,
      definition: this.definition,
      position: null,
      details: [
        this.definition.description ?? "An ore and ice rich asteroid belt.",
        "Traversing at >50km/s risks dangeous collisions.",
        "Deploy scavenger drones to mine and replenish the Sojourner's supplies."
      ]
    }
  }

  hint(): string {
    return this.definition.name + "\n Traversing at >50km/s risks dangeous collisions.\nDeploy scavenger drones to mine."
  }

}

class InterstellarObject implements ScalableObject {
  interactionObject: Phaser.GameObjects.GameObject
    & Phaser.GameObjects.Components.Transform
    & Phaser.GameObjects.Components.Visible;
  mass: number = 0;
  position: Phaser.Math.Vector2;
  distanceToOtherStar: number;
  sameSystem: boolean;
  selectionIndicator?: Phaser.GameObjects.Sprite;

  constructor(
    private currentSystem: SolarSystemDefinition,
    private otherSystem: SolarSystemDefinition
  ) {
    this.sameSystem = this.otherSystem.name === this.currentSystem.name;

  }

  create(scene: Phaser.Scene) {
    const vectorToOtherStar = this.currentSystem.vectorTo(this.otherSystem);
    this.distanceToOtherStar = Math.max(0.0005, vectorToOtherStar.length());
    this.position = vectorToOtherStar.scale(10000);
    this.interactionObject = this.otherSystem.hasSun()
      ? scene.add.image(this.position.x, this.position.y, Sprites.Sun).setTint(Colours.SelectableTint)
      : scene.add.image(this.position.x, this.position.y, Sprites.BlackHole).setTint(Colours.WarningTint);
    if (this.sameSystem) {
      this.selectionIndicator = scene.add
        .sprite(0, 0, "selectionIndicator")
        .setTint(Colours.NeutralTint)
        .setRotation(Math.PI / 4);
    }

  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    this.interactionObject.setScale(scale);
    this.interactionObject.setVisible(scale >= 100)
    this.selectionIndicator?.setScale(scale);
    this.selectionIndicator?.setVisible(scale >= 100)

  }

  hint() {
    return this.otherSystem.name + (this.otherSystem.description ? `\n${this.otherSystem.description}` : "");
  }

  info(): ObjectInfo {
    const travelTime = AstronomicalMath.travelTime(this.distanceToOtherStar);
    const fuelUsage = calculateFuelUsage(1, 365 * 24 * 60 * travelTime.reference, 365 * 24 * 60 * travelTime.relative);
    const details: ObjectDetail[] = [
      `Distance: ${this.distanceToOtherStar.toFixed(1)} ly`,
      `Fuel Needed: ${(100 * fuelUsage / StatusMaxValue).toFixed(0)}% total`,
      `Travel Time: \n    ${travelTime.reference.toFixed(2)} y earth\n    ${travelTime.relative.toFixed(2)} y relative`,
      {
        name: this.sameSystem ? "Return" : "Travel",
        hint: this.sameSystem ? "Turn back to the local sun" : "Begin the relativistic journey to " + this.otherSystem.name,
        action: x => this.travel(x)
      }
    ]
    if (this.otherSystem.description) {
      details.unshift(this.otherSystem.description)
    }

    return {
      name: this.otherSystem.name,
      details: details,
      definition: this.otherSystem,
      position: t => this.positionAt(t)
    }
  }

  positionAt(minutes: number): Phaser.Math.Vector2 {
    return this.position;
  }

  private travel(state: GameState) {
    const shipPosition = arrayToPosition(state.ship.position);
    state.travelTo(this.otherSystem, shipPosition);
  }

}

class InvisibleObjectIndicator implements ScalableObject {
  position: Phaser.Math.Vector2;
  mass: number;
  orbits: (PlanetSprite | Asteroids)[];
  min: PlanetSprite | Asteroids | null;
  interactionObject: Phaser.GameObjects.Arc;

  constructor(planets: (PlanetSprite | Asteroids)[]) {
    this.position = new Phaser.Math.Vector2();
    this.mass = 0;
    this.orbits = planets.sort((a, b) => a.definition.orbitalRadius - b.definition.orbitalRadius);
  }

  positionAt(time: number) { return this.position }

  hint() {
    return `Unrenderable Objects (${this.hiddenObjects().length})`;
  }

  info(): ObjectInfo {
    const hidden = this.hiddenObjects();
    return {
      name: `Unrenderable Objects (${hidden.length})`,
      position: null,
      details: [
        "Objects are too close to the sun to display at this resolution:",
        ...hidden.map(x => ({
          name: x.definition.name,
          hint: `Show info for ${x.definition.name}`,
          action: (state: GameState) => {
            state.emit(Events.HoverHint, null)
            state.emit(Events.ShowInfo, x.info())
          }
        }))
      ],
      definition: null
    }
  }

  private hiddenObjects() {
    return this.orbits.filter(x => x.definition.orbitalRadius < (this.min?.definition.orbitalRadius ?? 0));
  }

  create(scene: Phaser.Scene) {
    this.interactionObject = scene.add.circle(0, 0, 0, Colours.TextTint).setAlpha(0.5)
      .setInteractive({
        useHandCursor: true,
        hitArea: new Phaser.Geom.Circle(0, 0, 0),
        hitAreaCallback: Phaser.Geom.Circle.Contains
      })
      .disableInteractive();
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    this.min = this.orbits.find(x => x.definition.orbitalRadius / scale > 30) || this.orbits[this.orbits.length - 1];
    if (this.min == this.orbits[0]) {
      this.interactionObject.setVisible(false);
    } else {
      this.interactionObject.setRadius(this.min.definition.orbitalRadius);
      this.interactionObject.setVisible(scale < 100).setInteractive({ useHandCursor: true });
      this.interactionObject.input.hitArea =
        new Phaser.Geom.Circle(this.min.definition.orbitalRadius, this.min.definition.orbitalRadius, this.min.definition.orbitalRadius)
    }
  }
}

class SunSprite implements ScalableObject {
  private toScale: (Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Visible)[] = [];
  private regenIndicators: (Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Visible)[] = [];
  position: Phaser.Math.Vector2;
  mass: number;
  interactionObject: Phaser.GameObjects.GameObject;

  constructor(private definition: Sun) {
    this.position = new Phaser.Math.Vector2();
    this.mass = definition.mass;
  }

  positionAt(time: number) { return this.position }

  create(scene: Phaser.Scene) {
    const outerCircle = isBlackHole(this.definition)
      ? scene.add.image(0, 0, Sprites.BlackHole).setTint(Colours.WarningTint)
      : scene.add.image(0, 0, Sprites.Sun).setTint(0xeeeeaa);
    this.toScale.push(outerCircle);
    const ringCount = isBlackHole(this.definition) ? 0 : 5;
    this.regenIndicators = [];
    for (let i = 1; i <= ringCount; i++) {
      this.regenIndicators.push(scene.add.circle(0, 0, 200 * Math.pow(i / ringCount, 2), 0xeeeeaa, 0.10));
    }
    this.interactionObject = outerCircle;
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    for (const o of this.toScale) {
      o.setScale(scale);
      o.setVisible(scale < 100)
    }
    this.regenIndicators.forEach(x => x.setVisible(scale <= 2));
  }

  hint() {
    return this.definition.name;
  }

  info(): ObjectInfo {
    return {
      name: this.definition.name,
      details: [this.definition.description ?? "Local sun."],
      definition: this.definition,
      position: t => this.positionAt(t)
    }
  }
}

class PlanetSprite implements ScalableObject {
  position: Phaser.Math.Vector2;
  mass: number;
  orbit: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Sprite;
  civilizations: { sprite: Phaser.GameObjects.Sprite, civ: Civilization, established: boolean, inView: boolean }[] = [];
  interactionObject: Phaser.GameObjects.GameObject;

  constructor(public definition: Planet, private sunMass: number) {
    this.mass = definition.mass;
    this.position = new Phaser.Math.Vector2(-100000, -100000);
  }

  positionAt(time: number) {
    return planetPositionAt(this.definition, this.sunMass, time);
  }

  create(scene: Phaser.Scene) {
    this.orbit = scene.add.graphics().setAlpha(0.8);
    this.sprite = scene.add.sprite(-100000, -100000, Sprites.Planet).setTint(Colours.NeutralTint);
    this.interactionObject = this.sprite;

    this.createCivilizationSprites(scene);
  }

  private createCivilizationSprites(scene: Phaser.Scene) {
    const locations = [[1, 1], [1, 0], [0, 0], [0, 1]];
    for (const civ of this.definition.civilizations ?? []) {
      const pos = locations.pop();
      if (!pos) {
        Utilities.Log("Too many civilizations to display");
      } else {
        const sprite = scene.add.sprite(-10000, -10000, Sprites.Civilization)
          .setOrigin(pos[0], pos[1])
          .setTint(this.civilizationTint(civ));

        const state = <GameState>scene.scene.settings.data;
        sprite.setInteractive({ useHandCursor: true });
        UI.showHoverHint(sprite, state, () => civilizationHint(civ));
        sprite.on("pointerdown", () => state.emit(Events.ShowInfo, civilizationInfo(civ, this.definition, this.sunMass)));
        this.civilizations.push({ sprite, civ, established: false, inView: true });
      }
    }
  }

  private civilizationTint(civ: Civilization): number | undefined {
    if (civ.destroyed) {
      return Colours.DeadTint;
    }

    if (civ.species === "human") {
      return Colours.AllyTint;
    }

    return Colours.WarningTint;
  }

  private destroyCivilizationSprites() {
    for (const civ of this.civilizations) {
      civ.sprite.destroy();
    }
    this.civilizations = [];
  }


  update(scene: Phaser.Scene) {
    const minutes = gameState(scene).earthTime;
    this.position = this.positionAt(minutes);
    this.sprite.setPosition(this.position.x, this.position.y);

    if (this.civilizations.length != (this.definition.civilizations?.length ?? 0)) {
      this.destroyCivilizationSprites();
      this.createCivilizationSprites(scene);
    }

    for (const civ of this.civilizations) {
      civ.established = civ.civ.established <= minutes;
      civ.sprite
        .setTint(this.civilizationTint(civ.civ))
        .setAlpha(Phaser.Math.Clamp((minutes - civ.civ.established) / 10000, 0, 1))
        .setVisible(civ.established && civ.civ.scanned && this.sprite.visible)
        .setPosition(this.position.x, this.position.y)
    }
  }

  setScale(scale: number) {
    this.orbit.clear();
    this.orbit.lineStyle(2 * scale, Colours.TextTint);
    this.orbit.strokeCircle(0, 0, this.definition.orbitalRadius);
    this.sprite.setScale(scale);

    const isVisible = scale < 100 && this.definition.orbitalRadius / scale > 30;
    this.orbit.setVisible(isVisible);
    this.sprite.setVisible(isVisible);
    for (const civ of this.civilizations) {
      civ.inView = isVisible;
      civ.sprite.setScale(scale).setVisible(civ.established && civ.inView);
    }
  }

  hint() {
    return this.definition.name;
  }

  info() {
    return planetInfo(this.definition, this.sunMass);
  }
}

function gameState(scene: Phaser.Scene): GameState {
  return (<GameState>scene.scene.settings.data);
}

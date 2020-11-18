import { GravityWell } from "../Logic/GravitySimulation";
import AstronomicalMath from "../Logic/AstronomicalMath";
import { Colours, Sprites } from "../Utilities";
import GameState, { arrayToPosition, calculateFuelUsage, Events, InteractiveObject, ObjectInfo, SolarSystemDefinition, StatusMaxValue } from "./GameState";
import { Planet, planetInfo, planetPositionAt, SolarSystemObject, Sun } from "./SolarSystemObjects";

export interface ScalableObject extends GravityWell, InteractiveObject {
  create(scene: Phaser.Scene)
  update(scene: Phaser.Scene)
  setScale(scale: number)
  readonly interactionObject: Phaser.GameObjects.GameObject
}

export function createGameObjects(system: SolarSystemDefinition, others: { [id: string]: SolarSystemDefinition }): ScalableObject[] {
  const objects: ScalableObject[] = [];
  // technically gets the mass of all suns, but that's fine
  const sunMass = Object.keys(system.objects)
    .filter(x => system.objects[x].type == "sun")
    .map(x => (<Sun>system.objects[x]).mass)
    .reduce((a, x) => a + x, 0);
  const planets: PlanetSprite[] = [];
  for (let key in system.objects) {
    const object = system.objects[key];
    switch (object.type) {
      case "sun":
        objects.push(new SunSprite(object));
        break;
      case "planet":
        const sprite = new PlanetSprite(object, sunMass);
        planets.push(sprite);
        objects.push(sprite);
        break;
    }
  }
  objects.unshift(new InvisibleObjectIndicator(planets));

  for (let id in others) {
    objects.push(new InterstellarObject(system, others[id]));
  }
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

class InterstellarObject implements ScalableObject {
  interactionObject: Phaser.GameObjects.GameObject
    & Phaser.GameObjects.Components.Transform
    & Phaser.GameObjects.Components.Visible;
  mass: number = 0;
  position: Phaser.Math.Vector2;
  distanceToOtherStar: number;

  constructor(
    private currentSystem: SolarSystemDefinition,
    private otherSystem: SolarSystemDefinition
  ) { }

  create(scene: Phaser.Scene) {
    const vectorToOtherStar = this.currentSystem.vectorTo(this.otherSystem);
    this.distanceToOtherStar = Math.max(0.0005, vectorToOtherStar.length());
    this.position = vectorToOtherStar.scale(10000);
    this.interactionObject = scene.add.image(this.position.x, this.position.y, Sprites.Sun)
      .setTint(Colours.SelectableTint);
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    this.interactionObject.setScale(scale);
    this.interactionObject.setVisible(scale >= 100)

  }

  hint() {
    return this.otherSystem.name;
  }

  info(): ObjectInfo {
    const sameSystem = this.otherSystem.name === this.currentSystem.name;
    const travelTime = AstronomicalMath.travelTime(this.distanceToOtherStar);
    const fuelUsage = calculateFuelUsage(1, 365 * 24 * 60 * travelTime.reference, 365 * 24 * 60 * travelTime.relative);
    return {
      name: this.otherSystem.name,
      details: [
        `Distance: ${this.distanceToOtherStar.toFixed(1)} ly`,
        `Fuel Needed: ${(100 * fuelUsage / StatusMaxValue).toFixed(0)}% total`,
        `Travel Time: \n    ${travelTime.reference.toFixed(2)} y earth\n    ${travelTime.relative.toFixed(2)} y relative`,
        {
          name: sameSystem ? "Return" : "Travel",
          hint: sameSystem ? "Turn back to the local sun" : "Begin the relativistic journey to " + this.otherSystem.name,
          action: x => this.travel(x)
        }
      ],
      definition: this.otherSystem
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
  orbits: PlanetSprite[];
  min: PlanetSprite | null;
  interactionObject: Phaser.GameObjects.Arc;

  constructor(planets: PlanetSprite[]) {
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
  position: Phaser.Math.Vector2;
  mass: number;
  interactionObject: Phaser.GameObjects.GameObject;

  constructor(private definition: Sun) {
    this.position = new Phaser.Math.Vector2();
    this.mass = definition.mass;
  }

  positionAt(time: number) { return this.position }

  create(scene: Phaser.Scene) {
    const outerCircle = scene.add.image(0, 0, Sprites.Sun).setTint(0xeeeeaa);
    this.toScale.push(outerCircle);
    this.interactionObject = outerCircle;
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    for (const o of this.toScale) {
      o.setScale(scale);
      o.setVisible(scale < 100)
    }
  }

  hint() {
    return this.definition.name;
  }

  info() {
    return {
      name: this.definition.name,
      details: ["Local sun."],
      definition: this.definition
    }
  }
}

class PlanetSprite implements ScalableObject {
  position: Phaser.Math.Vector2;
  mass: number;
  orbit: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Sprite;
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
    this.sprite = scene.add.sprite(-100000, -100000, Sprites.Planet).setTint(Colours.SelectableTint);
    this.interactionObject = this.sprite;
  }

  update(scene: Phaser.Scene) {
    const minutes = gameState(scene).earthTime;
    this.position = this.positionAt(minutes);
    this.sprite.setPosition(this.position.x, this.position.y);
  }

  setScale(scale: number) {
    this.orbit.clear();
    this.orbit.lineStyle(2 * scale, Colours.TextTint);
    this.orbit.strokeCircle(0, 0, this.definition.orbitalRadius);
    this.sprite.setScale(scale);

    const isVisible = scale < 100 && this.definition.orbitalRadius / scale > 30;
    this.orbit.setVisible(isVisible);
    this.sprite.setVisible(isVisible);
  }

  hint() {
    return this.definition.name;
  }

  info() {
    return planetInfo(this.definition);
  }
}

function gameState(scene: Phaser.Scene): GameState {
  return (<GameState>scene.scene.settings.data);
}

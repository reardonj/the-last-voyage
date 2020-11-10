import { GravityWell } from "../Logic/GravitySimulation";
import RelativisticMath from "../Logic/RelativisticMath";
import { Colours, Sprites } from "../Utilities";
import GameState, { Planet, SolarSystemDefinition, Sun } from "./GameState";

export interface ScalableObject extends GravityWell {
  create(scene: Phaser.Scene)
  update(scene: Phaser.Scene)
  setScale(scale: number)
  info(): ObjectInfo
  readonly interactionObject: Phaser.GameObjects.GameObject
}

export type ObjectInfo = {
  name: string,
  description: string
}

export function createGameObjects(system: SolarSystemDefinition): ScalableObject[] {
  const objects = [];
  // technically gets the mass of all suns, but that's fine
  const sunMass = Object.keys(system.objects)
    .filter(x => system.objects[x].type == "sun")
    .map(x => system.objects[x].mass)
    .reduce((a, x) => a + x, 0);
  const planets = [];
  for (let key in system.objects) {
    const object = system.objects[key];
    switch (object.type) {
      case "sun":
        objects.push(new SunSprite(object));
        break;
      case "planet":
        planets.push(object);
        objects.push(new PlanetSprite(object, sunMass));
        break;
    }
  }
  objects.unshift(new InvisibleObjectIndicator(planets));
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

  const levels = []
  for (let i = 1; i < radii.length; i++) {
    levels.push((radii[i - 1] + radii[i]) / 2);
  }

  return levels;
}

class InvisibleObjectIndicator implements ScalableObject {
  position: Phaser.Math.Vector2;
  mass: number;
  orbits: Planet[];
  min: Planet;
  interactionObject: Phaser.GameObjects.Arc;

  constructor(planets: Planet[]) {
    this.position = new Phaser.Math.Vector2();
    this.mass = 0;
    this.orbits = planets.sort((a, b) => a.orbitalRadius - b.orbitalRadius);
  }

  info(): ObjectInfo {
    const hidden = this.orbits.filter(x => x.orbitalRadius < this.min.orbitalRadius);
    return {
      name: `Unrenderable Objects (${hidden.length})`,
      description: "Objects are too close to the sun to display at this resolution:\n" + hidden.map(x => "  - " + x.name).join("\n")
    }
  }

  create(scene: Phaser.Scene) {
    this.interactionObject = scene.add.circle(0, 0, 0, Colours.TextTint).setAlpha(0.5)
      .setInteractive(new Phaser.Geom.Circle(0, 0, 0), Phaser.Geom.Circle.Contains)
      .disableInteractive();
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    this.min = this.orbits.find(x => x.orbitalRadius / scale > 30);
    if (this.min == this.orbits[0]) {
      this.interactionObject.setVisible(false);
    } else {
      this.interactionObject.setRadius(this.min.orbitalRadius);
      this.interactionObject.setVisible(true).setInteractive();
      this.interactionObject.input.hitArea =
        new Phaser.Geom.Circle(this.min.orbitalRadius, this.min.orbitalRadius, this.min.orbitalRadius)
    }
  }
}

class SunSprite implements ScalableObject {
  private toScale: Phaser.GameObjects.Components.Transform[] = [];
  position: Phaser.Math.Vector2;
  mass: number;
  interactionObject: Phaser.GameObjects.GameObject;

  constructor(private definition: Sun) {
    this.position = definition.position;
    this.mass = definition.mass;
  }

  create(scene: Phaser.Scene) {
    const outerCircle = scene.add.circle(this.definition.position.x, this.definition.position.y, 12, Colours.TextTint);
    this.toScale.push(outerCircle);
    this.toScale.push(scene.add.circle(this.definition.position.x, this.definition.position.y, 10, 0xeeeea0));
    this.interactionObject = outerCircle;
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    for (const o of this.toScale) {
      o.setScale(scale);
    }
  }

  info() {
    return {
      name: this.definition.name,
      description: "Local sun.",
    }
  }
}

class PlanetSprite implements ScalableObject {
  position: Phaser.Math.Vector2;
  mass: number;
  orbit: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Sprite;
  orbitalPeriod: number;
  interactionObject: Phaser.GameObjects.GameObject;

  constructor(private definition: Planet, private sunMass: number) {
    this.mass = definition.mass;
    this.position = new Phaser.Math.Vector2(-100000, -100000);
  }

  create(scene: Phaser.Scene) {
    this.orbit = scene.add.graphics();
    this.sprite = scene.add.sprite(-100000, -100000, Sprites.Planet).setTint(Colours.TextTint);
    this.interactionObject = this.sprite;
    this.orbitalPeriod =
      this.definition.orbitalSpeedMultiplier *
      24 * 60 * RelativisticMath.orbitalPeriod(this.definition.orbitalRadius, this.sunMass);
  }

  update(scene: Phaser.Scene) {
    const days = gameState(scene).earthTime;
    const positionInOrbit = this.definition.startAngle + 2 * Math.PI * (days / this.orbitalPeriod);
    this.position.setToPolar(positionInOrbit, this.definition.orbitalRadius);
    this.sprite.setPosition(this.position.x, this.position.y);
  }

  setScale(scale: number) {
    this.orbit.clear();
    this.orbit.lineStyle(2 * scale, Colours.TextTint);
    this.orbit.strokeCircle(0, 0, this.definition.orbitalRadius);
    this.sprite.setScale(scale);

    const isVisible = this.definition.orbitalRadius / scale > 30;
    this.orbit.setVisible(isVisible);
    this.sprite.setVisible(isVisible);
  }

  info() {
    return {
      name: this.definition.name,
      description: this.definition["description"] ?? "",
    }
  }
}

function gameState(scene: Phaser.Scene): GameState {
  return (<GameState>scene.scene.settings.data);
}

import { GravityWell } from "../Logic/GravitySimulation";
import RelativisticMath from "../Logic/RelativisticMath";
import { Colours, Sprites } from "../Utilities";
import GameState, { Planet, SolarSystemDefinition, Sun } from "./GameState";

export interface ScalableObject extends GravityWell {
  create(scene: Phaser.Scene)
  update(scene: Phaser.Scene)
  setScale(scale: number)
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
  graphic: Phaser.GameObjects.Arc;

  constructor(planets: Planet[]) {
    this.position = new Phaser.Math.Vector2();
    this.mass = 0;
    this.orbits = planets.sort((a, b) => a.orbitalRadius - b.orbitalRadius);
  }

  create(scene: Phaser.Scene) {
    this.graphic = scene.add.circle(0, 0, 0, Colours.TextTint).setAlpha(0.5);
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    const min = this.orbits.find(x => x.orbitalRadius / scale > 30);
    if (min == this.orbits[0]) {
      this.graphic.setVisible(false);
    } else {
      this.graphic.setRadius(min.orbitalRadius);
      this.graphic.setVisible(true);
    }
  }
}

class SunSprite implements ScalableObject {
  private toScale: Phaser.GameObjects.Components.Transform[] = [];
  position: Phaser.Math.Vector2;
  mass: number;

  constructor(private definition: Sun) {
    this.position = definition.position;
    this.mass = definition.mass;
  }

  create(scene: Phaser.Scene) {
    this.toScale.push(scene.add.circle(this.definition.position.x, this.definition.position.y, 12, Colours.TextTint));
    this.toScale.push(scene.add.circle(this.definition.position.x, this.definition.position.y, 10, 0xeeeea0));
  }

  update(scene: Phaser.Scene) {
  }

  setScale(scale: number) {
    for (const o of this.toScale) {
      o.setScale(scale);
    }
  }
}

class PlanetSprite implements ScalableObject {
  position: Phaser.Math.Vector2;
  mass: number;
  orbit: Phaser.GameObjects.Graphics;
  sprite: Phaser.GameObjects.Sprite;
  orbitalPeriod: number;

  constructor(private definition: Planet, private sunMass: number) {
    this.mass = definition.mass;
    this.position = new Phaser.Math.Vector2(-100000, -100000);
  }

  create(scene: Phaser.Scene) {
    this.orbit = scene.add.graphics();
    this.sprite = scene.add.sprite(-100000, -100000, Sprites.Planet).setTint(Colours.TextTint);
    this.orbitalPeriod = 24 * 60 * RelativisticMath.orbitalPeriod(this.definition.orbitalRadius, this.sunMass);
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
}

function gameState(scene: Phaser.Scene): GameState {
  return (<GameState>scene.scene.settings.data);
}

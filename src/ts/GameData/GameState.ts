import MainMenu from "../Scenes/MainMenu";
import SolarSystemNavigation from "../Scenes/SolarSystemNavigation";
import { ScalableObject } from "./SolarSystemObject";

export default class GameState implements SavedState {
  earthTime: number;
  relativeTime: number;
  currentScene: CurrentScene;
  systems: { [id: string]: SolarSystemDefinition; };
  eventSource: Phaser.Events.EventEmitter;

  static newGame() {
    const systems = createSystems();
    return new GameState({
      earthTime: 0,
      relativeTime: 0,
      systems: systems,
      currentScene: [
        "solar-system",
        {
          name: "Sol",
          initVelocity: new Phaser.Math.Vector2(10, 8),
          initPosition: new Phaser.Math.Vector2(-5000, -5000)
        }]
    });
  }

  constructor(savedState: SavedState) {
    this.earthTime = savedState.earthTime;
    this.relativeTime = savedState.relativeTime;
    this.currentScene = savedState.currentScene;
    this.systems = savedState.systems;
    this.eventSource = new Phaser.Events.EventEmitter();
  }

  currentSceneName() {
    switch (this.currentScene[0]) {
      case "solar-system":
        return SolarSystemNavigation.Name;
      default:
        throw new Error("Current scene is unkown.");
    }
  }

  currentSystem(): SolarSystemDefinition {
    switch (this.currentScene[0]) {
      case "solar-system":
        return this.systems[this.currentScene[1].name];
      default:
        throw new Error("Current scene is unkown.");
    }
  }

  updateTime(earth: number, relative: number) {
    this.earthTime += earth;
    this.relativeTime += relative;
    this.eventSource.emit(Events.TimePassed, { earth: this.earthTime, relative: this.relativeTime });
  }

}

function createSystems(): { [id: string]: SolarSystemDefinition } {
  return {
    "Sol": new SolarSystemDefinition("Sol", {
      "Sol": sun("Sol", 20000000, new Phaser.Math.Vector2()),
      "Mercury": planet("Mercury", 3, 57, 0),
      "Venus": planet("Venus", 49, 108, 1),
      "Earth": planet("Earth", 50, 149, 2),
      "Mars": planet("Mars", 6.4, 227, 3),
      "Jupiter": planet("Jupiter", 18987, 778, 4),
      "Saturn": planet("Saturn", 5685, 1426, 5),
      "Uranus": planet("Uranus", 868, 2870, 6),
      "Neptune": planet("Neptune", 1024, 4498, 7)
    })
  };
}

export type CurrentScene = ["solar-system", SolarSystemState];

export interface SavedState {
  earthTime: number,
  relativeTime: number,
  currentScene: CurrentScene,
  systems: { [id: string]: SolarSystemDefinition }
}

export interface SolarSystemState {
  initVelocity: Phaser.Math.Vector2;
  initPosition: Phaser.Math.Vector2;
  name: string;
}

export type Sun = {
  type: "sun",
  name: string,
  mass: number,
  position: Phaser.Math.Vector2
}

function sun(name: string, mass: number, position: Phaser.Math.Vector2): Sun {
  return { type: "sun", name: name, mass: mass, position: position };
}

export type Planet = {
  type: "planet"
  name: string,
  mass: number,
  orbitalRadius: number,
  startAngle: number
}

function planet(name: string, mass: number, orbitalRadius: number, startAngle: number): Planet {
  return { type: "planet", name: name, mass: mass, orbitalRadius: orbitalRadius, startAngle };
}

export type SolarSystemObject = Sun | Planet;

export class SolarSystemDefinition {
  constructor(
    public name: string,
    public objects: { [id: string]: SolarSystemObject }
  ) { }
}

export const Events = {
  TimePassed: "timePassed",
  LocationChanged: "locationChanged"
}

export interface TimePassedEvent {
  earth: number;
  relative: number;
}

export type LocationChangedEvent = string[]

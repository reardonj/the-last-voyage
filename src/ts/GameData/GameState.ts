import AstronomicalMath from "../Logic/AstronomicalMath";
import GameOver from "../Scenes/GameOver";
import Interstellar from "../Scenes/Interstellar";
import SolarSystemNavigation from "../Scenes/SolarSystemNavigation";
import Transition from "../Scenes/Transition";
import Utilities from "../Utilities";
import { Worlds } from "./World";

export default class GameState implements SavedState {
  fuel: number;
  passengers: number;
  integrity: number;
  supplies: number;
  earthTime: number;
  relativeTime: number;
  currentScene: CurrentScene;
  systems: { [id: string]: SolarSystemDefinition; };
  eventSource: Phaser.Events.EventEmitter;
  nextScene: CurrentScene | null = null;

  static newGame(transitionScene: Transition) {
    const systems = createSystems();
    return new GameState({
      fuel: StatusMaxValue,
      passengers: StatusMaxValue,
      integrity: StatusMaxValue,
      supplies: StatusMaxValue,
      earthTime: 0,
      relativeTime: 0,
      systems: systems,
      currentScene: [
        "solar-system",
        {
          name: "Sol",
          velocity: new Phaser.Math.Vector2(5, 3),
          orientation: new Phaser.Math.Vector2(5, 3).angle(),
          position: new Phaser.Math.Vector2(-40, 146)
        }]
    },
      transitionScene);
  }

  constructor(savedState: SavedState, public transitionScene: Transition) {
    this.fuel = savedState.fuel;
    this.passengers = savedState.passengers;
    this.integrity = savedState.integrity;
    this.supplies = savedState.supplies;

    this.earthTime = savedState.earthTime;
    this.relativeTime = savedState.relativeTime;
    this.currentScene = savedState.currentScene;
    this.systems = savedState.systems;
    this.eventSource = new Phaser.Events.EventEmitter();
  }

  currentSceneName(): string {
    switch (this.currentScene[0]) {
      case "solar-system":
        return SolarSystemNavigation.Name;
      case "interstellar":
        return Interstellar.Name;
      case "game-over":
        return GameOver.Name;
    }
  }

  currentSceneType() {
    switch (this.currentScene[0]) {
      case "solar-system":
        return SolarSystemNavigation;
      case "interstellar":
        return Interstellar;
      case "game-over":
        return GameOver;
      default:
        throw new Error("Current scene is unkown.");
    }
  }

  currentSystem(): SolarSystemDefinition | null {
    switch (this.currentScene[0]) {
      case "solar-system":
        return this.systems[this.currentScene[1].name];
      case "interstellar":
        return null;
      case "game-over":
        return null;
    }
  }

  /***
   * Perform all calculations for advancing the game the given amount of time.
   * @param thrusterAcceleration as a percentage of 1g.
   */
  timeStep(
    acceleration: number,
    thrusterAcceleration: number,
    durationEarthMinutes: number,
    durationRelativeMinutes: number
  ) {
    const previousIntegrity = this.integrity;
    this.earthTime += durationEarthMinutes;
    this.relativeTime += durationRelativeMinutes;
    this.fuel = clampStatusValue(this.fuel - calculateFuelUsage(thrusterAcceleration, durationEarthMinutes, durationRelativeMinutes));
    this.integrity = clampStatusValue(this.integrity - durationRelativeMinutes / 1000);

    // Accelerating beyond 1g causes damage.
    if (acceleration > 1) {
      this.integrity = clampStatusValue(this.integrity - Math.max(0, acceleration - 1) * durationRelativeMinutes);
    }

    // If the ship sustains serious damage while having <50% hull integrity, 
    // people will die. The more people aboard, the more likely deaths occur.
    const damage = previousIntegrity - this.integrity;
    if (damage > 100 && this.integrity < 0.5 * StatusMaxValue) {
      const popPercent = this.passengers / StatusMaxValue;
      this.passengers = clampStatusValue(this.passengers - popPercent * Phaser.Math.Between(1, damage / 10));
      this.eventSource.emit(Events.PassengersChanged, this.passengers);
    }

    this.eventSource.emit(Events.IntegrityChanged, this.integrity);
    this.eventSource.emit(Events.FuelChanged, this.fuel);
    this.eventSource.emit(Events.TimePassed, { earth: this.earthTime, relative: this.relativeTime, minutesPerTick: durationEarthMinutes });
  }

  /**
   * Begin travel to another star system.
   * @param destination The destination system.
   */
  travelTo(destination: SolarSystemDefinition, leavingPosition: Phaser.Math.Vector2) {
    const origin = this.currentSystem();
    if (!origin) {
      Utilities.Log("Tried to travel when no current system!");
      return;
    }

    if (this.nextScene) {
      Utilities.Log("Tried but there is already a pending transition!");
      return;
    }

    const travelTime = AstronomicalMath.travelTime(origin.vectorTo(destination).length());
    const fuelUsage = calculateFuelUsage(1, travelTime.reference * 365 * 24 * 60, travelTime.relative * 365 * 24 * 60);

    if (fuelUsage >= this.fuel) {
      this.eventSource.emit(Events.Warning, "Cannot travel to destination. Insufficient fuel.");
    } else {
      this.nextScene = ["interstellar", { travelTime, origin, destination, leavingPosition }]
    }

  }

  doStateBasedTransitions(currentScene: Phaser.Scene) {
    if (this.currentScene[0] == "game-over") {
      return;
    }

    if (this.fuel == 0) {
      this.currentScene = ["game-over", { reason: "fuel" }]
      this.transition(currentScene);
    } else if (this.integrity == 0) {
      this.currentScene = ["game-over", { reason: "integrity" }]
      this.transition(currentScene);
    } else if (this.nextScene) {
      this.currentScene = this.nextScene;
      this.nextScene = null;
      this.transition(currentScene);
    }
  }

  transitionTo(next: CurrentScene) {
    if (this.nextScene) {
      Utilities.Log(`Tried to transition to ${next[0]} but transition to ${this.nextScene[0]}`);
      return;
    }

    this.nextScene = next;
  }

  transition(currentScene: Phaser.Scene) {
    Utilities.Log(`Transitioning to ${this.currentSceneName()}`);
    const newScene = currentScene.scene.add(this.currentSceneName(), this.currentSceneType(), false, this);
    newScene.scene.sendToBack(this.currentSceneName());
    this.eventSource.emit(Events.ShowInfo, null);
    this.eventSource.emit(Events.HoverHint, null);
    currentScene.scene.transition({
      target: this.currentSceneName(),
      data: this,
      duration: 500,
      remove: true,
      allowInput: false
    });
    this.transitionScene.startTransition(500);
  }

}

export function calculateFuelUsage(thrusterAcceleration: number, durationEarthMinutes: number, durationRelativeMinutes: number) {
  return (0.05 * thrusterAcceleration * durationEarthMinutes + durationRelativeMinutes / 1000);
}

function clampStatusValue(value: number) {
  return Phaser.Math.Clamp(value, 0, StatusMaxValue);
}

function createSystems(): { [id: string]: SolarSystemDefinition } {
  return Worlds.map(x => new SolarSystemDefinition(
    x.name,
    <[number, number]>x.position,
    x.objects.reduce((acc, obj) => {
      acc[obj.name] = obj;
      return acc;
    }, {}))).reduce((acc, obj) => {
      acc[obj.name] = obj
      return acc;
    }, {})
}

export type CurrentScene =
  ["solar-system", SolarSystemState] |
  ["game-over", GameOverState] |
  ["interstellar", InterstellarState]

export interface SavedState {
  systems: { [id: string]: SolarSystemDefinition }
  earthTime: number,
  relativeTime: number,
  currentScene: CurrentScene,
  fuel: number,
  passengers: number,
  integrity: number,
  supplies: number,
}

export interface InterstellarState {
  travelTime: { reference: number; relative: number; },
  origin: SolarSystemDefinition,
  destination: SolarSystemDefinition,
  leavingPosition: Phaser.Math.Vector2
}

export interface GameOverState {
  reason: "fuel" | "integrity"
}

export interface SolarSystemState {
  velocity: Phaser.Math.Vector2;
  position: Phaser.Math.Vector2;
  orientation: number;
  name: string;
}

export type Sun = {
  type: "sun",
  name: string,
  mass: number
}

export type Planet = {
  type: "planet"
  name: string,
  mass: number,
  orbitalRadius: number,
  orbitalSpeedMultiplier: number,
  startAngle: number
}

export type SolarSystemObject = Sun | Planet;

export class SolarSystemDefinition {
  constructor(
    public name: string,
    public position: [number, number],
    public objects: { [id: string]: SolarSystemObject }
  ) { }

  vectorTo(other: SolarSystemDefinition) {
    return new Phaser.Math.Vector2(other.position[0], other.position[1])
      .subtract(new Phaser.Math.Vector2(this.position[0], this.position[1]));
  }

  farthestOrbit() {
    return Object
      .keys(this.objects)
      .map(x => this.objects[x])
      .reduce((max, x) => x.type == "planet" ? Math.max(max, x.orbitalRadius) : max, 0);
  }
}

export const Events = {
  TimePassed: "timePassed",
  LocationChanged: "locationChanged",
  FuelChanged: "fuelChanged",
  HoverHint: "hoverHint",
  IntegrityChanged: "integrityChanged",
  PassengersChanged: "passengersChanged",

  /*** 
   * A scene transition is beginning. 
   * The duration of the transition in ms is passed as an event parameter 
   */
  SceneTransition: "sceneTransition",

  /***
   * Show info. A ObjectInfo is passed as an event parameter.
   */
  ShowInfo: "showInfo",

  /***
   * Update the HUD status text. The new text string is passed as an event parameter
   */
  UpdateStatus: "updateStatus",

  /**
   * Show a warning message to the player. The message is passed as the event parameter
   */
  Warning: "warning"
}

export interface TimePassedEvent {
  earth: number;
  relative: number;
  minutesPerTick: number;
}

export type LocationChangedEvent = string[]

export const StatusMaxValue = 1000000;

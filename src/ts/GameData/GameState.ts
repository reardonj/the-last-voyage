import GameOver from "../Scenes/GameOver";
import SolarSystemNavigation from "../Scenes/SolarSystemNavigation";
import Transition from "../Scenes/Transition";
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
          name: "Ovid",
          initVelocity: new Phaser.Math.Vector2(5, 3),
          initPosition: new Phaser.Math.Vector2(-40, 146)
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

  currentSceneName() {
    switch (this.currentScene[0]) {
      case "solar-system":
        return SolarSystemNavigation.Name;
      case "game-over":
        return GameOver.Name;
      default:
        throw new Error("Current scene is unkown.");
    }
  }

  currentSceneType() {
    switch (this.currentScene[0]) {
      case "solar-system":
        return SolarSystemNavigation;
      case "game-over":
        return GameOver;
      default:
        throw new Error("Current scene is unkown.");
    }
  }

  currentSystem(): SolarSystemDefinition {
    switch (this.currentScene[0]) {
      case "solar-system":
        return this.systems[this.currentScene[1].name];
      case "game-over":
      default:
        throw new Error("Current scene is unknown.");
    }
  }

  updateTime(earth: number, relative: number, minutesPerTick: number) {
    this.earthTime += earth;
    this.relativeTime += relative;
    this.eventSource.emit(Events.TimePassed, { earth: this.earthTime, relative: this.relativeTime, minutesPerTick: minutesPerTick });
    this.useFuel(1 / 24 / 60, relative);
  }

  useFuel(accelerationMagnitude: number, durationMinutes: number) {
    this.fuel = Phaser.Math.Clamp(this.fuel - 0.1 * accelerationMagnitude * durationMinutes, 0, StatusMaxValue);
    this.eventSource.emit(Events.FuelChanged, this.fuel);
  }

  doStateBasedTransitions(currentScene: Phaser.Scene) {
    if (this.currentScene[0] == "game-over") {
      return;
    }

    if (this.fuel == 0) {
      this.currentScene = ["game-over", { reason: "fuel" }]
      this.transition(currentScene);
    }
  }

  transition(currentScene: Phaser.Scene) {
    const newScene = currentScene.scene.add(this.currentSceneName(), this.currentSceneType(), false, this);
    newScene.scene.sendToBack(this.currentSceneName());
    currentScene.scene.transition({
      target: this.currentSceneName(),
      data: this,
      duration: 300,
      remove: true
    });
    this.transitionScene.startTransition(300);
  }

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
  ["game-over", GameOverState];

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

export interface GameOverState {
  reason: "fuel"
}

export interface SolarSystemState {
  initVelocity: Phaser.Math.Vector2;
  initPosition: Phaser.Math.Vector2;
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
}

export const Events = {
  TimePassed: "timePassed",
  LocationChanged: "locationChanged",
  FuelChanged: "fuelChanged",

  /*** 
   * A scene transition is beginning. 
   * The duration of the transition in ms is passed as an event parameter 
   */
  SceneTransition: "sceneTransition",

  /***
   * Show info. A ObjectInfo is passed as an event parameter.
   */
  ShowInfo: "showInfo"
}

export interface TimePassedEvent {
  earth: number;
  relative: number;
  minutesPerTick: number;
}

export type LocationChangedEvent = string[]

export const StatusMaxValue = 1000000;

import AstronomicalMath from "../Logic/AstronomicalMath";
import { YearInMinutes } from "../Logic/Conversions";
import GameOver from "../Scenes/GameOver";
import Interstellar from "../Scenes/Interstellar";
import SolarSystemNavigation from "../Scenes/SolarSystemNavigation";
import Transition from "../Scenes/Transition";
import Utilities from "../Utilities";
import { updateCivilizations } from "./Civilization";
import { Hanger } from "./Hanger";
import { Mission } from "./Mission";
import SavedGames from "./SavedGames";
import Scanner from "./Scanner";
import { Civilization, Planet, SolarSystem, SolarSystemObject } from "./SolarSystemObjects";
import { Worlds } from "./World";

export default class GameState implements SavedState {
  fuel: number;
  passengers: number;
  integrity: number;
  supplies: number;
  earthTime: number;
  relativeTime: number;
  currentScene: CurrentScene;
  ship: MobileObject;
  systems: SolarSystem[];
  shipSystems: ShipSystems;
  worlds: { [id: string]: SolarSystemDefinition; }

  private eventSource: Phaser.Events.EventEmitter;
  nextScene: CurrentScene | null = null;
  shipSystemObjects: ShipSystem[];
  lastSave = 0;

  static newGame(transitionScene: Transition) {
    return new GameState({
      fuel: StatusMaxValue,
      passengers: StatusMaxValue,
      integrity: StatusMaxValue,
      supplies: StatusMaxValue,
      earthTime: 4293394560,
      relativeTime: 0,
      systems: Worlds,
      shipSystems: {},
      ship: {
        velocity: [5, 3],
        orientation: new Phaser.Math.Vector2(5, 3).angle(),
        position: [-40, 146]
      },
      currentScene: ["solar-system", { name: "Ovid" }]
    },
      transitionScene);
  }

  constructor(savedState: SavedState, public transitionScene: Transition) {
    this.eventSource = new Phaser.Events.EventEmitter();

    this.fuel = savedState.fuel;
    this.passengers = savedState.passengers;
    this.integrity = savedState.integrity;
    this.supplies = savedState.supplies;

    this.earthTime = savedState.earthTime;
    this.relativeTime = savedState.relativeTime;
    this.currentScene = savedState.currentScene;
    this.systems = savedState.systems;
    this.ship = savedState.ship;
    this.shipSystems = savedState.shipSystems;
    this.worlds = createSystems(this.systems);

    this.shipSystemObjects = [new Scanner(this), new Hanger(this), new Mission(this)];
  }

  toSavedState(): SavedState {
    return {
      fuel: this.fuel,
      passengers: this.passengers,
      integrity: this.integrity,
      supplies: this.supplies,
      earthTime: this.earthTime,
      relativeTime: this.relativeTime,
      currentScene: this.currentScene,
      systems: this.systems,
      ship: this.ship,
      shipSystems: this.shipSystems
    }
  }

  emit(event: string, params: any) {
    if (event === Events.ShowInfo && params) {
      this.shipSystemObjects.forEach(x => x.transformInfo(params));
    }

    this.eventSource.emit(event, params);
  }

  watch(event: string, handler: Function, ctx: any) {
    this.eventSource.addListener(event, handler, ctx)
  }

  unwatch(event: string, ctx: any) {
    this.eventSource.removeListener(event, undefined, ctx)
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
      case "solar-system": ``
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
        return this.worlds[this.currentScene[1].name];
      case "interstellar":
        return null;
      case "game-over":
        return null;
    }
  }

  isHabitable(planet: Planet): boolean {
    const habitability = this.shipSystemObjects.reduce(
      (acc, s) => sumHabitabilities(acc, s.isHabitable(planet)), <Habitability>{});

    return (habitability.atmosphere &&
      habitability.biosphere &&
      habitability.composition &&
      habitability.gravity &&
      habitability.temperature)
      ?? false;
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
    updateCivilizations(this.systems, this, durationEarthMinutes);

    this.shipTimeStep(durationEarthMinutes, durationRelativeMinutes, thrusterAcceleration, acceleration);
    this.eventSource.emit(Events.TimePassed, { earth: this.earthTime, relative: this.relativeTime, minutesPerTick: durationEarthMinutes });

    this.lastSave += durationEarthMinutes;
    if (this.lastSave > YearInMinutes / 52 && this.currentScene[0] === "solar-system") {
      SavedGames.saveGame(this);
      this.lastSave = 0;
    }
  }

  private shipTimeStep(durationEarthMinutes: number, durationRelativeMinutes: number, thrusterAcceleration: number, acceleration: number) {
    const previousIntegrity = this.integrity;
    this.shipSystemObjects.forEach(x => x.timeStep(durationEarthMinutes, durationRelativeMinutes));

    this.earthTime += durationEarthMinutes;
    this.relativeTime += durationRelativeMinutes;
    this.fuel = clampStatusValue(this.fuel - calculateFuelUsage(thrusterAcceleration, durationEarthMinutes, durationRelativeMinutes));
    this.integrity = clampStatusValue(this.integrity - durationRelativeMinutes / 1000);

    // Accelerating beyond 1g causes damage.
    if (acceleration > 2) {
      this.eventSource.emit(Events.Warning, "Warning: Acceleration is causing hull damage");
      this.integrity = clampStatusValue(this.integrity - Math.max(0, acceleration - 1) * durationRelativeMinutes);
    }

    // If the ship sustains serious damage while having <50% hull integrity, 
    // people will die. The more people aboard, the more likely deaths occur.
    const damage = previousIntegrity - this.integrity;
    if (damage > 100 && this.integrity < 0.5 * StatusMaxValue) {
      const popPercent = this.passengers / StatusMaxValue;
      this.passengers = clampStatusValue(this.passengers - popPercent * Phaser.Math.Between(1, damage));
      this.eventSource.emit(Events.PassengersChanged, this.passengers);
      this.eventSource.emit(Events.Warning, "Warning: Casualties incurred due to hull damage!");
    }

    this.eventSource.emit(Events.IntegrityChanged, this.integrity);
    this.eventSource.emit(Events.FuelChanged, this.fuel);
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
      this.eventSource.emit(Events.Warning, "Error: Cannot travel to destination. Insufficient fuel.");
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
      duration: 400,
      remove: true,
      allowInput: false
    });
    this.transitionScene.startTransition(400);
  }

  useSupplies(amount: number) {
    this.supplies = clampStatusValue(this.supplies - amount);
    this.emit(Events.SuppliesChanged, this.supplies);
  }

  useFuel(amount: number) {
    this.fuel = clampStatusValue(this.fuel - amount);
    this.emit(Events.FuelChanged, this.fuel);
  }

  usePassengers(amount: number) {
    this.passengers = clampStatusValue(this.passengers - amount);
    this.emit(Events.PassengersChanged, this.passengers);
  }

  useIntegrity(amount: number) {
    this.integrity = clampStatusValue(this.integrity - amount);
  }
}

export function calculateFuelUsage(thrusterAcceleration: number, durationEarthMinutes: number, durationRelativeMinutes: number) {
  return (0.01 * thrusterAcceleration * durationEarthMinutes + durationRelativeMinutes / 1000);
}

function clampStatusValue(value: number) {
  return Phaser.Math.Clamp(value, 0, StatusMaxValue);
}

function createSystems(worlds: SolarSystem[]): { [id: string]: SolarSystemDefinition } {
  const toReturn: { [id: string]: SolarSystemDefinition } = {};
  return worlds.map(x => new SolarSystemDefinition(
    x.name,
    <[number, number]>x.position,
    x.objects.reduce((acc, obj) => {
      acc[obj.name] = obj;
      return acc;
    }, <{ [id: string]: SolarSystemObject }>{}))).reduce((acc, obj) => {
      acc[obj.name] = obj
      return acc;
    }, toReturn)
}

export interface MobileObject {
  position: [number, number],
  velocity: [number, number],
  orientation: number
}

export function arrayToPosition(pos: [number, number]): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(pos[0], pos[1]);
}

export type CurrentScene =
  ["solar-system", SolarSystemState] |
  ["game-over", GameOverState] |
  ["interstellar", InterstellarState]

export type ShipSystems = { [id: string]: { [id: string]: any; }; };

export interface SavedState {
  systems: SolarSystem[]
  shipSystems: ShipSystems
  earthTime: number
  relativeTime: number
  currentScene: CurrentScene
  fuel: number
  passengers: number
  integrity: number
  supplies: number
  ship: MobileObject
}

export type ObjectAction = { name: string, hint: string, action: (state: GameState) => void };
export type ObjectDetail = string | [string, () => string] | ObjectAction;

export type ObjectInfo = {
  name: string,
  details: ObjectDetail[]
  definition: SolarSystemObject | SolarSystemDefinition | null,
  onlyUpdate?: boolean
}

export interface InteractiveObject {
  info(): ObjectInfo
  hint(): string
}

export interface ShipSystem extends InteractiveObject {
  name: string
  needsAttention: boolean

  timeStep(durationEarthMinutes: number, durationRelativeMinutes: number): void
  transformInfo(info: ObjectInfo): void
  isHabitable(planet: Planet): Habitability
}

/**
 * A world is habitable if at least one system thinks it is habitable, and no system 
 * thinks it is uninhabitable. If a system has no judgment, it should report undefined.
 */
export type Habitability = {
  gravity?: boolean,
  composition?: boolean,
  atmosphere?: boolean,
  temperature?: boolean,
  biosphere?: boolean,
}

/**
 * Combine two habitability scores.
 * @param a One habitability score
 * @param b Another habitability score
 */
export function sumHabitabilities(a: Habitability, b: Habitability): Habitability {
  return {
    gravity: a.gravity || b.gravity,
    composition: a.composition || b.composition,
    atmosphere: a.atmosphere || b.atmosphere,
    temperature: a.temperature || b.temperature,
    biosphere: a.biosphere || b.biosphere
  }
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
  name: string;
}

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

  planets(): Planet[] {
    return Object
      .keys(this.objects)
      .map(x => this.objects[x])
      .filter<Planet>((x): x is Planet => x.type === "planet")
  }

  solarMass() {
    return Object
      .keys(this.objects)
      .map(x => this.objects[x])
      .reduce((total, x) => x.type == "sun" ? x.mass + total : total, 0);
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
  SuppliesChanged: "suppliesChanged",
  HoverHint: "hoverHint",
  IntegrityChanged: "integrityChanged",
  PassengersChanged: "passengersChanged",

  /*** 
   * A new system has been entered. 
   */
  EnteredSystem: "enteredSystem",

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
  Warning: "warning",

  /**
   * A colony fleet has been launched. The target Planet is passed as the event parameter
   */
  LaunchColonizationFleet: "launchColonyFleet",

  /** A civilization has achieved an interstellar launch. The event parameter is an InterstellarLaunch */
  InterstellarLaunch: "interstellarLaunch",

  /** A modal alert the player must acknowledge to continue. */
  Alert: "alert"
}

export type InterstellarLaunch = {
  system: SolarSystem,
  time: number
}

export interface TimePassedEvent {
  earth: number;
  relative: number;
  minutesPerTick: number;
}

export type LocationChangedEvent = string[]

export const StatusMaxValue = 1000000;

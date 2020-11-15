import { Sprites } from "../Utilities";
import GameState, { Events, ShipSystem, ShipSystems, SolarSystemDefinition } from "./GameState";
import { ObjectInfo } from "./NavigationObjects";
import { Atmosphere, Planet, planetPositionAt, relativeEarthGravity, Temperature } from "./SolarSystemObjects";

export default class Scanner implements ShipSystem {
  public needsAttention: boolean = true;
  public readonly name = "Scanners";
  private systems: ShipSystems;

  constructor(private state: GameState) {
    this.systems = state.shipSystems;
    if (!this.systems["scanner"]) {
      this.systems["scanner"] = { "scanning": null };
    }

    state.watch(Events.SceneTransition, () => this.stopScanning(), this);
  }

  hint() {
    return "Long range telescopes, radar and other sensing instruments" +
      `\nScanning: ${this.systems["scanner"]?.["scanning"] ?? "Nothing"}`
  }

  info(): ObjectInfo {
    return {
      name: this.name,
      description: this.hint(),
      definition: null
    }
  }

  transformInfo(info: ObjectInfo): void {
    if (
      !info.definition ||
      info.definition instanceof SolarSystemDefinition ||
      info.definition.type != "planet"
    ) {
      return;
    }

    const name = info.definition.name;
    const scanState = info.definition.details["scanner"];
    const scanTime = typeof (scanState) === "number" ?
      scanState : 0;
    let scansComplete = 0;

    if (!info.actions) {
      info.actions = [];
    }

    info.description += `\nSurface Gravity: ${relativeEarthGravity(info.definition).toFixed(2)} g`;

    if (scannedAtmosphere(scanTime, info.definition.atmosphere)) {
      info.description += `\nAtmosphere: ${info.definition.atmosphere ?? "None"}`
      scansComplete++;
    }

    if (scannedTemperature(scanTime, info.definition.temperature)) {
      info.description += `\nTemperature: ${info.definition.temperature ?? "Variable Extreme"}`
      scansComplete++;
    }

    if (scannedBiosphere(scanTime, info.definition)) {
      info.description += `\nBiosphere: ${info.definition.biosphere ?? "None"}`
      scansComplete++;
    }

    if (scannedCivilization(scanTime, info.definition)) {
      if (info.definition.civilization) {
        info.description += `\nTechnology: ${info.definition.civilization[0]}`
        info.description += `\nPopulation (est.): ${info.definition.civilization[1].toFixed(0)} mil`
      }
      scansComplete++;
    }

    if (scansComplete < 4) {
      info.actions.push({
        name: "Scan",
        hint: `Target ${info.definition.name} with ship scanners`,
        action: state => {
          this.systems["scanner"]["scanning"] = name;
          this.needsAttention = false;
        }
      });
    } else {
      info.description += "\n(scan complete)"
    }
  }

  timeStep(durationEarthMinutes: number, durationRelativeMinutes: number): void {
    const targetName = this.systems["scanner"]["scanning"];
    const system = this.state.currentSystem()
    if (typeof (targetName) !== "string" || !system) {
      return;
    }

    const target = system.objects[targetName];
    if (!target || target.type != "planet") {
      return;
    }

    // Scanning is faster closer to the target.
    const timeScaling = Math.max(0.5, Math.log10(
      planetPositionAt(target, system.solarMass(), this.state.earthTime + durationEarthMinutes / 2)
        .distance(new Phaser.Math.Vector2(this.state.ship.position[0], this.state.ship.position[1]))));
    const currentTime = target.details["scanner"];
    const nextScanTime = (typeof (currentTime) === "number" ? currentTime : 0)
      + (durationRelativeMinutes / timeScaling);

    target.details["scanner"] = nextScanTime;
    if (
      scannedAtmosphere(nextScanTime, target.atmosphere) &&
      scannedBiosphere(nextScanTime, target) &&
      scannedTemperature(nextScanTime, target.temperature) &&
      scannedCivilization(nextScanTime, target)
    ) {
      this.stopScanning();
    }

  }


  private stopScanning() {
    this.systems["scanner"]["scanning"] = null;
    this.needsAttention = true;
  }



}

function scannedAtmosphere(scanTime: number, atmosphere?: Atmosphere): boolean {
  let time: number;
  if (!atmosphere) {
    time = 60;
  } else {
    switch (atmosphere) {
      case "Breathable":
      case "Corrosive":
      case "Inert":
      case "Thick":
      case "Toxic":
        time = 60 * 24;
        break;
      case "Radioactive Cinders":
        time = 30;
        break;
      case "Thin":
        time = 7 * 60 * 24;
        break;
    }
  }

  return scanTime > time;
}

function scannedTemperature(scanTime: number, temperature?: Temperature): boolean {
  return scanTime > 60 * 24;
}

function scannedBiosphere(scanTime: number, definition: Planet): boolean {
  return scanTime > (definition.civilization ? 60 * 24 * 7 : 60 * 24 * 14);
}

function scannedCivilization(scanTime: number, definition: Planet): boolean {
  let time: number;
  if (!definition.civilization) {
    time = 60 * 24 * 21;
  } else {
    switch (definition.civilization[0]) {
      case "Neolithic":
        time = 60 * 24 * 21;
        break;
      case "Pre-industrial":
        time = 60 * 24 * 14;
        break;
      case "Industrial":
        time = 60 * 24;
        break;
      case "Intrastellar":
      case "Interstellar":
        time = 0;
    }
  }
  return scanTime > time;
}

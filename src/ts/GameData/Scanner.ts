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

import { civDeadTerm, civilizationHint, civilizationInfo, civTypeName } from "./Civilization";
import GameState, { Events, Habitability, ObjectDetail, ObjectInfo, ShipSystem, ShipSystems, SolarSystemDefinition, sumHabitabilities } from "./GameState";
import { Atmosphere, Civilization, orbitalPeriod, Planet, planetInfo, planetPositionAt, relativeEarthGravity, Temperature } from "./SolarSystemObjects";

export default class Scanner implements ShipSystem {
  public needsAttention: boolean = this.isScanTargetAvailable();
  public readonly name = "Scanners";
  private systems: ShipSystems;

  constructor(private state: GameState) {
    this.systems = state.shipSystems;
    if (!this.systems["scanner"]) {
      this.systems["scanner"] = { "scanning": null };
    }

    state.watch(Events.EnteredSystem, () => this.stopScanning(), this);
  }

  hint() {
    return "Long range sensing instruments. They still work better closer to their target." +
      `\nScanning: ${this.systems["scanner"]?.["scanning"] ?? "Nothing"}`
  }

  isHabitable(planet: Planet): Habitability {
    if (!this.isScanComplete(this.scanTime(planet), planet)) {
      return {}
    } else {
      const gravity = relativeEarthGravity(planet);
      return {
        gravity: gravity >= 0.7 && gravity <= 1.2 ? true : undefined,
        composition: planet.composition === "Rocky" ? true : undefined,
        atmosphere: planet.atmosphere === "Breathable" ? true : undefined,
        biosphere: planet.biosphere === "Miscible" ? true : undefined,
        temperature: (planet.temperature === "Temperate"
          || planet.temperature === "Cold"
          || planet.temperature === "Warm")
          ? true : undefined
      }
    }
  }

  info(): ObjectInfo {
    return {
      name: this.name,
      details: [this.hint(), ...this.buildActions()],
      definition: null
    }
  }

  buildActions(): { name: string; hint: string; action: (state: GameState) => void; }[] {
    return this.state.currentSystem()?.planets()
      .map(x => {
        const scanComplete = this.isScanComplete(this.scanTime(x), x);
        const isScanning = this.systems["scanner"]["scanning"] === x.name;
        if (!scanComplete && !isScanning) {
          return this.createScanAction(x);
        } else {
          return {
            name: `View ${x.name}${isScanning ? " (scanning)" : ""}`,
            hint: scanComplete ? "View scan results" : "View scan progress",
            action: () => this.state.emit(Events.ShowInfo, planetInfo(x))
          }
        }
      }) ?? []
  }

  transformInfo(info: ObjectInfo): void {
    const planet = info.definition;
    const system = this.state.currentSystem();
    if (
      !system ||
      !planet ||
      planet instanceof SolarSystemDefinition ||
      planet.type != "planet"
    ) {
      return;
    }

    const scanTime = this.scanTime(planet);
    let scansComplete = 0;
    const newDetails: ObjectDetail[] = [];

    newDetails.push(`Orbital Period: ${Math.abs(orbitalPeriod(planet, system.solarMass()) / 365 / 24 / 60).toFixed(2)} y`)
    newDetails.push(`Surface Gravity: ${relativeEarthGravity(planet).toFixed(2)} g`)

    if (scannedAtmosphere(scanTime, planet.atmosphere)) {
      const atmosphere = planet.atmosphere;
      newDetails.push(`Atmosphere: ${atmosphere ?? "None"}`);
      scansComplete++;
    }

    if (scannedTemperature(scanTime, planet.temperature)) {
      newDetails.push(`Temperature: ${planet.temperature ?? "Variable Extreme"}`);
      scansComplete++;
    }

    if (scannedBiosphere(scanTime, planet)) {
      newDetails.push(`Biosphere: ${planet.biosphere ?? "None"}`);
      scansComplete++;
    }

    if (scannedCivilization(scanTime, planet)) {
      const visibleCivs = (planet.civilizations ?? [])
        .filter((x: Civilization) => x.established <= this.state.earthTime);
      if (visibleCivs.length > 0) {
        newDetails.push("Civilizations & Outputs:");
        for (const civ of visibleCivs) {
          newDetails.push({
            name: `${civ.species} ${civTypeName(civ)}` + (civ.destroyed ? ` (${civDeadTerm(civ)})` : ""),
            hint: civilizationHint(civ),
            action: g => g.emit(Events.ShowInfo, civilizationInfo(civ, planet))
          })
        }
      } else {
        newDetails.push("Civilizations & Outposts: None");
      }
      scansComplete++;
    }

    if (this.systems["scanner"]["scanning"] === planet.name) {
      newDetails.unshift("Scan: In progress");
    } else if (scansComplete == 4) {
      newDetails.unshift(this.showHabitability(planet));
      newDetails.unshift("Scan: Complete");

      if (planet.potentialEvents) {
        newDetails.push("Anomalies:");
        for (const anomaly of planet.potentialEvents) {
          newDetails.push([`  ${anomaly.description}`, () => `Occurs approximately every ${anomaly.yearsBetween} years.`])
        }
      }
    } else {
      newDetails.unshift("Scan: ---");
      newDetails.push(this.createScanAction(planet));
    }

    info.details.push(...newDetails);
  }

  private showHabitability(planet: Planet): (string | [string, () => string]) {
    const habitability = this.state.shipSystemObjects.reduce(
      (acc, s) => sumHabitabilities(acc, s.isHabitable(planet)), <Habitability>{});
    const issues: string[] = [];

    if (!habitability.composition) {
      issues.push("composition");
    }
    if (!habitability.gravity) {
      issues.push("gravity");
    }
    if (!habitability.temperature) {
      issues.push("temperature");
    }
    if (!habitability.atmosphere) {
      issues.push("atmosphere");
    }
    if (!habitability.biosphere) {
      issues.push("biosphere");
    }

    if (issues.length == 0) {
      return "Habitable";
    } else {
      return ["Not Habitable", () => `Uninhabitable because of incompatible: ${issues.join(", ")}`];
    }
  }

  private createScanAction(planet: Planet): { name: string; hint: string; action: (state: GameState) => void; } {
    return {
      name: `Scan ${planet.name}`,
      hint: `Target ${planet.name} with ship scanners`,
      action: state => {
        this.systems["scanner"]["scanning"] = planet.name;
        this.needsAttention = false;
        this.state.emit(Events.ShowInfo, this.info());
      }
    };
  }

  private scanTime(definition: Planet) {
    const scanState = definition.details["scanner"];
    return typeof (scanState) === "number" ?
      scanState : 0;
  }

  timeStep(durationEarthMinutes: number, durationRelativeMinutes: number): void {
    const system = this.state.currentSystem()
    if (!system) {
      this.needsAttention = false;
      return;
    }

    const targetName = this.systems["scanner"]["scanning"];
    if (typeof (targetName) !== "string") {
      return;
    }

    const target = system.objects[targetName];
    if (!target || target.type != "planet") {
      return;
    }
    this.needsAttention = false;

    // Scanning is faster closer to the target.
    const timeScaling = Math.max(0.5, Math.log10(
      planetPositionAt(target, system.solarMass(), this.state.earthTime + durationEarthMinutes / 2)
        .distance(new Phaser.Math.Vector2(this.state.ship.position[0], this.state.ship.position[1]))));
    const currentTime = target.details["scanner"];
    const nextScanTime = (typeof (currentTime) === "number" ? currentTime : 0)
      + (durationRelativeMinutes / timeScaling);

    target.details["scanner"] = nextScanTime;
    if (this.isScanComplete(nextScanTime, target)) {
      this.stopScanning();
      const updateScannerInfo = this.info();
      updateScannerInfo.onlyUpdate = true;
      const updatePlanetInfo = planetInfo(target);
      updatePlanetInfo.onlyUpdate = true;
      target.civilizations?.forEach(x => x.scanned = true);

      this.state.emit(Events.ShowInfo, updateScannerInfo);
      this.state.emit(Events.ShowInfo, updatePlanetInfo);
    }

  }

  private isScanComplete(scanTime: number, target: Planet) {
    return scannedAtmosphere(scanTime, target.atmosphere) &&
      scannedBiosphere(scanTime, target) &&
      scannedTemperature(scanTime, target.temperature) &&
      scannedCivilization(scanTime, target);
  }

  private stopScanning() {
    this.systems["scanner"]["scanning"] = null;
    this.needsAttention = this.isScanTargetAvailable();
  }

  private isScanTargetAvailable(): boolean {
    return this.state.currentSystem()?.planets()
      .map(x => !this.isScanComplete(this.scanTime(x), x))
      .reduce((acc, x) => acc || x, false)
      ?? false;
  }
}

function atmosphereHint(atmosphere?: Atmosphere): string {
  if (!atmosphere) {
    return "This world has no atmosphere.";
  }
  switch (atmosphere) {
    case "Breathable":
      return "Atmosphere has a human breathable oxygen/nitrogen mix.";
    case "Corrosive":
      return "Atmosphere will cause burns and damage organic materials after brief exposure."
    case "Inert":
      return "Atmosphere is safe, but contains insufficient oxygen for human respiration."
    case "Thick":
      return "Atmosphere is safe, but too dense for human respiration."
    case "Toxic":
      return "Atmosphere contains high levels of carcinogens or heavy metals."
    case "Radioactive Cinders":
      return "Atmosphere is laced with dust from radioactive fallout."
    case "Thin":
      return "Atmosphere is breathable, but too thin for human respiration."
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
  return scanTime > (definition.civilizations ? 60 * 24 * 7 : 60 * 24 * 14);
}

function scannedCivilization(scanTime: number, definition: Planet): boolean {
  let time = 60 * 24 * 21;
  if (definition.civilizations) {
    time = definition.civilizations.reduce((min, civ) => {
      switch (civ.technology) {
        case "Neolithic":
          return 60 * 24 * 21;
        case "Pre-industrial":
          return 60 * 24 * 14;
        case "Industrial":
          return 60 * 24;
        case "Intrastellar":
        case "Interstellar":
          return 0;
      }
    }, time);
  }
  return scanTime > time;
}

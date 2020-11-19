import GameState, { Events, ObjectInfo, ShipSystem, ShipSystems, SolarSystemDefinition } from "./GameState";
import { Atmosphere, Planet, planetInfo, planetPositionAt, relativeEarthGravity, Temperature } from "./SolarSystemObjects";

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
    if (
      !info.definition ||
      info.definition instanceof SolarSystemDefinition ||
      info.definition.type != "planet"
    ) {
      return;
    }

    const scanTime = this.scanTime(info.definition);
    let scansComplete = 0;

    info.details.push(`Surface Gravity: ${relativeEarthGravity(info.definition).toFixed(2)} g`)

    if (scannedAtmosphere(scanTime, info.definition.atmosphere)) {
      const atmosphere = info.definition.atmosphere;
      info.details.push([`Atmosphere: ${atmosphere ?? "None"}`, () => atmosphereHint(atmosphere)]);
      scansComplete++;
    }

    if (scannedTemperature(scanTime, info.definition.temperature)) {
      info.details.push(`Temperature: ${info.definition.temperature ?? "Variable Extreme"}`);
      scansComplete++;
    }

    if (scannedBiosphere(scanTime, info.definition)) {
      info.details.push(`Biosphere: ${info.definition.biosphere ?? "None"}`);
      scansComplete++;
    }

    if (scannedCivilization(scanTime, info.definition)) {
      if (info.definition.civilization) {
        info.details.push(
          `Technology: ${info.definition.civilization[0]}`,
          `Population (est.): ${info.definition.civilization[1].toFixed(0)} mil`
        );
      }
      scansComplete++;
    }

    if (this.systems["scanner"]["scanning"] === info.definition.name) {
      info.details.push("(scan in progress)");
    } else if (scansComplete == 4) {
      info.details.push("(scan complete)");
    } else {
      info.details.push("(scan incomplete)");
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
    if (
      this.isScanComplete(nextScanTime, target)
    ) {
      this.stopScanning();
      const updateScannerInfo = this.info();
      updateScannerInfo.onlyUpdate = true;
      const updatePlanetInfo = planetInfo(target);
      updatePlanetInfo.onlyUpdate = true;

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

import { addCivilization } from "./Civilization";
import GameState, { Events, Habitability, ObjectDetail, ObjectInfo, ShipSystem, ShipSystems, SolarSystemDefinition, StatusMaxValue, sumHabitabilities } from "./GameState";
import { Civilization, Planet, planetInfo, planetPositionAt } from "./SolarSystemObjects";

export class Hanger implements ShipSystem {
  name: string = "Fabricators";
  needsAttention: boolean;
  systems: ShipSystems;

  constructor(private state: GameState) {
    this.systems = state.shipSystems;
    if (!this.systems["hanger"]) {
      this.systems["hanger"] = { "building": undefined, "colonization fleet": 0 };
    }
  }

  timeStep(durationEarthMinutes: number, durationRelativeMinutes: number): void {
    let remaining = this.systems["hanger"]["remaining"];
    const building = this.systems["hanger"]["building"];
    if (building === "repair") {
      this.state.useSupplies(durationRelativeMinutes);
      this.state.useIntegrity(-durationRelativeMinutes / 2);
      if (this.state.integrity / StatusMaxValue > 0.95) {
        this.stopBuilding();
      }
    } else if (building && typeof (remaining) === "number") {
      remaining -= durationRelativeMinutes;
      this.state.useSupplies(durationRelativeMinutes);
      if (remaining <= 0) {
        this.state.useFuel(100000);
        this.systems["hanger"][building]++;
        this.stopBuilding();
      } else {
        this.systems["hanger"]["remaining"] = remaining;
      }
    }
  }

  private stopBuilding() {
    this.systems["hanger"]["building"] = undefined;
    this.refreshInfo();
  }

  private refreshInfo() {
    const info = this.info();
    info.onlyUpdate = true;
    this.state.emit(Events.ShowInfo, info);
  }

  transformInfo(info: ObjectInfo): void {
    const system = this.state.currentSystem();
    const planet = info.definition;
    if (
      !system ||
      !planet ||
      planet instanceof SolarSystemDefinition ||
      planet.type != "planet" ||
      !this.state.isHabitable(planet)
    ) {
      return;
    }

    if (this.colonyShips() > 0)
      info.details.push({
        name: "Launch Colonization Fleet",
        hint: `Send 100,000 colonists to ${planet.name}`,
        action: () => this.launchColonyShip(planet)
      });
  }

  launchColonyShip(planet: Planet): void {
    const passengers = Math.min(100000, this.state.passengers);

    if (passengers <= 0) {
      this.state.emit(Events.Warning, "Warning: Cannot launch. No colonists available.");
      return;
    }

    if (!this.systems["hanger"]["colonization fleet"]) {
      this.state.emit(Events.Warning, "Error: No ships available.");
      this.state.emit(Events.ShowInfo, planetInfo(planet))
      return;
    }

    const establishTime = this.state.earthTime + 60 * 24 * 20;
    const planetPosition = planetPositionAt(planet, this.state.currentSystem()!.solarMass(), establishTime);
    const distance = planetPosition.distance(new Phaser.Math.Vector2(this.state.ship.position[0], this.state.ship.position[1]));
    if (distance > 200) {
      this.state.emit(Events.Warning, "Warning: Cannot launch. Destination too far.");
      return;
    }

    this.systems["hanger"]["colonization fleet"]--;
    this.state.usePassengers(passengers);
    const newCiv: Civilization = {
      established: establishTime,
      population: passengers,
      scanned: true,
      species: "human",
      technology: "Interstellar",
      growthRate: 1.02
    };
    addCivilization(planet, newCiv);
    this.state.emit(Events.LaunchColonizationFleet, planet)
    this.state.emit(Events.ShowInfo, null)
  }

  isHabitable(planet: Planet): Habitability {
    return {}
  }

  info(): ObjectInfo {
    return {
      name: this.name,
      definition: null,
      details: this.currentAction(),
    }
  }

  private currentAction(): ObjectDetail[] {
    const state: ObjectDetail[] = [
      `Colonization Fleets: ${this.colonyShips()}`
    ]
    if (this.systems["hanger"]["building"] === "repair") {
      state.push(
        "Performing ship repairs",
        {
          name: "Stop repairs",
          hint: "Free up factory resources for other projects.",
          action: () => this.stopBuilding()
        });
    } else if (this.isBuilding()) {
      state.push([
        `Building: ${this.systems["hanger"]["building"]}`,
        () => `${(this.systems["hanger"]["remaining"] / 24 / 60).toFixed(0)} days remaining`
      ]);
    } else {
      state.push(
        "Idle",
        {
          name: "Repair the Sojourner",
          hint: "Perform repairs on the ship at a rate of 1% hull integrity for 2% of supplies.",
          action: () => this.repairShip()
        },
        {
          name: "Provision Colonization Fleet",
          hint: "Prepare short-range vessels and supplies to colonize a habitable world\n(25% supplies, 10% fuel)",
          action: () => this.provisionColonyShip()
        });
    }

    return state;
  }

  private colonyShips() {
    return this.systems["hanger"]["colonization fleet"];
  }

  private provisionColonyShip(): void {
    const supplies = StatusMaxValue * 0.25;
    if (this.state.supplies < supplies) {
      this.state.emit(Events.Warning, "Insufficient supplies.");
    } else {
      this.systems["hanger"]["building"] = "colonization fleet";
      this.systems["hanger"]["remaining"] = supplies;
      this.refreshInfo();
    }
  }

  private repairShip(): void {
    if (this.state.integrity / StatusMaxValue >= 0.95) {
      this.state.emit(Events.Warning, "Cannot effect further repairs.");
    } else if (this.state.supplies < 0.01 * StatusMaxValue) {
      this.state.emit(Events.Warning, "Insufficient supplies.");
    } else {
      this.systems["hanger"]["building"] = "repair";
      this.refreshInfo();
    }
  }

  private isBuilding() {
    return this.systems["hanger"]["building"];
  }

  hint(): string {
    return "Automatic provisioning and repair facilities. Use to repair the ship or build short-range ships and orbitals."
  }

}

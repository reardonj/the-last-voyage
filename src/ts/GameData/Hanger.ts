import GameState, { Events, Habitability, ObjectDetail, ObjectInfo, ShipSystem, ShipSystems, SolarSystemDefinition, StatusMaxValue, sumHabitabilities } from "./GameState";
import { Planet } from "./SolarSystemObjects";

export class Hanger implements ShipSystem {
  name: string = "Fabricators";
  needsAttention: boolean;
  systems: ShipSystems;

  constructor(private state: GameState) {
    this.systems = state.shipSystems;
    if (!this.systems["hanger"]) {
      this.systems["hanger"] = { "building": undefined, "colony ship": 0 };
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
      `Colony Ships: ${this.systems["hanger"]["colony ship"]}`
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
        `Building ${this.systems["hanger"]["building"]}`,
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
          name: "Provision Colony Ship",
          hint: "Prepare a short-range vessel and supplies to colonize a habitable world (25% supplies)",
          action: () => this.provisionColonyShip()
        });
    }

    return state;
  }

  private provisionColonyShip(): void {
    const supplies = StatusMaxValue * 0.25;
    if (this.state.supplies < supplies) {
      this.state.emit(Events.Warning, "Insufficient supplies.");
    } else {
      this.systems["hanger"]["building"] = "colony ship";
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
    return "Automatic provisioning and repair facilities. Use to ready installations, support ships and repair the ship."
  }

}

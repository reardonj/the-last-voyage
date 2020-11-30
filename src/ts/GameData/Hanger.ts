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

import AstronomicalMath from "../Logic/AstronomicalMath";
import { addCivilization } from "./Civilization";
import GameState, { Events, Habitability, ObjectDetail, ObjectInfo, ShipSystem, ShipSystems, SolarSystemDefinition, StatusMaxValue } from "./GameState";
import { Civilization, Planet, planetInfo, planetPositionAt, withinAsteroidBelt } from "./SolarSystemObjects";

export class Hanger implements ShipSystem {
  name: string = "Fabricators";
  needsAttention: boolean;
  systems: ShipSystems;

  constructor(private state: GameState) {
    this.systems = state.shipSystems;
    if (!this.systems["hanger"]) {
      this.systems["hanger"] = {
        "building": undefined,
        "colonization fleet": 0,
        "research orbital": 0
      };
    }
  }

  timeStep(durationEarthMinutes: number, durationRelativeMinutes: number): void {
    let remaining = this.systems["hanger"]["remaining"];
    const building = this.systems["hanger"]["building"];
    this.needsAttention = building ? false : true;
    if (building === "repair") {
      this.state.useSupplies(durationRelativeMinutes);
      this.state.useIntegrity(-durationRelativeMinutes / 2);
      if (this.state.integrity >= StatusMaxValue - this.state.permanentDamage) {
        this.stopBuilding();
      } else if (this.state.supplies < 0.01 * StatusMaxValue) {
        this.state.emit(Events.Warning, "Insufficient supplies to continue repairs.");
        this.stopBuilding();
      }
    } else if (building === "scavenge") {
      if (this.isInBelt()) {
        this.state.useSupplies(-durationRelativeMinutes * 0.5);
        if (this.state.supplies === StatusMaxValue) {
          this.state.emit(Events.Warning, "Holds full, recalling drones.");
        }
      } else {
        this.state.emit(Events.Warning, "Left belt, recalling drones.");
        this.stopBuilding();
      }
    } else if (building && typeof (remaining) === "number") {
      remaining -= durationRelativeMinutes;
      if (remaining <= 0) {
        this.systems["hanger"][building]++;
        this.stopBuilding();
      } else {
        this.systems["hanger"]["remaining"] = remaining;
      }
    }
  }

  private isInBelt() {
    const distanceFromSun = AstronomicalMath.distance([0, 0], this.state.ship.position);
    const inBelt = (this.state.currentSystem()?.asteroids() ?? [])
      .filter(belt => withinAsteroidBelt(distanceFromSun, belt))
      .length > 0;
    return inBelt;
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
      this.state.emit(Events.Warning, "Error: Cannot launch. No colonists available.");
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
      this.state.emit(Events.Warning, "Error: Cannot launch. Destination too far.");
      return;
    }

    this.systems["hanger"]["colonization fleet"]--;
    this.state.usePassengers(passengers);
    const newCiv: Civilization = {
      type: "colony",
      established: establishTime,
      population: passengers,
      techProgress: 0,
      scanned: true,
      species: "human",
      technology: "Industrial",
      growthRate: 1.02,
      events: []
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
      `Colonization Fleets: ${this.colonyShips()}`,
      `Research Orbitals: ${this.researchOrbitals()}`
    ]
    if (this.systems["hanger"]["building"] === "repair") {
      state.push(
        "Performing ship repairs",
        {
          name: "Stop repairs",
          hint: "Free up factory resources for other projects.",
          action: () => this.stopBuilding()
        });
    } else if (this.systems["hanger"]["building"] === "scavenge") {
      state.push(
        "Processing material from scavenger drones.",
        {
          name: "Stop scavenging operations",
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
          name: "Deploy Scavenger Drones",
          hint: "Deploy drone ships to harvest material from asteroids or derelicts.",
          action: () => this.startScavenging()
        },
        {
          name: "Provision Colonization Fleet",
          hint: "Prepare short-range vessels and supplies to colonize a habitable world\n(25% supplies, 10% fuel)",
          action: () => this.provision("colonization fleet", 0.25, 0.1, 0)
        },
        {
          name: "Provision Research Orbital",
          hint: "Cannibalize ship components to construct an advanced orbital research installation & habitat. Researchers can potentially solve habitability issues on a marginal planet.\n(5% supplies, 15% max integrity, 10% fuel)",
          action: () => this.provision("research orbital", 0.05, 0.1, 0.15)
        });
    }

    return state;
  }

  private colonyShips() {
    return this.systems["hanger"]["colonization fleet"];
  }

  private researchOrbitals() {
    return this.systems["hanger"]["research orbital"];
  }

  private provision(project: string, supplies: number, fuel: number, maxIntegrity: number) {
    if (this.state.supplies / StatusMaxValue < supplies) {
      this.state.emit(Events.Warning, "Error: Insufficient supplies.");
    } else if (this.state.fuel / StatusMaxValue < fuel) {
      this.state.emit(Events.Warning, "Error: Insufficient fuel.");
    } else if (1 - this.state.permanentDamage / StatusMaxValue < maxIntegrity) {
      this.state.emit(Events.Warning, "Error: Insufficient components.");
    } else {
      this.state.useSupplies(supplies * StatusMaxValue);
      this.state.useFuel(fuel * StatusMaxValue);
      this.state.permanentDamage += maxIntegrity * StatusMaxValue;
      this.systems["hanger"]["building"] = project;
      this.systems["hanger"]["remaining"] = (supplies + maxIntegrity) * StatusMaxValue;
      this.refreshInfo();
    }
  }

  private repairShip(): void {
    if (this.state.integrity >= StatusMaxValue - this.state.permanentDamage) {
      this.state.emit(Events.Warning, "Cannot effect further repairs.");
    } else if (this.state.supplies < 0.01 * StatusMaxValue) {
      this.state.emit(Events.Warning, "Insufficient supplies.");
    } else {
      this.systems["hanger"]["building"] = "repair";
      this.refreshInfo();
    }
  }

  private startScavenging(): void {
    if (this.isInBelt()) {
      this.systems["hanger"]["building"] = "scavenge";
      this.refreshInfo();
    } else {
      this.state.emit(Events.Warning, "Nothing nearby to scavenge");
    }
  }

  private isBuilding() {
    return this.systems["hanger"]["building"];
  }

  hint(): string {
    const currentAction = this.currentAction()[2];
    let currentActionHint: string;
    if (typeof (currentAction) === "string") {
      currentActionHint = currentAction;
    } else if (Array.isArray(currentAction)) {
      currentActionHint = currentAction[1]();
    } else {
      currentActionHint = currentAction.hint;
    }
    return "Automatic provisioning and repair facilities. Use to repair the ship or build short-range ships and orbitals." +
      `\nCurrent Operation: ${currentActionHint}`
  }

}

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
import { StartTime, YearInMinutes } from "../Logic/Conversions";
import { AudioManager } from "./AudioManager";
import GameState, { Alert, Events, Habitability, InterstellarLaunch, ObjectInfo, ShipSystem } from "./GameState";
import { Planet, SolarSystem } from "./SolarSystemObjects";

export class Mission implements ShipSystem {
  name: string = "Mission";
  needsAttention: boolean;
  missionState: MissionState;
  playerWarnedAboutResigning: boolean = false;

  constructor(private state: GameState) {
    state.watch(Events.InterstellarLaunch, this.handleLaunchDetected, this);
    state.watch(Events.EnteredSystem, this.handleEnterSystem, this);

    if (!state.shipSystems["mission"]) {
      this.missionState = { launches: {}, systems: {} }
      state.shipSystems["mission"] = this.missionState;
    } else {
      this.missionState = <MissionState>state.shipSystems["mission"];
    }

    const currentSystem = state.currentSystem();
    if (currentSystem) {
      this.missionState.systems[currentSystem.name] = state.earthTime;
    }
  }

  timeStep(durationEarthMinutes: number, durationRelativeMinutes: number): void {
    // Only check while in-system
    const system = this.state.currentSystem()
    if (this.state.currentScene[0] !== 'solar-system' || system === null) {
      return;
    }

    // Only check while inside the system proper
    const sunDist = AstronomicalMath.distance(this.state.ship.position, [0, 0]);
    if (sunDist > 4000) {
      return;
    }

    const currentYear = this.state.earthTime / YearInMinutes;
    for (const launch of Object.keys(this.missionState.launches).map(x => this.missionState.launches[x])) {
      const distance = AstronomicalMath.distance(launch.system.position, system.position);
      const yearsPast = currentYear - launch.time;
      if (yearsPast > distance * 2) {
        let alertText: string[];
        if (launch.system.name === system.name) {
          alertText = [
            `Sojourner, this is ${launch.system.name} Fleet Command. We're glad you made it back. ` +
            "Your mission is accomplished. We've replicated the Sojourner's technology and begun " +
            "launching our own voyagers. Never again will humanity be bound to a single star.",
            " ",
            "Make for planetary orbit and we can take you in for refit."
          ]
        } else {
          alertText = [
            `Sojourner, this is the ISV Herald. We've been looking for you. On behalf of ${launch.system.name} ` +
            "Fleet Command, I'd like to extend our congratulations. We've replicated the Sojourner's " +
            "technology and begun launching our own voyagers. Your mission is accomplished. Never again " +
            "will humanity be bound to a single star.",
            " ",
            `If you return, Fleet Command can take you for a refit, but if you're still in good condition, we'd be honoured to have you accompany us to the next star.`
          ]
        }
        const alert: Alert = {
          title: "Incoming Transmission",
          text: alertText,
          action: {
            name: "Continue",
            hint: "",
            action: () => this.state.transitionTo(["game-over", { reason: "victory", time: this.state.earthTime }])
          }
        }
        this.state.emit(Events.Alert, alert);
        AudioManager()?.changeBackground("victory")
      }
    }

  }

  transformInfo(info: ObjectInfo): void {
  }

  isHabitable(planet: Planet): Habitability {
    return {};
  }

  info(): ObjectInfo {
    this.playerWarnedAboutResigning = false;
    const colonies = this.state.systems.reduce(
      (s, sx) => s + sx.objects.reduce(
        (o, ox) => o + (ox.type === "planet" ?
          (ox.civilizations?.filter(c => c.type === "colony" && c.established > StartTime).length ?? 0) :
          0),
        0),
      0);
    const orbitals = this.state.systems.reduce(
      (s, sx) => s + sx.objects.reduce(
        (o, ox) => o + (ox.type === "planet" ?
          (ox.civilizations?.filter(c => c.type === "orbital" && c.established > StartTime).length ?? 0) :
          0),
        0),
      0);
    return {
      name: "Mission Status",
      definition: null,
      position: null,
      details: [
        `Systems Visited: ${Object.keys(this.missionState.systems).length}`,
        `Colonies Founded: ${colonies}`,
        `Orbitals Deployed: ${orbitals}`,
        {
          name: "Resign",
          hint: "Put the ship in stable orbit, shut down all non-essential systems, and leave Sojourner in the hands of fate.",
          action: () => this.resign()
        }
      ]
    }
  }

  hint(): string {
    return "Show mission status"
  }

  private resign() {
    if (this.state.currentScene[0] !== "solar-system") {
      this.state.emit(Events.Warning, "Error: You must enter a star system before resigning.");
    } else if (!this.playerWarnedAboutResigning) {
      this.state.emit(Events.Warning, "Warning: This will end the game. Press the command again to confirm your resignation.")
      this.playerWarnedAboutResigning = true;
    } else {
      this.state.transitionTo(["game-over", { reason: "resign", time: this.state.earthTime }])
    }
  }

  private handleLaunchDetected(launch: InterstellarLaunch) {
    if (!this.missionState.launches[launch.system.name]) {
      this.missionState.launches[launch.system.name] = { time: launch.time / YearInMinutes, system: launch.system };

    }
  }

  handleEnterSystem(name: string) {
    this.missionState.systems[name] = this.state.earthTime;
  }
}

type MissionState = {
  launches: { [id: string]: { time: number, system: SolarSystem } }
  systems: { [id: string]: number }
}

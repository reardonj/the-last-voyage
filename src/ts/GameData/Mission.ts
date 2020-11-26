import AstronomicalMath from "../Logic/AstronomicalMath";
import { YearInMinutes } from "../Logic/Conversions";
import GameState, { Events, Habitability, InterstellarLaunch, ObjectInfo, ShipSystem } from "./GameState";
import { Planet, SolarSystem } from "./SolarSystemObjects";

export class Mission implements ShipSystem {
  name: string = "Mission";
  needsAttention: boolean;
  missionState: MissionState;

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
    if (sunDist > 5000) {
      return;
    }

    const currentYear = this.state.earthTime / YearInMinutes;
    for (const launch of Object.keys(this.missionState.launches).map(x => this.missionState.launches[x])) {
      const distance = AstronomicalMath.distance(launch.system.position, system.position);
      const yearsPast = currentYear - launch.time;
      if (yearsPast > distance * 2) {
        this.state.emit(Events.Alert, {});
      }
    }

  }

  transformInfo(info: ObjectInfo): void {
  }

  isHabitable(planet: Planet): Habitability {
    return {};
  }

  info(): ObjectInfo {
    const colonies = this.state.systems.reduce((s, sx) => {
      return s + sx.objects.reduce((o, ox) => o + (ox.type === "planet" ? (ox.civilizations?.length ?? 0) : 0), 0);
    }, 0);
    return {
      name: "Mission Status",
      definition: null,
      details: [
        `Systems Visited: ${Object.keys(this.missionState.systems).length}`,
        `Colonies Founded: ${colonies}`
      ]
    }
  }

  hint(): string {
    return "Show mission status"
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

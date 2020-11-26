import AstronomicalMath from "../Logic/AstronomicalMath";
import { YearInMinutes } from "../Logic/Conversions";
import GameState, { Alert, Events, Habitability, InterstellarLaunch, ObjectInfo, ShipSystem } from "./GameState";
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
            action: () => this.state.transitionTo(["game-over", { reason: "victory" }])
          }
        }
        this.state.emit(Events.Alert, alert);
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

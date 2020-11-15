import { Sprites } from "../Utilities";
import GameState, { Events, ShipSystem, ShipSystems, SolarSystemDefinition } from "./GameState";
import { ObjectInfo } from "./NavigationObjects";

export default class Scanner implements ShipSystem {
  public isActive: boolean = false;
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

    if (!info.actions) {
      info.actions = [];
    }

    info.actions.push({
      name: "Scan",
      hint: `Target ${info.definition.name} with ship scanners`,
      action: state => {
        this.systems["scanner"]["scanning"] = name;
        this.isActive = true;
      }
    })
  }

  private stopScanning() {
    this.systems["scanner"]["scanning"] = null;
    this.isActive = false;
  }

}

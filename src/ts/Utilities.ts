import GameState, { Events } from "./GameData/GameState";
import { YearInMinutes } from "./Logic/Conversions";

export default class Utilities {
  /**
   * Logs a particular message to the console.
   * @param message Message to log.
   */
  public static Log(message: string): void {
    console.log((new Date()).toISOString() + " : " + message);
  }

  public static exponentialProbability(duration: number, mean: number) {
    return Phaser.Math.FloatBetween(0, 1) < 1 - Math.exp(-duration / mean);
  }
}

export class UI {
  public static makeInteractive(obj: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Tint) {
    obj.setInteractive({ useHandCursor: true });
    obj.setTint(Colours.SelectableTint);
    obj.on("pointerover", () => obj.setTint(Colours.Highlight), this);
    obj.on("pointerout", () => obj.setTint(Colours.SelectableTint), this);
  }

  public static showHoverHint(obj: Phaser.GameObjects.GameObject, emitter: GameState, hint: () => string) {
    obj.setInteractive();
    obj.on("pointerover", () => emitter.emit(Events.HoverHint, hint()), this);
    obj.on("pointerout", () => emitter.emit(Events.HoverHint, null), this);
  }

  public static centre(
    left: number,
    right: number,
    obj: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & { width: number }
  ) {
    obj.setX((left + right) / 2 - obj.width / 2);
    return obj;
  }

  public static createTimeString(time: number, minutesPerTick: number, offset: number): string {
    const years = Math.floor(time / YearInMinutes);
    time = time % YearInMinutes;
    const weeks = offset + Math.floor(time / 10080);
    time = time % 10080;
    const days = offset + Math.floor(time / 1440);
    time = time % 1440;
    const hours = pad(time / 60, 2);
    const minutes = time % 60;

    if (minutesPerTick < 1) {
      return `${pad(years, 4)}-${pad(weeks, 2)}-${days.toFixed(0)} ${hours}:${pad(minutes, 2)}`;
    } else {
      return `${pad(years, 4)}-${pad(weeks, 2)}-${days.toFixed(0)}`;
    }
  }
}

function pad(num: number, length: number) {
  return Math.floor(num).toFixed(0).padStart(length, "0");
}

export const Fonts = {
  Proportional16: "future-thin-16",
  Proportional24: "future-thin-24",
  Proportional48: "future-outline-48"
}

export const Colours = {
  TextTint: 0xddddff,
  Highlight: 0xa0cfa0,
  PanelBackground: 0x292933,
  SelectableTint: 0xccffcc,
  WarningTint: 0xff5555,
  AllyTint: 0xccccff,
  EnemyTint: 0xffcccc,
  NeutralTint: 0xeeeeff
}

export const Sprites = {
  Civilization: "civilization",
  Dot: "dot",
  Planet: "planet",
  Ship: "ship",
  Sun: "sun",
  ShortGradient: "shortGradient",
}

export const Resources = {
  ShipName: "The Sojourner",
  Hud: {
    Fuel: "Fuel",
    Integrity: "Integrity",
    MissionDuration: "Mission Time",
    Passengers: "Passengers",
    Supplies: "Supplies",
    AbsoluteDuration: "Earth",
    RelativeDuration: "Relative"
  },
  GameOver: {
    Fuel: "The ship's reactor shuts down as it consumes your last grams of fuel, leaving the Sojourner adrift in space.",
    Integrity: "The Sojourner has sustained catastrophic damage, causing the ship to break up and scatter debris across the system.",
    Victory: "Humanity has re-established a viable civilization, and launched new ships into the stars. Your voyage is complete."
  }
}

export const SystemNames: string[] = [
  "beta-Sol",
  "Celestia",
  "Avalon",
  "Oasis",
  "Haven",
  "Sanctuary",
  "Hope"
]


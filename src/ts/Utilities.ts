import GameState, { Events } from "./GameData/GameState";

export default class Utilities {
  /**
   * Logs a particular message to the console.
   * @param message Message to log.
   */
  public static Log(message: string): void {
    console.log((new Date()).toISOString() + " : " + message);
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
}

export const Fonts = {
  Proportional16: "future-thin-16",
  Proportional24: "future-thin-24"
}

export const Colours = {
  TextTint: 0xccccff,
  Highlight: 0xa0cfa0,
  PanelBackground: 0x292933,
  SelectableTint: 0xccffcc,
  WarningTint: 0xffbbbb
}

export const Sprites = {
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
    Integrity: "The Sojourner has sustained catastrophic damage, causing the ship to break up and scatter debris across the system."
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


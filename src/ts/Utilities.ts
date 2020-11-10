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
    obj.on("pointerover", () => obj.setTint(Colours.Highlight), this);
    obj.on("pointerout", () => obj.setTint(Colours.TextTint), this);
  }

  public static centre(
    left: number,
    right: number,
    obj: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & { width: number }) {
    obj.setX((left + right) / 2 - obj.width / 2);
  }
}

export const Fonts = {
  Proportional16: "future-thin-16",
  Proportional24: "future-thin-24"
}

export const Colours = {
  TextTint: 0xccccff,
  Highlight: 0xe0e0ff,
  PanelBackground: 0x292933
}

export const Sprites = {
  Planet: "planet",
  Ship: "ship",
  ShortGradient: "shortGradient",
  SolidBackground: "solidBackground"
}

export const Resources = {
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
    Fuel: "The ship's reactor shuts down as it consumes the last grams of fuel,\nleaving the Pilgrim adrift in space."
  }
}

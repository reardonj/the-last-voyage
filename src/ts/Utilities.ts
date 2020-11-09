export default class Utilities {
  /**
   * Logs a particular message to the console.
   * @param message Message to log.
   */
  public static Log(message: string): void {
    console.log((new Date()).toISOString() + " : " + message);
  }
}

export const Fonts = {
  Proportional16: "future-thin-16",
  Proportional24: "future-thin-24"
}

export const Colours = {
  TextTint: 0xccccff
}

export const Sprites = {
  Planet: "planet",
  Ship: "ship"
}

export const Resources = {
  Hud: {
    Fuel: "Fuel",
    Integrity: "Integrity",
    MissionDuration: "Mission Duration",
    Passengers: "Passengers",
    Supplies: "Supplies",
    AbsoluteDuration: "Earth",
    RelativeDuration: "Relative"
  },
  GameOver: {
    Fuel: "The ship's reactor shuts down as its last grams of fuel are consumed,\nleaving the Pilgrim adrift in space."
  }
}

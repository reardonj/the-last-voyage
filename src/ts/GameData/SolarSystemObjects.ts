export type SolarSystemObject = Sun | Planet;

export type Sun = {
  type: "sun",
  name: string,
  mass: number
}

export type Planet = {
  type: "planet"
  name: string,
  mass: number,
  orbitalRadius: number,
  orbitalSpeedMultiplier: number,
  startAngle: number
}

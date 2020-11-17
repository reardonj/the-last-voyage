import AstronomicalMath from "../Logic/AstronomicalMath";
import { ObjectInfo } from "./GameState";

export type SolarSystem = { name: string, position: number[], objects: SolarSystemObject[] }

export type SolarSystemObject = Sun | Planet;

export type Sun = {
  type: "sun",
  name: string,
  mass: number,
  details: { [id: string]: any }
}

export type Planet = {
  type: "planet"
  name: string,
  mass: number,
  orbitalRadius: number,
  equatorialRadius: number, // In multiples of Earth's radius
  orbitalSpeedMultiplier: number,
  startAngle: number,
  composition: Composition,
  atmosphere?: Atmosphere,
  temperature?: Temperature,
  biosphere?: Biosphere,

  /** Technology level and population (millions) */
  civilization?: [IntelligenceSigns, number]
  details: { [id: string]: any }
}

export function relativeEarthGravity(planet: Planet) {
  return (planet.mass / 59.72) / (planet.equatorialRadius * planet.equatorialRadius);
}

export function planetPositionAt(planet: Planet, sunMass: number, earthMinutes: number): Phaser.Math.Vector2 {
  const orbitalPeriod =
    planet.orbitalSpeedMultiplier *
    24 * 60 * AstronomicalMath.orbitalPeriod(planet.orbitalRadius, sunMass);

  return new Phaser.Math.Vector2().setToPolar(
    planet.startAngle + 2 * Math.PI * (earthMinutes / orbitalPeriod),
    planet.orbitalRadius);
}

export function planetInfo(planet: Planet): ObjectInfo {
  const description = planet["description"] ? planet["description"] + "\n" : "";
  return {
    name: planet.name,
    description: description + `Composition: ${planet.composition}`,
    definition: planet
  }
}

export type Composition =
  "Ice/Water" |
  "Rocky" |
  "Gas Giant"

export type Atmosphere =
  "Thin" |
  "Corrosive" |
  "Breathable" |
  "Inert" |
  "Thick" |
  "Toxic" |
  "Radioactive Cinders"

export type Temperature =
  "Frozen" |
  "Cold" |
  "Temperate" |
  "Warm" |
  "Burning" |
  "Molten" |
  "Variable Extreme"

export type Biosphere =
  "Remnant" |
  "Microbial" |
  "Miscible" |
  "Immiscible"

export type IntelligenceSigns =
  "Neolithic" |
  "Pre-industrial" |
  "Industrial" |
  "Intrastellar" |
  "Interstellar"

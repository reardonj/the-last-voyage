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
  description?: string,
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
  civilizations?: [Civilization]
  details: { [id: string]: any }
}

export type Civilization = {
  technology: TechLevel
  population: number
  species: string
  /** The time, in earth minutes from launch, when the civilization began, or 0 for pre-existing ones. */
  established: number
  scanned: boolean
}

export function civilizationHint(civ: Civilization): string {
  const popDecimals = civ.population < 1000000 ? 2 : 0;
  return `${civ.technology}, ${civ.species}, population approx. ${(civ.population / 1000000).toFixed(popDecimals)} million`
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
  const details: string[] = [];
  if (planet.description) {
    details.push(planet.description);
  }

  details.push(`Composition: ${planet.composition}`)

  return {
    name: planet.name,
    details: details,
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

export type TechLevel =
  "Neolithic" |
  "Pre-industrial" |
  "Industrial" |
  "Intrastellar" |
  "Interstellar"

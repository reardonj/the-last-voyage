/* 
Copyright 2020, Justin Reardon. 

This file is part of The Last Voyage.

The Last Voyage is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The Last Voyage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with The Last Voyage.  If not, see <https://www.gnu.org/licenses/>.
*/

import AstronomicalMath from "../Logic/AstronomicalMath";
import { ObjectInfo } from "./GameState";

export type SolarSystem = {
  name: string,
  position: [number, number],
  objects: SolarSystemObject[],
}

export type SolarSystemObject = Sun | Planet | AsteroidBelt;

export type Sun = {
  type: "sun",
  name: string,
  mass: number,
  details: { [id: string]: any }
}

export type AsteroidBelt = {
  type: "asteroids",
  name: string,
  orbitalRadius: number,
  radius: number
}

export function withinAsteroidBelt(distanceFromSun: number, belt: AsteroidBelt) {
  return Math.abs(distanceFromSun - belt.orbitalRadius) < belt.radius;
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

export function isPlanet(obj: SolarSystemObject): obj is Planet {
  return obj.type === "planet"
}

export type Civilization = {
  type: "colony" | "orbital"
  technology: TechLevel
  techProgress: number
  population: number
  species: string
  /** The time, in earth minutes from launch, when the civilization began, or 0 for pre-existing ones. */
  established: number
  scanned: boolean
  maxPopulation?: number
  /** Population growth rate in percent/year */
  growthRate: number
  events: CivilizationEvent[]
  destroyed?: { time: number, cause: string }
}

export type CivilizationEvent = {
  ends: number
  growthRateEffect: number
  immediatePopulationEffect: number
  immediateTechEffect: number
  description: string
}


export function relativeEarthGravity(planet: Planet) {
  return (planet.mass / 59.72) / (planet.equatorialRadius * planet.equatorialRadius);
}

export function planetPositionAt(planet: Planet, sunMass: number, earthMinutes: number): Phaser.Math.Vector2 {
  const period = orbitalPeriod(planet, sunMass);

  return new Phaser.Math.Vector2().setToPolar(
    planet.startAngle + 2 * Math.PI * (earthMinutes / period),
    planet.orbitalRadius);
}

export function orbitalPeriod(planet: Planet, sunMass: number) {
  return planet.orbitalSpeedMultiplier *
    24 * 60 * AstronomicalMath.orbitalPeriod(planet.orbitalRadius, sunMass);
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

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

import { YearInMinutes } from "../Logic/Conversions";
import Utilities, { UI } from "../Utilities";
import GameState, { Events, ObjectInfo, SolarSystemDefinition } from "./GameState";
import { Civilization, CivilizationEvent, isPlanet, Planet, planetInfo, planetPositionAt, SolarSystem, TechLevel } from "./SolarSystemObjects";


export function civilizationInfo(civ: Civilization, planet: Planet): ObjectInfo {
  if (civ.destroyed) {
    return {
      name: `Dead ${civ.species} civilization on ${planet.name}`,
      definition: null,
      details: [
        { name: planet.name, hint: "Return to planet information.", action: g => g.emit(Events.ShowInfo, planetInfo(planet)) },
        `Established: ${civ.established > 0 ? UI.createTimeString(civ.established, 1, 1) : 'Pre-Mission'}`,
        `Destroyed: ${UI.createTimeString(civ.destroyed.time, 1, 1)}`,
        `Cause: ${civ.destroyed.cause}`,
        `Tech level: ${civ.technology}`
      ]
    }

  }
  return {
    name: `${civ.species} civilization on ${planet.name}`,
    definition: null,
    details: [
      { name: planet.name, hint: "Return to planet information.", action: g => g.emit(Events.ShowInfo, planetInfo(planet)) },
      `Established: ${civ.established > 0 ? UI.createTimeString(civ.established, 1, 1) : 'Pre-Mission'}`,
      `Tech level: ${civ.technology}`,
      [`Population: ${showPop(civ.population)}`, () => populationHint(civ)]
    ]
  }
}

function populationHint(civ: Civilization) {
  const growth = effectiveYearlyGrowthRate(civ);
  if (growth > 1) {
    return "Population growing."
  } else if (growth < 1) {
    return "Population declining."
  } else {
    return "Population stable."
  }
}

export function civilizationHint(civ: Civilization): string {
  if (civ.destroyed) {
    return `dead ${civ.species} civilization`
  }
  return `${civ.technology}, ${civ.species}, population approx. ${showPop(civ.population)}`
}

export function addCivilization(planet: Planet, civ: Civilization): void {
  if (planet.civilizations) {
    planet.civilizations.push(civ);
  } else {
    planet.civilizations = [civ];
  }
}

function showPop(population: number) {
  const popDecimals = population < 1000000 ? 2 : 0;
  return `${(population / 1000000).toFixed(popDecimals)} million`
}

function maxTech(level1: TechLevel, level2: TechLevel): TechLevel {
  if (level1 === "Intrastellar" || level2 === "Intrastellar") {
    return "Intrastellar";
  }
  if (level1 === "Interstellar" || level2 === "Interstellar") {
    return "Interstellar";
  }
  if (level1 === "Industrial" || level2 === "Industrial") {
    return "Industrial";
  }
  if (level1 === "Pre-industrial" || level2 === "Pre-industrial") {
    return "Pre-industrial";
  }
  return "Neolithic";
}

function civilizationsAreRelated(civ1: Civilization, civ2: Civilization): boolean {
  return civ1.species === civ2.species;
}

export function updateCivilizations(systems: SolarSystem[], state: GameState, timePassed: number): void {
  systems.forEach(system => {
    updateSystem(system, state, timePassed);
  });
}

function updateSystem(system: SolarSystem, state: GameState, timePassed: number): void {
  const systemEvents = getEvents(state.earthTime, timePassed, stellarEvents);
  for (const planet of system.objects.filter<Planet>(isPlanet)) {
    const civs = planet.civilizations;
    if (!civs) {
      continue;
    }

    if (civs.length > 1) {
      mergeCivilizations(civs, state.earthTime);
    }

    for (const civ of civs) {
      civ.events.push(...systemEvents);
      updateCivilization(system, civ, state, timePassed);
    }
  }
}


function mergeCivilizations(civs: [Civilization], time: number) {
  for (let i = civs.length - 1; i > 0; i--) {
    if (civs[i].established > time) {
      continue;
    }

    const relatedCiv = civs.slice(0, i).find(x => civilizationsAreRelated(x, civs[i]));
    if (relatedCiv) {
      relatedCiv.population += civs[i].population;
      relatedCiv.growthRate = Phaser.Math.Average([relatedCiv.growthRate, civs[i].growthRate]);
      relatedCiv.technology = maxTech(civs[i].technology, relatedCiv.technology);
      relatedCiv.destroyed = undefined;
      civs.splice(i, 1);
    }
  }
}

function updateCivilization(system: SolarSystem, civ: Civilization, state: GameState, timePassed: number): void {
  if (civ.established > state.earthTime) {
    return;
  }

  if (civ.destroyed) {
    return;
  }

  const newEvents = getEvents(state.earthTime, timePassed, planetaryEvents);

  // Apply immediate effects
  for (const event of newEvents) {
    civ.population += event.immediatePopulationEffect;
    civ.techProgress += event.immediateTechEffect;
    civ.events.push(event);
  }

  // Update tech
  updateTech(civ, state, system);

  // Do population growth
  const yearlyGrowthRate = effectiveYearlyGrowthRate(civ);
  let growthRate = Math.pow(yearlyGrowthRate, timePassed / 60 / 24 / 365);

  // The population will only begin growing after a year
  if (civ.established + YearInMinutes > state.earthTime) {
    growthRate = Math.min(1, growthRate);
  }
  civ.population = Math.max(0, civ.population * growthRate);
  if (civ.population <= 1) {
    civ.destroyed = { time: state.earthTime, cause: worstEvent(civ.events).description }
  }

  // Remove expired events
  civ.events = civ.events.filter(x => x.ends < state.earthTime);
}

function worstEvent(events: CivilizationEvent[]): CivilizationEvent {
  return events.reduce((worst, x) => {
    if (x.immediatePopulationEffect < worst.immediatePopulationEffect) {
      return x;
    }
    if (x.growthRateEffect < worst.growthRateEffect) {
      return x;
    }
    return worst;
  },
    { description: "no specific cause", ends: 0, growthRateEffect: 0, immediatePopulationEffect: 0, immediateTechEffect: 0 })
}

function updateTech(civ: Civilization, state: GameState, system: SolarSystem) {
  if (civ.techProgress >= 5) {
    civ.techProgress -= 5;
    if (civ.technology === "Neolithic") {
      civ.technology = "Pre-industrial";
    } else if (civ.technology === "Pre-industrial") {
      civ.technology = "Industrial";
    }
    else if (civ.technology === "Industrial") {
      civ.technology = "Intrastellar";
    }
    else if (civ.technology === "Intrastellar") {
      civ.technology = "Interstellar";
    } else {
      state.emit(Events.InterstellarLaunch, { system: system, time: state.earthTime });
    }
  } else if (civ.techProgress <= -10) {
    civ.techProgress += 10;
    if (civ.technology === "Pre-industrial") {
      civ.technology = "Neolithic";
    }
    else if (civ.technology === "Industrial") {
      civ.technology = "Pre-industrial";
    }
    else if (civ.technology === "Intrastellar") {
      civ.technology = "Industrial";
    }
    else if (civ.technology === "Interstellar") {
      civ.technology = "Intrastellar";
    }
  }
}

function effectiveYearlyGrowthRate(civ: Civilization) {
  return civ.events.reduce((sum, x) => sum + x.growthRateEffect, civ.growthRate);
}

function getEvents(time: number, durationMinutes: number, potentialEvents: PotentialEvent[]): CivilizationEvent[] {
  const actualEvents: CivilizationEvent[] = [];
  const durationYears = durationMinutes / YearInMinutes;

  for (const event of potentialEvents) {
    if (Utilities.exponentialProbability(durationYears, event.yearsBetween)) {
      actualEvents.push({
        description: Phaser.Math.RND.pick(event.description),
        ends: time + YearInMinutes * Phaser.Math.FloatBetween(event.duration[0], event.duration[1]),
        growthRateEffect: event.growthRateEffect ?? 0,
        immediatePopulationEffect: event.immediatePopulationEffect ?? 0,
        immediateTechEffect: event.immediateTechEffect ?? 0
      })
    }
  }

  return actualEvents;
}

type PotentialEvent = {
  description: string[]
  yearsBetween: number
  duration: [number, number]
  growthRateEffect?: number
  immediatePopulationEffect?: number
  immediateTechEffect?: number
}

const stellarEvents: PotentialEvent[] = [
  {
    description: ["Solar flare bursts"],
    yearsBetween: 100,
    duration: [0.2, 1],
    immediatePopulationEffect: -100,
    immediateTechEffect: -1
  }
]

const planetaryEvents: PotentialEvent[] = [
  {
    description: ["baby boom"],
    yearsBetween: 30,
    duration: [1, 5],
    growthRateEffect: 0.3,
  },
  {
    description: ["fire", "flood", "famine"],
    yearsBetween: 5,
    duration: [0.05, 0.1],
    growthRateEffect: -0.1,
    immediatePopulationEffect: -2000,
    immediateTechEffect: -0.05
  },
  {
    description: ["hurricane"],
    yearsBetween: 10,
    duration: [0.05, 0.1],
    growthRateEffect: -0.01,
    immediatePopulationEffect: -1000,
    immediateTechEffect: 0
  },
  {
    description: ["asteroid impact"],
    yearsBetween: 1000,
    duration: [0.5, 10],
    growthRateEffect: -1,
    immediatePopulationEffect: -1000000,
    immediateTechEffect: -2
  },
  {
    description: ["technological breakthrough"],
    yearsBetween: 10,
    duration: [1, 20],
    growthRateEffect: 0.2,
    immediateTechEffect: 0.5
  },
  {
    description: ["major technological breakthrough"],
    yearsBetween: 100,
    duration: [10, 100],
    growthRateEffect: 0.2,
    immediateTechEffect: 3
  }
]


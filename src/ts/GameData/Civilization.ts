import { YearInMinutes } from "../Logic/Conversions";
import { UI } from "../Utilities";
import GameState, { Events, ObjectInfo, SolarSystemDefinition } from "./GameState";
import { Civilization, isPlanet, Planet, planetInfo, planetPositionAt, SolarSystem, TechLevel } from "./SolarSystemObjects";


export function civilizationInfo(civ: Civilization, planet: Planet): ObjectInfo {
  return {
    name: `${civ.species} civilization on ${planet.name}`,
    definition: null,
    details: [
      { name: "Back", hint: "Return to planet information.", action: g => g.emit(Events.ShowInfo, planetInfo(planet)) },
      `Established: ${civ.established > 0 ? UI.createTimeString(civ.established, 1, 1) : 'Pre-Mission'}`,
      `Tech level: ${civ.technology}`,
      `Population: ${civ.population.toFixed(0)}`
    ]
  }
}

export function civilizationHint(civ: Civilization): string {
  const popDecimals = civ.population < 1000000 ? 2 : 0;
  return `${civ.technology}, ${civ.species}, population approx. ${(civ.population / 1000000).toFixed(popDecimals)} million`
}

export function addCivilization(planet: Planet, civ: Civilization): void {
  if (planet.civilizations) {
    planet.civilizations.push(civ);
  } else {
    planet.civilizations = [civ];
  }
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
  for (const planet of system.objects.filter<Planet>(isPlanet)) {
    const civs = planet.civilizations;
    if (!civs) {
      continue;
    }

    if (civs.length > 1) {
      mergeCivilizations(civs, state.earthTime);
    }

    for (const civ of civs) {
      updateCivilization(civ, state, timePassed);
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
      civs.splice(i, 1);
    }
  }
}

function updateCivilization(civ: Civilization, state: GameState, timePassed: number): void {
  let growthRate = Math.pow(civ.growthRate, timePassed / 60 / 24 / 365);

  // The population will only begin growing after a year
  if (civ.established + YearInMinutes > state.earthTime) {
    growthRate = Math.min(1, growthRate);
  }
  civ.population = civ.population * growthRate;
}

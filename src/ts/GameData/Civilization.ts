import { Events, ObjectInfo } from "./GameState";
import { Civilization, Planet, planetInfo, planetPositionAt } from "./SolarSystemObjects";

export function civilizationInfo(civ: Civilization, planet: Planet): ObjectInfo {
  return {
    name: `${civ.species} civilization on ${planet.name}`,
    definition: null,
    details: [
      { name: "Back", hint: "Return to planet information.", action: g => g.emit(Events.ShowInfo, planetInfo(planet)) },
      `Tech level: ${civ.technology}`,
      `Population: ${civ.population.toFixed(0)}`
    ]
  }
}

export function civilizationHint(civ: Civilization): string {
  const popDecimals = civ.population < 1000000 ? 2 : 0;
  return `${civ.technology}, ${civ.species}, population approx. ${(civ.population / 1000000).toFixed(popDecimals)} million`
}

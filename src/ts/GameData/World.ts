import { SolarSystemObject } from "./SolarSystemObjects"

export const Worlds: { name: string, position: number[], objects: SolarSystemObject[] }[] = [
  {
    name: "Sol",
    position: [0, 0],
    objects: [
      {
        type: "sun",
        name: "Sol",
        mass: 20000000
      },
      {
        type: "planet",
        name: "Mercury",
        mass: 3,
        orbitalRadius: 57,
        startAngle: 0,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
      },
      {
        type: "planet",
        name: "Venus",
        mass: 49,
        orbitalRadius: 108,
        startAngle: 1,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Corrosive",
        temperature: "Burning"
      },
      {
        type: "planet",
        name: "Earth",
        mass: 50,
        orbitalRadius: 149,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Toxic",
        temperature: "Warm",
        biosphere: "Remnant",
        intelligenceSigns: "Intrastellar"
      },
      {
        type: "planet",
        name: "Mars",
        mass: 6.4,
        orbitalRadius: 227,
        startAngle: 3,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Radioactive Cinders",
        temperature: "Cold",
        biosphere: "Microbial"
      },
      {
        type: "planet",
        name: "Jupiter",
        mass: 18987,
        orbitalRadius: 778,
        startAngle: 4,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant"
      },
      {
        type: "planet",
        name: "Saturn",
        mass: 5685,
        orbitalRadius: 1426,
        startAngle: 5,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant"
      },
      {
        type: "planet",
        name: "Uranus",
        mass: 868,
        orbitalRadius: 2870,
        startAngle: 6,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant"
      },
      {
        type: "planet",
        name: "Neptune",
        mass: 1024,
        orbitalRadius: 4498,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant"
      }
    ]
  },
  {
    name: "Avalon",
    position: [6, 8],
    objects: [
      {
        type: "sun",
        name: "Avalon",
        mass: 23000000
      },
      {
        type: "planet",
        name: "alpha-Avalon",
        mass: 21,
        orbitalRadius: 89,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        atmosphere: "Thin",
        temperature: "Warm",
        biosphere: "Microbial"
      },
      {
        type: "planet",
        name: "beta-Avalon",
        mass: 48,
        orbitalRadius: 140,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        atmosphere: "Thin",
        temperature: "Cold",
        biosphere: "Immiscible"
      },
      {
        type: "planet",
        name: "gamma-Avalon",
        mass: 5193,
        orbitalRadius: 1321,
        startAngle: 2,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant"
      },
      {
        type: "planet",
        name: "delta-Avalon",
        mass: 93,
        orbitalRadius: 4531,
        startAngle: 1,
        orbitalSpeedMultiplier: 1,
        composition: "Ice/Water",
        temperature: "Frozen"
      }
    ]
  },
  {
    name: "Celestia",
    position: [20, 0],
    objects: [
      {
        type: "sun",
        name: "Celestia",
        mass: 18000000
      },
      {
        type: "planet",
        name: "alpha-Celestia",
        mass: 8,
        orbitalRadius: 34,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Molten"
      },
      {
        type: "planet",
        name: "beta-Celestia",
        mass: 57,
        orbitalRadius: 150,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Warm",
        biosphere: "Miscible"
      },
      {
        type: "planet",
        name: "gamma-Celestia",
        mass: 20300,
        orbitalRadius: 1821,
        startAngle: 2,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
      }
    ]
  },
  {
    name: "Ovid",
    position: [-9, 3],
    objects: [
      {
        type: "sun",
        name: "Ovid's Star",
        mass: 18000000
      },
      {
        type: "planet",
        name: "Tristia",
        mass: 856,
        orbitalRadius: 78,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        atmosphere: "Inert",
        temperature: "Burning"
      },
      {
        type: "planet",
        name: "Fasti",
        mass: 130,
        orbitalRadius: 176,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Inert",
        temperature: "Temperate"
      },
      {
        type: "planet",
        name: "Amores I",
        mass: 14681,
        orbitalRadius: 821,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
      },
      {
        type: "planet",
        name: "Amores II",
        mass: 12681,
        orbitalRadius: 871,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant"
      }
    ]
  }
]


import { SolarSystem } from "./SolarSystemObjects"

export const Worlds: SolarSystem[] = [
  {
    name: "Sol",
    position: [0, 0],
    objects: [
      {
        type: "sun",
        name: "Sol",
        mass: 20000000,
        details: {}
      },
      {
        type: "planet",
        name: "Mercury",
        mass: 3,
        orbitalRadius: 57,
        equatorialRadius: 0.38,
        startAngle: 0,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        details: { "scanner": 1000000 }
      },
      {
        type: "planet",
        name: "Venus",
        mass: 49,
        orbitalRadius: 108,
        equatorialRadius: 0.94,
        startAngle: 1,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Corrosive",
        temperature: "Burning",
        details: { "scanner": 1000000 }
      },
      {
        type: "planet",
        name: "Earth",
        mass: 59.72,
        orbitalRadius: 149,
        equatorialRadius: 1,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Toxic",
        temperature: "Warm",
        biosphere: "Remnant",
        details: { "scanner": 1000000 },
        civilizations: [
          {
            established: 0,
            events: [],
            growthRate: 0,
            population: 0,
            scanned: true,
            species: "human",
            techProgress: 0,
            technology: "Interstellar",
            destroyed: {
              cause: "Ecological collapse",
              time: 4293394560
            }
          }
        ]
      },
      {
        type: "planet",
        name: "Mars",
        mass: 6.4,
        orbitalRadius: 227,
        equatorialRadius: 0.53,
        startAngle: 3,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Radioactive Cinders",
        temperature: "Cold",
        biosphere: "Microbial",
        details: { "scanner": 1000000 },
        civilizations: [
          {
            established: 3893394560,
            events: [],
            growthRate: 0,
            population: 0,
            scanned: true,
            species: "karrethan",
            techProgress: 0,
            technology: "Interstellar",
            destroyed: {
              cause: "orbital nuclear bombardment",
              time: 4093394560
            }
          }
        ]
      },
      {
        type: "planet",
        name: "Jupiter",
        mass: 18987,
        orbitalRadius: 778,
        equatorialRadius: 11.2,
        startAngle: 4,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: { "scanner": 1000000 }
      },
      {
        type: "planet",
        name: "Saturn",
        mass: 5685,
        orbitalRadius: 1426,
        equatorialRadius: 9.45,
        startAngle: 5,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: { "scanner": 1000000 }
      },
      {
        type: "planet",
        name: "Uranus",
        mass: 868,
        orbitalRadius: 2870,
        equatorialRadius: 4,
        startAngle: 6,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: { "scanner": 1000000 }
      },
      {
        type: "planet",
        name: "Neptune",
        mass: 1024,
        orbitalRadius: 4498,
        equatorialRadius: 3.883,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: { "scanner": 1000000 }
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
        mass: 23000000,
        details: {}
      },
      {
        type: "planet",
        name: "alpha-Avalon",
        mass: 21,
        orbitalRadius: 89,
        equatorialRadius: 0.4,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        atmosphere: "Thin",
        temperature: "Warm",
        biosphere: "Microbial",
        details: {}
      },
      {
        type: "planet",
        name: "beta-Avalon",
        mass: 48,
        orbitalRadius: 140,
        equatorialRadius: 1.3,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        atmosphere: "Thin",
        temperature: "Cold",
        biosphere: "Immiscible",
        details: {}
      },
      {
        type: "planet",
        name: "gamma-Avalon",
        mass: 5193,
        orbitalRadius: 1321,
        equatorialRadius: 6.1,
        startAngle: 2,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "delta-Avalon",
        mass: 93,
        orbitalRadius: 4531,
        equatorialRadius: 2.4,
        startAngle: 1,
        orbitalSpeedMultiplier: 1,
        composition: "Ice/Water",
        temperature: "Frozen",
        details: {}
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
        mass: 18000000,
        details: {}
      },
      {
        type: "planet",
        name: "alpha-Celestia",
        mass: 8,
        orbitalRadius: 34,
        equatorialRadius: 0.2,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Molten",
        details: {}
      },
      {
        type: "planet",
        name: "beta-Celestia",
        mass: 57,
        orbitalRadius: 150,
        equatorialRadius: 0.99,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Warm",
        biosphere: "Miscible",
        details: {}
      },
      {
        type: "planet",
        name: "gamma-Celestia",
        mass: 20300,
        orbitalRadius: 1821,
        equatorialRadius: 9.8,
        startAngle: 2,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        details: {}
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
        mass: 18000000,
        details: {}
      },
      {
        type: "planet",
        name: "Tristia",
        mass: 856,
        orbitalRadius: 78,
        equatorialRadius: 6.1,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        atmosphere: "Inert",
        temperature: "Burning",
        details: {}
      },
      {
        type: "planet",
        name: "Fasti",
        mass: 148,
        orbitalRadius: 176,
        equatorialRadius: 1.8,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Breathable",
        temperature: "Temperate",
        biosphere: "Miscible",
        details: {}
      },
      {
        type: "asteroids",
        name: "Asteroid Belt",
        orbitalRadius: 420,
        radius: 80
      },
      {
        type: "planet",
        name: "Amores I",
        mass: 14681,
        orbitalRadius: 821,
        equatorialRadius: 8.5,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "Amores II",
        mass: 12681,
        orbitalRadius: 871,
        equatorialRadius: 7.9,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      }
    ]
  },
  // Fix. Currently Celestial clone
  {
    name: "Valhalla",
    position: [-20, -16],
    objects: [
      {
        type: "sun",
        name: "Dagr",
        mass: 24000000,
        details: {}
      },
      {
        type: "planet",
        name: "alpha-Valhalla",
        mass: 8,
        orbitalRadius: 34,
        equatorialRadius: 0.2,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Molten",
        details: {}
      },
      {
        type: "planet",
        name: "beta-Valhalla",
        mass: 57,
        orbitalRadius: 150,
        equatorialRadius: 0.99,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Warm",
        biosphere: "Miscible",
        details: {}
      },
      {
        type: "planet",
        name: "gamma-Valhalla",
        mass: 20300,
        orbitalRadius: 1821,
        equatorialRadius: 9.8,
        startAngle: 2,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        details: {}
      }
    ]
  }
]


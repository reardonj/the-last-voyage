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

import { SolarSystem } from "./SolarSystemObjects"

export const Worlds: SolarSystem[] = [
  /* Sol */
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
            type: "colony",
            established: 0,
            events: [],
            growthRate: 1,
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
            type: "colony",
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
  /* Elysium */
  {
    name: "Elysium",
    position: [-85, -55],
    objects: [
      {
        type: "sun",
        name: "Elysium",
        mass: 20000000,
        details: {}
      },
      {
        type: "planet",
        name: "alpha-Elysium",
        mass: 4,
        orbitalRadius: 61,
        equatorialRadius: 0.48,
        startAngle: 0,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        details: {}
      },
      {
        type: "planet",
        name: "beta-Elysium",
        mass: 40,
        orbitalRadius: 100,
        equatorialRadius: 0.80,
        startAngle: 1,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Toxic",
        temperature: "Burning",
        details: {}
      },
      {
        type: "planet",
        name: "gamma-Elysium",
        mass: 252,
        orbitalRadius: 161,
        equatorialRadius: 2.1,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Thick",
        temperature: "Cold",
        biosphere: "Miscible",
        details: {}
      },
      {
        type: "planet",
        name: "delta-Elysium",
        mass: 26.4,
        orbitalRadius: 257,
        equatorialRadius: 0.63,
        startAngle: 3,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Inert",
        temperature: "Cold",
        biosphere: "Microbial",
        details: {},
        civilizations: [
          {
            type: "colony",
            established: 3843394560,
            events: [],
            growthRate: 0,
            population: 0,
            scanned: false,
            species: "karrethan",
            techProgress: 0,
            technology: "Interstellar",
            destroyed: {
              cause: "biosphere collapse",
              time: 4013394560
            }
          }
        ]
      },
      {
        type: "planet",
        name: "epsilon-Elysium",
        mass: 17987,
        orbitalRadius: 798,
        equatorialRadius: 11,
        startAngle: 4,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "zeta-Elysium",
        mass: 130,
        orbitalRadius: 1426,
        equatorialRadius: 1.45,
        startAngle: 5,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        temperature: "Frozen",
        details: {}
      },
      {
        type: "planet",
        name: "eta-Elysium",
        mass: 301,
        orbitalRadius: 2970,
        equatorialRadius: 2,
        startAngle: 6,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        details: {},
        potentialEvents: [
          {
            description: ["extremely volcanic"],
            duration: [0.1, 0.8],
            yearsBetween: 10,
            growthRateEffect: -0.2,
            immediatePopulationEffect: -100,
            immediateTechEffect: -0.5
          }
        ]
      },
      {
        type: "planet",
        name: "theta-Elysium",
        mass: 7.2,
        orbitalRadius: 4298,
        equatorialRadius: 0.23,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Ice/Water",
        details: {}
      }
    ]
  },
  /* Annwyn */
  {
    name: "Annwyn",
    position: [99, -10],
    objects: [
      {
        type: "sun",
        name: "Annwyn",
        mass: 20000000,
        details: {}
      },
      {
        type: "planet",
        name: "alpha-Annwyn",
        mass: 4000,
        orbitalRadius: 90,
        equatorialRadius: 5.48,
        startAngle: 0,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "beta-Annwyn",
        mass: 58,
        orbitalRadius: 191,
        equatorialRadius: 0.98,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Breathable",
        temperature: "Temperate",
        biosphere: "Miscible",
        details: {}
      },
      {
        type: "planet",
        name: "gamma-Annwyn",
        mass: 46.4,
        orbitalRadius: 307,
        equatorialRadius: 1.63,
        startAngle: 3,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Inert",
        temperature: "Cold",
        details: {}
      },
      {
        type: "planet",
        name: "delta-Annwyn",
        mass: 17987,
        orbitalRadius: 798,
        equatorialRadius: 11,
        startAngle: 4,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "epsilon-Annwyn",
        mass: 130,
        orbitalRadius: 1426,
        equatorialRadius: 1.45,
        startAngle: 5,
        orbitalSpeedMultiplier: -1,
        composition: "Ice/Water",
        temperature: "Frozen",
        details: {}
      },
      {
        type: "planet",
        name: "zeta-Annwyn",
        mass: 301,
        orbitalRadius: 2970,
        equatorialRadius: 2,
        startAngle: 6,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        temperature: "Frozen",
        details: {}
      }
    ]
  },
  /* Avalon */
  {
    name: "Avalon",
    position: [31, -23],
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
        description: "Entirely covered in water.",
        mass: 65,
        orbitalRadius: 160,
        equatorialRadius: 1.1,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Ice/Water",
        atmosphere: "Breathable",
        temperature: "Temperate",
        biosphere: "Miscible",
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
      },
      {
        type: "planet",
        name: "epsilon-Avalon",
        mass: 930,
        orbitalRadius: 6531,
        equatorialRadius: 3.4,
        startAngle: 1,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        temperature: "Cold",
        details: {}
      }
    ]
  },
  /* Celestia */
  {
    name: "Celestia",
    position: [-55, 11],
    objects: [
      {
        type: "sun",
        name: "Celestia",
        mass: 21000000,
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
        temperature: "Burning",
        details: {}
      },
      {
        type: "planet",
        name: "Gamma-Celestia",
        mass: 8300,
        orbitalRadius: 821,
        equatorialRadius: 9.8,
        startAngle: 2,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "Delta-Celestia",
        mass: 20300,
        orbitalRadius: 1521,
        equatorialRadius: 9.8,
        startAngle: 2,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "epsilon-Celestia",
        mass: 57,
        orbitalRadius: 2600,
        equatorialRadius: 0.99,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Frozen",
        atmosphere: "Thin",
        details: {},
        civilizations: [
          {
            type: "orbital",
            established: 0,
            events: [],
            growthRate: 1,
            population: 0,
            scanned: false,
            species: "karreth",
            techProgress: 0,
            technology: "Interstellar",
            destroyed: {
              cause: "Unknown",
              time: 3263394560
            }
          }
        ]
      }
    ]
  },
  /* Tian */
  {
    name: "Tian",
    position: [43, 21],
    objects: [
      {
        type: "sun",
        name: "Tian",
        mass: 18000000,
        details: {}
      },
      {
        type: "planet",
        name: "alpha-Tian",
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
        name: "beta-Tian",
        mass: 148,
        orbitalRadius: 176,
        equatorialRadius: 1.8,
        startAngle: 7,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Thin",
        temperature: "Cold",
        biosphere: "Miscible",
        details: {},
        potentialEvents: [
          {
            description: ["negligible magnetic field"],
            duration: [0.5, 2],
            yearsBetween: 5,
            growthRateEffect: -0.1,
            immediateTechEffect: -1
          }
        ]
      },
      {
        type: "planet",
        name: "gamma-Tian",
        mass: 9681,
        orbitalRadius: 821,
        equatorialRadius: 8.5,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "delta",
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
  /* Valhalla */
  {
    name: "Valhalla",
    position: [-78, 38],
    objects: [
      {
        type: "sun",
        name: "Dagr",
        description: "Named for the norse god of the sun.",
        mass: 24000000,
        details: {}
      },
      {
        type: "asteroids",
        name: "inner Valhalla field",
        orbitalRadius: 90,
        radius: 20
      },
      {
        type: "planet",
        name: "alpha-Valhalla",
        mass: 57,
        orbitalRadius: 160,
        equatorialRadius: 0.99,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Rocky",
        temperature: "Temperate",
        biosphere: "Miscible",
        atmosphere: "Breathable",
        details: {},
        potentialEvents: [
          {
            description: ["meteorite storms"],
            duration: [0.1, 0.5],
            yearsBetween: 5,
            growthRateEffect: -0.1,
            immediatePopulationEffect: -100,
            immediateTechEffect: -0.1
          }
        ]
      },
      {
        type: "asteroids",
        name: "outer Valhalla field",
        orbitalRadius: 300,
        radius: 32
      },
      {
        type: "planet",
        name: "beta-Valhalla",
        mass: 5700,
        orbitalRadius: 610,
        equatorialRadius: 3.3,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        temperature: "Warm",
        biosphere: "Microbial",
        details: {}
      },
      {
        type: "planet",
        name: "gamma-Valhalla",
        mass: 5985,
        orbitalRadius: 1526,
        equatorialRadius: 9.45,
        startAngle: 5,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "delta-Valhalla",
        mass: 968,
        orbitalRadius: 3170,
        equatorialRadius: 4.5,
        startAngle: 6,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        temperature: "Cold",
        details: {}
      }
    ]
  },
  /* Hades */
  {
    name: "Hades",
    description: "A black hole surrounded by a significant accretion disk.",
    position: [75, -8],
    objects: [
      {
        type: "sun",
        mass: 180000000,
        name: "Oblivion",
        description: "A stellar black hole",
        details: {}
      },
      {
        type: "asteroids",
        name: "accretion disk",
        orbitalRadius: 400,
        radius: 320
      },
      {
        type: "planet",
        name: "Tartarus",
        mass: 5000,
        orbitalRadius: 1510,
        equatorialRadius: 4.3,
        startAngle: 7,
        orbitalSpeedMultiplier: 1,
        composition: "Gas Giant",
        temperature: "Frozen",
        details: {}
      }
    ]
  },
  /* Karreth */
  {
    name: "Karreth",
    position: [-50, 1],
    description: "Projected home system of the karrethan aliens.",
    objects: [
      {
        type: "sun",
        name: "Karreth",
        mass: 20000000,
        details: {}
      },
      {
        type: "asteroids",
        name: "Planetary remnants",
        orbitalRadius: 60,
        radius: 5
      },
      {
        type: "planet",
        name: "alpha-Karreth",
        mass: 49,
        orbitalRadius: 118,
        equatorialRadius: 0.94,
        startAngle: 1,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Thick",
        temperature: "Burning",
        details: {},
        civilizations: [
          {
            type: "colony",
            established: 0,
            events: [],
            growthRate: 1,
            population: 0,
            scanned: false,
            species: "karreth",
            techProgress: 0,
            technology: "Neolithic",
            destroyed: {
              cause: "Runaway greenhouse effect",
              time: 3293394560
            }
          }
        ]
      },
      {
        type: "planet",
        name: "beta-Karreth",
        mass: 61.72,
        orbitalRadius: 179,
        equatorialRadius: 1,
        startAngle: 2,
        orbitalSpeedMultiplier: -1,
        composition: "Rocky",
        atmosphere: "Breathable",
        temperature: "Cold",
        biosphere: "Immiscible",
        details: {},
        civilizations: [
          {
            type: "colony",
            established: 0,
            events: [],
            growthRate: 1.01,
            population: 24000000,
            scanned: false,
            species: "karreth",
            techProgress: -10,
            technology: "Neolithic"
          }
        ],
        potentialEvents: [
          {
            description: ["potentially hostile inhabitants"],
            immediateTechEffect: 0,
            duration: [1, 3],
            yearsBetween: 30,
            growthRateEffect: -0.5,
            immediatePopulationEffect: 3000
          }
        ]
      },
      {
        type: "planet",
        name: "gamma-Karreth",
        mass: 19987,
        orbitalRadius: 378,
        equatorialRadius: 10.2,
        startAngle: 4,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "delta-Karreth",
        mass: 5085,
        orbitalRadius: 826,
        equatorialRadius: 9.15,
        startAngle: 5,
        orbitalSpeedMultiplier: -1,
        composition: "Gas Giant",
        details: {}
      },
      {
        type: "planet",
        name: "epsilon-Karreth",
        mass: 49,
        orbitalRadius: 1870,
        equatorialRadius: 1.5,
        startAngle: 6,
        orbitalSpeedMultiplier: -1,
        composition: "Ice/Water",
        atmosphere: "Thin",
        temperature: "Frozen",
        details: {}
      },
    ]
  }
]


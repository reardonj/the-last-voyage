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
  startAngle: number,
  composition: Composition,
  atmosphere?: Atmosphere,
  temperature?: Temperature,
  biosphere?: Biosphere,
  intelligenceSigns?: IntelligenceSigns
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
  "Molten"

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

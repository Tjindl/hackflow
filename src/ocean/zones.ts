/**
 * The water column the form descends through. Each question sits in the next
 * zone down; the completion screen rests on the floor of the Challenger Deep.
 */
export interface Zone {
  id: 'epipelagic' | 'mesopelagic' | 'bathypelagic' | 'abyssopelagic' | 'hadopelagic' | 'seafloor';
  /** Common name, e.g. "Twilight zone". */
  name: string;
  /** Oceanographic name, e.g. "Mesopelagic". */
  scientificName: string;
  /** Depth in metres at which a step in this zone is placed (the top of the zone). */
  depth: number;
  /** Lower bound of the zone in metres, used for the range label. */
  floor: number;
  note: string;
  /** Visual level for the renderer: 0 = surface … 5 = seafloor. */
  level: number;
}

export const CHALLENGER_DEEP_DEPTH = 10_935;

export const WATER_ZONES: readonly Zone[] = [
  {
    id: 'epipelagic',
    name: 'Sunlight zone',
    scientificName: 'Epipelagic',
    depth: 0,
    floor: 200,
    level: 0,
    note: 'Enough light for photosynthesis. Ocean phytoplankton produce roughly half of the oxygen on Earth.',
  },
  {
    id: 'mesopelagic',
    name: 'Twilight zone',
    scientificName: 'Mesopelagic',
    depth: 200,
    floor: 1_000,
    level: 1,
    note: 'Sunlight fades to a dim blue. Each night many animals here rise to feed near the surface, the largest migration on Earth.',
  },
  {
    id: 'bathypelagic',
    name: 'Midnight zone',
    scientificName: 'Bathypelagic',
    depth: 1_000,
    floor: 4_000,
    level: 2,
    note: 'No sunlight reaches this deep. Almost all light here is bioluminescence, most of it blue.',
  },
  {
    id: 'abyssopelagic',
    name: 'Abyssal zone',
    scientificName: 'Abyssopelagic',
    depth: 4_000,
    floor: 6_000,
    level: 3,
    note: 'Near-freezing, pitch-black water. The abyssal plains below cover roughly half of Earth’s surface.',
  },
  {
    id: 'hadopelagic',
    name: 'Hadal zone',
    scientificName: 'Hadopelagic',
    depth: 6_000,
    floor: CHALLENGER_DEEP_DEPTH,
    level: 4,
    note: 'Found only in ocean trenches, and named after Hades, the Greek underworld.',
  },
];

export const SEAFLOOR: Zone = {
  id: 'seafloor',
  name: 'Challenger Deep',
  scientificName: 'Mariana Trench',
  depth: CHALLENGER_DEEP_DEPTH,
  floor: CHALLENGER_DEEP_DEPTH,
  level: 5,
  note: 'The deepest known point in the ocean. Mount Everest would fit beneath the surface with over 2 km to spare.',
};

export const SEAFLOOR_COORDINATES = '11°22′N 142°35′E';

const EXTRA_STEP_DEPTH = 1_000;

/**
 * One stop per question plus the seafloor. Questions beyond the fifth stay in
 * the hadal zone and keep sinking, capped just above the floor.
 */
export function zonesForSteps(questionCount: number): Zone[] {
  const last = WATER_ZONES.length - 1;
  const stops = Array.from({ length: questionCount }, (_, i) => {
    const zone = WATER_ZONES[Math.min(i, last)];
    const extra = Math.max(0, i - last) * EXTRA_STEP_DEPTH;
    return { ...zone, depth: Math.min(zone.depth + extra, CHALLENGER_DEEP_DEPTH - 500) };
  });
  return [...stops, SEAFLOOR];
}

/** The zone a depth falls in: the deepest stop that starts at or above it. */
export function zoneAtDepth(depth: number, stops: readonly Zone[]): Zone {
  let zone = stops[0];
  for (const stop of stops) if (stop.depth <= depth + 0.5) zone = stop;
  return zone;
}

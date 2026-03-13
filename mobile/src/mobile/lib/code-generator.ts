const ADJECTIVES = [
  "COSMIC",
  "STELLAR",
  "QUANTUM",
  "NEBULA",
  "PULSAR",
  "AURORA",
  "ZENITH",
  "RADIANT",
  "ASTRAL",
  "SOLAR",
  "HYPER",
  "PLASMA",
  "THUNDER",
  "MYSTIC",
  "SHADOW",
  "BLAZING",
  "ARCTIC",
  "MAGNETIC",
];

const NOUNS = [
  "FALCON",
  "PHOENIX",
  "DRAGON",
  "TIGER",
  "EAGLE",
  "WOLF",
  "HAWK",
  "RUNNER",
  "PILOT",
  "SHIELD",
  "ORBIT",
  "PULSE",
  "MATRIX",
  "TITAN",
  "SENTINEL",
  "CYCLONE",
  "NEXUS",
  "HELIX",
];

function randomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

export function generateSecureCode() {
  return `${ADJECTIVES[randomIndex(ADJECTIVES.length)]}-${NOUNS[randomIndex(NOUNS.length)]}`;
}

export function isValidCode(value: string) {
  return /^[A-Z]+-[A-Z]+$/.test(value.trim());
}

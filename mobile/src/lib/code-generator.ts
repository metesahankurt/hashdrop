const ADJECTIVES = [
  "Cosmic", "Stellar", "Quantum", "Nebula", "Pulsar",
  "Galaxy", "Meteor", "Comet", "Aurora", "Zenith",
  "Radiant", "Celestial", "Astral", "Lunar", "Solar",
  "Void", "Warp", "Flux", "Neon", "Cyber",
  "Hyper", "Ultra", "Mega", "Giga", "Tera",
  "Plasma", "Photon", "Proton", "Neutron", "Atom",
  "Crystal", "Diamond", "Emerald", "Sapphire", "Ruby",
  "Thunder", "Storm", "Blizzard", "Tempest", "Typhoon",
  "Infinite", "Eternal", "Ancient", "Noble", "Royal",
  "Mystic", "Arcane", "Divine", "Sacred", "Holy",
  "Swift", "Rapid", "Quick", "Flash", "Instant",
  "Mighty", "Grand", "Epic", "Legendary", "Heroic",
  "Silent", "Shadow", "Ghost", "Phantom", "Stealth",
  "Blazing", "Flaming", "Burning", "Inferno", "Volcanic",
  "Frozen", "Icy", "Arctic", "Glacier", "Polar",
  "Electric", "Magnetic", "Sonic", "Atomic", "Nuclear",
];

const NOUNS = [
  "Falcon", "Phoenix", "Dragon", "Tiger", "Eagle",
  "Wolf", "Bear", "Shark", "Panther", "Hawk",
  "Runner", "Rider", "Glider", "Drifter", "Surfer",
  "Walker", "Climber", "Diver", "Flyer", "Pilot",
  "Engine", "Reactor", "Generator", "Turbine", "Motor",
  "Blade", "Arrow", "Spear", "Sword", "Shield",
  "Star", "Moon", "Sun", "Planet", "Orbit",
  "Wave", "Pulse", "Beam", "Ray", "Flash",
  "Lion", "Leopard", "Cheetah", "Jaguar", "Cougar",
  "Raven", "Owl", "Condor", "Osprey", "Kestrel",
  "Viper", "Cobra", "Python", "Mamba", "Anaconda",
  "Thunder", "Lightning", "Tornado", "Hurricane", "Cyclone",
  "Knight", "Warrior", "Guardian", "Sentinel", "Champion",
  "Titan", "Colossus", "Behemoth", "Leviathan", "Kraken",
  "Prism", "Nexus", "Vortex", "Matrix", "Helix",
  "Specter", "Wraith", "Demon", "Angel", "Seraph",
];

function getSecureRandomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

export function generateSecureCode(): string {
  const adjIndex = getSecureRandomIndex(ADJECTIVES.length);
  const nounIndex = getSecureRandomIndex(NOUNS.length);
  return `${ADJECTIVES[adjIndex].toUpperCase()}-${NOUNS[nounIndex].toUpperCase()}`;
}

export function codeToPeerId(displayCode: string): string {
  return `sr-warp-${displayCode.toLowerCase()}`;
}

export function codeToCallPeerId(displayCode: string): string {
  return `sr-call-${displayCode.toLowerCase()}`;
}

export function isValidCode(code: string): boolean {
  return /^[A-Z]+-[A-Z]+$/.test(code);
}

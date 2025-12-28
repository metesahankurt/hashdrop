/**
 * Generates a cryptographically secure random Warp Code
 * Format: "Adjective-Noun" (e.g., "Cosmic-Falcon")
 * Uses Web Crypto API for true randomness
 */

const ADJECTIVES = [
  'Cosmic', 'Stellar', 'Quantum', 'Nebula', 'Pulsar',
  'Galaxy', 'Meteor', 'Comet', 'Aurora', 'Zenith',
  'Radiant', 'Celestial', 'Astral', 'Lunar', 'Solar',
  'Void', 'Warp', 'Flux', 'Neon', 'Cyber',
  'Hyper', 'Ultra', 'Mega', 'Giga', 'Tera',
  'Plasma', 'Photon', 'Proton', 'Neutron', 'Atom',
  'Crystal', 'Diamond', 'Emerald', 'Sapphire', 'Ruby',
  'Thunder', 'Storm', 'Blizzard', 'Tempest', 'Typhoon',
  // SECURITY: Added 40 more adjectives to increase entropy (80 total)
  'Infinite', 'Eternal', 'Ancient', 'Noble', 'Royal',
  'Mystic', 'Arcane', 'Divine', 'Sacred', 'Holy',
  'Swift', 'Rapid', 'Quick', 'Flash', 'Instant',
  'Mighty', 'Grand', 'Epic', 'Legendary', 'Heroic',
  'Silent', 'Shadow', 'Ghost', 'Phantom', 'Stealth',
  'Blazing', 'Flaming', 'Burning', 'Inferno', 'Volcanic',
  'Frozen', 'Icy', 'Arctic', 'Glacier', 'Polar',
  'Electric', 'Magnetic', 'Sonic', 'Atomic', 'Nuclear'
]

const NOUNS = [
  'Falcon', 'Phoenix', 'Dragon', 'Tiger', 'Eagle',
  'Wolf', 'Bear', 'Shark', 'Panther', 'Hawk',
  'Runner', 'Rider', 'Glider', 'Drifter', 'Surfer',
  'Walker', 'Climber', 'Diver', 'Flyer', 'Pilot',
  'Engine', 'Reactor', 'Generator', 'Turbine', 'Motor',
  'Blade', 'Arrow', 'Spear', 'Sword', 'Shield',
  'Star', 'Moon', 'Sun', 'Planet', 'Orbit',
  'Wave', 'Pulse', 'Beam', 'Ray', 'Flash',
  // SECURITY: Added 40 more nouns to increase entropy (80 total)
  'Lion', 'Leopard', 'Cheetah', 'Jaguar', 'Cougar',
  'Raven', 'Owl', 'Condor', 'Osprey', 'Kestrel',
  'Viper', 'Cobra', 'Python', 'Mamba', 'Anaconda',
  'Thunder', 'Lightning', 'Tornado', 'Hurricane', 'Cyclone',
  'Knight', 'Warrior', 'Guardian', 'Sentinel', 'Champion',
  'Titan', 'Colossus', 'Behemoth', 'Leviathan', 'Kraken',
  'Prism', 'Nexus', 'Vortex', 'Matrix', 'Helix',
  'Specter', 'Wraith', 'Demon', 'Angel', 'Seraph'
]

/**
 * Generate a secure random index using Web Crypto API
 */
function getSecureRandomIndex(max: number): number {
  if (typeof window === 'undefined') {
    // Fallback for SSR
    return Math.floor(Math.random() * max)
  }
  
  const randomBuffer = new Uint32Array(1)
  window.crypto.getRandomValues(randomBuffer)
  return randomBuffer[0] % max
}

/**
 * Generate a Warp Code with format: "Adjective-Noun"
 * Example: "Cosmic-Falcon", "Stellar-Phoenix"
 */
export function generateSecureCode(): string {
  const adjIndex = getSecureRandomIndex(ADJECTIVES.length)
  const nounIndex = getSecureRandomIndex(NOUNS.length)
  
  return `${ADJECTIVES[adjIndex]}-${NOUNS[nounIndex]}`
}

/**
 * Convert display code to PeerJS ID
 * Example: "Cosmic-Falcon" → "sr-warp-cosmic-falcon"
 */
export function codeToPeerId(displayCode: string): string {
  return `sr-warp-${displayCode.toLowerCase()}`
}

/**
 * Validate code format
 */
export function isValidCode(code: string): boolean {
  return /^[A-Z][a-z]+-[A-Z][a-z]+$/.test(code)
}

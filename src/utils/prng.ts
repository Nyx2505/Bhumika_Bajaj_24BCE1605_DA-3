// Mulberry32: A fast, high-quality 32-bit deterministic PRNG
export class SeededPRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  // Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive)
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns a pseudo-random float between min and max
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Set seed
  public setSeed(seed: number) {
    this.state = seed >>> 0;
  }
}

// Global deterministic generator instance initialized with standard seed
export const globalPRNG = new SeededPRNG(4242);

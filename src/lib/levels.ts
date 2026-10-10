export type Planet = {
  id: number;
  name: string;
  concept: string;
  badge: string;
  badgeIcon: string;
  color: string;
  blurb: string;
};

export const PLANETS: Planet[] = [
  { id: 1, name: "Planet Bitopia", concept: "Bits", badge: "Bit Master", badgeIcon: "💡", color: "#ffd23f", blurb: "Flip switches and learn the language of computers." },
  { id: 2, name: "Planet Qubitron", concept: "Qubits", badge: "Qubit Explorer", badgeIcon: "🪙", color: "#ff8fab", blurb: "Spin a magical quantum coin." },
  { id: 3, name: "Planet Maybe", concept: "Superposition", badge: "Superposition Hero", badgeIcon: "🗺️", color: "#7bdff2", blurb: "Hunt for a treasure that's in many places at once." },
  { id: 4, name: "Twin Moons", concept: "Entanglement", badge: "Entanglement Champion", badgeIcon: "👯", color: "#b388ff", blurb: "Meet magical twins that always match." },
  { id: 5, name: "Gearworld", concept: "Quantum Gates", badge: "Gate Engineer", badgeIcon: "⚙️", color: "#3ddc97", blurb: "Build machines that change qubits." },
  { id: 6, name: "Puzzle Nebula", concept: "Quantum Algorithms", badge: "Algorithm Wizard", badgeIcon: "🧙", color: "#ff9f1c", blurb: "Race a classical robot to find the hidden star." },
  { id: 7, name: "Future Station", concept: "Quantum Future", badge: "Quantum Scientist", badgeIcon: "🔬", color: "#e0e7ff", blurb: "Visit real quantum computers in the lab." },
];

export const XP_PER_LEVEL = 100;
export const xpLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

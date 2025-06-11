export interface Badge {
  name: string;
  emoji: string;
  points: number;
  description: string;
}

export const BADGES: Badge[] = [
  { name: "Tablet Baby", emoji: "👶", points: 25, description: "Welcome to TV Tantrum!" },
  { name: "TV Tamer", emoji: "🧑‍🧒", points: 50, description: "Getting the hang of it" },
  { name: "Algorithm Avoider", emoji: "🫷", points: 100, description: "Discovering new content" },
  { name: "Mood-Swing Mediator", emoji: "🧑‍⚖️", points: 200, description: "Sharing your thoughts" },
  { name: "Rhythm Regulator", emoji: "🪪", points: 300, description: "Really getting into it" },
  { name: "Pixel Protector", emoji: "🥽", points: 400, description: "Becoming an expert" },
  { name: "Screen-Time Sherpa", emoji: "🤝", points: 500, description: "True connoisseur" },
  { name: "Programme Peacekeeper", emoji: "✌️", points: 750, description: "Master of family viewing" },
  { name: "Calm-Ware Engineer", emoji: "🧑‍🔧", points: 1000, description: "Ruling the remote" },
  { name: "Digital Diplomat", emoji: "🧑‍💼", points: 1250, description: "Mystical viewing powers" },
  { name: "Sensory Sentinel", emoji: "🦾", points: 1500, description: "Artistic taste" },
  { name: "Guardian of the Glow", emoji: "🥷", points: 1750, description: "Wisdom of the streams" },
  { name: "Screen Sensei", emoji: "🧘", points: 2000, description: "Ultimate TV master" }
];

export function getCurrentBadge(points: number): Badge {
  // Find the highest badge the user has earned
  const earnedBadges = BADGES.filter(badge => points >= badge.points);
  return earnedBadges.length > 0 ? earnedBadges[earnedBadges.length - 1] : BADGES[0];
}

export function getNextBadge(points: number): Badge | null {
  // Find the next badge to unlock
  const nextBadge = BADGES.find(badge => points < badge.points);
  return nextBadge || null;
}

export function getBadgeName(points: number): string {
  const badge = getCurrentBadge(points);
  return badge.name;
}

export function getBadgeEmoji(points: number): string {
  const badge = getCurrentBadge(points);
  return badge.emoji;
}
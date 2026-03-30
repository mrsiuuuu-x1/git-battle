export interface TierDef {
  name: string;
  icon: string;
  minWins: number;
  color: string;
  bgColor: string;
}

export const TIERS: TierDef[] = [
  { name: "Bronze",   icon: "🥉", minWins: 0,    color: "#cd7f32", bgColor: "rgba(205,127,50,0.2)" },
  { name: "Silver",   icon: "🥈", minWins: 101,  color: "#c0c0c0", bgColor: "rgba(192,192,192,0.2)" },
  { name: "Gold",     icon: "🥇", minWins: 301,  color: "#ffd700", bgColor: "rgba(255,215,0,0.2)" },
  { name: "Platinum", icon: "💎", minWins: 601,  color: "#e5e4e2", bgColor: "rgba(229,228,226,0.25)" },
  { name: "Diamond",  icon: "💠", minWins: 1001, color: "#b9f2ff", bgColor: "rgba(185,242,255,0.2)" },
  { name: "Master",   icon: "👑", minWins: 2001, color: "#ff4500", bgColor: "rgba(255,69,0,0.2)" },
];

export function getTier(wins: number): TierDef {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (wins >= tier.minWins) {
      current = tier;
    } else {
      break;
    }
  }
  return current;
}

export function getNextTier(wins: number): TierDef | null {
  for (const tier of TIERS) {
    if (wins < tier.minWins) {
      return tier;
    }
  }
  return null;
}

export function getTierProgress(wins: number): { current: TierDef; next: TierDef | null; progress: number; winsToNext: number } {
  const current = getTier(wins);
  const next = getNextTier(wins);

  if (!next) {
    return { current, next: null, progress: 100, winsToNext: 0 };
  }

  const winsInTier = wins - current.minWins;
  const tierRange = next.minWins - current.minWins;
  const progress = Math.floor((winsInTier / tierRange) * 100);

  return { current, next, progress, winsToNext: next.minWins - wins };
}

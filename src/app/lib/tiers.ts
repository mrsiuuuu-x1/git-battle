export interface TierDef {
  name: string;
  icon: string;
  image: string;
  minWins: number;
  color: string;
  bgColor: string;
}

export const TIERS: TierDef[] = [
  { name: "Background NPC",    icon: "👤", image: "/tiers/tier1-background-npc.svg",  minWins: 0,    color: "#8b8b8b", bgColor: "rgba(139,139,139,0.2)" },
  { name: "Side Character",    icon: "🗡️", image: "/tiers/tier2-side-character.svg",  minWins: 51,   color: "#c0c0c0", bgColor: "rgba(192,192,192,0.2)" },
  { name: "Supporting Role",   icon: "⚔️", image: "/tiers/tier3-supporting-role.svg", minWins: 131,  color: "#ffd700", bgColor: "rgba(255,215,0,0.2)" },
  { name: "Main Character",    icon: "🌟", image: "/tiers/tier4-main-character.svg",  minWins: 451,  color: "#e5e4e2", bgColor: "rgba(229,228,226,0.25)" },
  { name: "Protagonist",       icon: "💫", image: "/tiers/tier5-protagonist.svg",     minWins: 1001, color: "#b9f2ff", bgColor: "rgba(185,242,255,0.2)" },
  { name: "Final Boss",        icon: "👑", image: "/tiers/tier6-final-boss.svg",      minWins: 2001, color: "#ff4500", bgColor: "rgba(255,69,0,0.2)" },
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

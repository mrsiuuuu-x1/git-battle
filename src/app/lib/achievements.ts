export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "battle" | "github" | "special";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Battle Achievements
  { key: "FIRST_BLOOD",   name: "First Blood",       description: "Win your first battle",       icon: "🩸", category: "battle" },
  { key: "UNSTOPPABLE",   name: "Unstoppable",        description: "Win 10 battles in a row",     icon: "🔥", category: "battle" },
  { key: "LEGEND",        name: "Legend",             description: "Win 100 total battles",       icon: "🏆", category: "battle" },

  // GitHub Achievements
  { key: "COMMIT_MASTER", name: "Commit Master",      description: "Have 1000+ commits",          icon: "📝", category: "github" },
  { key: "STAR_COLLECTOR",name: "Star Collector",      description: "Have 100+ stars across repos", icon: "⭐", category: "github" },
  { key: "COLLAB_KING",   name: "Collaboration King", description: "Have 50+ merged PRs",         icon: "🤝", category: "github" },

  // Special Badges
  { key: "STREAK_WARRIOR", name: "Streak Warrior",     description: "7+ day contribution streak",  icon: "⚡", category: "special" },
  { key: "OPEN_SOURCE",    name: "Open Source Hero",   description: "Contribute to 3+ orgs",       icon: "🌍", category: "special" },
];

export function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.key === key);
}

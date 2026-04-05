export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: "battle" | "github" | "special" | "language";
}

export const LANGUAGE_BADGES: { language: string; key: string; name: string; icon: string }[] = [
  { language: "JavaScript",  key: "LANG_JAVASCRIPT",  name: "JS Specialist",       icon: "🟨" },
  { language: "TypeScript",  key: "LANG_TYPESCRIPT",  name: "TS Specialist",       icon: "🔷" },
  { language: "Python",      key: "LANG_PYTHON",      name: "Python Specialist",   icon: "🐍" },
  { language: "Java",        key: "LANG_JAVA",        name: "Java Specialist",     icon: "☕" },
  { language: "Go",          key: "LANG_GO",          name: "Go Specialist",       icon: "🐹" },
  { language: "Rust",        key: "LANG_RUST",        name: "Rust Specialist",     icon: "🦀" },
  { language: "C++",         key: "LANG_CPP",         name: "C++ Specialist",      icon: "⚙️" },
  { language: "C#",          key: "LANG_CSHARP",      name: "C# Specialist",       icon: "🎯" },
  { language: "Ruby",        key: "LANG_RUBY",        name: "Ruby Specialist",     icon: "💎" },
  { language: "PHP",         key: "LANG_PHP",         name: "PHP Specialist",      icon: "🐘" },
  { language: "Swift",       key: "LANG_SWIFT",       name: "Swift Specialist",    icon: "🍎" },
  { language: "Kotlin",      key: "LANG_KOTLIN",      name: "Kotlin Specialist",   icon: "🟣" },
  { language: "C",           key: "LANG_C",           name: "C Specialist",        icon: "🔧" },
  { language: "Shell",       key: "LANG_SHELL",       name: "Shell Specialist",    icon: "🐚" },
  { language: "HTML",        key: "LANG_HTML",        name: "HTML Specialist",     icon: "🌐" },
  { language: "CSS",         key: "LANG_CSS",         name: "CSS Specialist",      icon: "🎨" },
  { language: "Dart",        key: "LANG_DART",        name: "Dart Specialist",     icon: "🎯" },
  { language: "Lua",         key: "LANG_LUA",         name: "Lua Specialist",      icon: "🌙" },
];

const LANG_REPO_THRESHOLD = 5;

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

  // Language Specialist Badges (auto-generated)
  ...LANGUAGE_BADGES.map(lb => ({
    key: lb.key,
    name: lb.name,
    description: `Have ${LANG_REPO_THRESHOLD}+ ${lb.language} repos`,
    icon: lb.icon,
    category: "language" as const,
  })),
];

export function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find(a => a.key === key);
}

import axios from "axios";

export interface Character {
  username: string;
  avatar: string;
  class: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    mana: number;
    critRate: number;
  };
  metadata: {
    totalCommits: number;
    totalStars: number;
    followers: number;
    publicRepos: number;
    yearsActive: number;
    topLanguage: string;
    contributionStreak: number;
    mergedPRs: number;
    codeReviews: number;
    organizations: number;
  };
}

interface GitHubUserData {
  login: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface GitHubRepoData {
  name: string;
  stargazers_count: number;
  language: string;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface GitHubCommitActivity {
  total: number;
  weeks: Array<{
    w: number;
    a: number;
    d: number;
    c: number;
  }>;
}

export async function getCharacterProfile(username: string): Promise<Character | null> {
  try {
    const [userResponse, reposResponse, contributionResponse] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`),
      axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
      axios.get(`https://api.github.com/repos/${username}/${username}/stats/commit_activity`).catch(() => null)
    ]);

    const userData: GitHubUserData = userResponse.data;
    const reposData: GitHubRepoData[] = reposResponse.data;
    const contributionData: GitHubCommitActivity | null = contributionResponse?.data;

    // Calculate enhanced metadata
    const metadata = await calculateMetadata(userData, reposData, contributionData, username);
    
    // Determine character class based on repositories and activity
    const characterClass = determineCharacterClass(metadata, reposData);
    
    // Calculate enhanced stats using PRD formulas
    const stats = calculateEnhancedStats(metadata, characterClass);

    return {
      username: userData.login,
      avatar: userData.avatar_url,
      class: characterClass,
      stats,
      metadata,
    };
  } catch (error) {
    console.error("Error fetching GitHub profile:", error);
    return null;
  }
}

async function calculateMetadata(
  userData: GitHubUserData,
  reposData: GitHubRepoData[],
  contributionData: GitHubCommitActivity | null,
  _username: string
) {
  // Calculate years active
  const createdDate = new Date(userData.created_at);
  const yearsActive = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));

  // Calculate total stars across all repos
  const totalStars = reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  // Find top language
  const languageCounts: { [key: string]: number } = {};
  reposData.forEach(repo => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });
  const topLanguage = Object.keys(languageCounts).reduce((a, b) => 
    languageCounts[a] > languageCounts[b] ? a : b, 'JavaScript'
  );

  // Calculate total commits from contribution activity
  const totalCommits = contributionData?.total || Math.floor(userData.public_repos * 15 + Math.random() * 50);

  // Calculate current contribution streak (simplified - last 4 weeks of activity)
  let contributionStreak = 0;
  if (contributionData?.weeks) {
    const recentWeeks = contributionData.weeks.slice(-8); // Last 8 weeks
    for (let i = recentWeeks.length - 1; i >= 0; i--) {
      if (recentWeeks[i].c > 0) {
        contributionStreak += recentWeeks[i].c;
      } else {
        break;
      }
    }
  }

  // Estimate merged PRs and code reviews
  const mergedPRs = Math.floor(totalCommits * 0.1 + totalStars * 0.2);
  const codeReviews = Math.floor(userData.followers * 0.3 + userData.public_repos * 0.5);

  // Get organization count
  const organizations = Math.floor(userData.followers / 10) + Math.floor(Math.random() * 3);

  return {
    totalCommits,
    totalStars,
    followers: userData.followers,
    publicRepos: userData.public_repos,
    yearsActive,
    topLanguage,
    contributionStreak,
    mergedPRs,
    codeReviews,
    organizations,
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function determineCharacterClass(metadata: any, reposData: GitHubRepoData[]): string {
  // Enhanced class determination based on repository languages and activity
  const { totalStars, publicRepos, mergedPRs, topLanguage } = metadata;

  // Count language types in repositories
  const frontendLanguages = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'React', 'Angular'];
  const backendLanguages = ['Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP'];
  const devopsLanguages = ['Shell', 'Dockerfile', 'Makefile', 'YAML'];

  const languageStats = reposData.reduce((stats, repo) => {
    if (frontendLanguages.includes(repo.language)) stats.frontend++;
    if (backendLanguages.includes(repo.language)) stats.backend++;
    if (devopsLanguages.includes(repo.language)) stats.devops++;
    return stats;
  }, { frontend: 0, backend: 0, devops: 0 });

  const totalLanguageRepos = languageStats.frontend + languageStats.backend + languageStats.devops;
  
  // Advanced class determination logic
  if (totalStars > 500 && publicRepos > 50 && mergedPRs > 100) {
    return "Open Source Legend";
  } else if (languageStats.frontend > languageStats.backend && languageStats.frontend > languageStats.devops) {
    return "Frontend Warrior";
  } else if (languageStats.backend > languageStats.frontend && languageStats.backend > languageStats.devops) {
    return "Backend Mage";
  } else if (languageStats.devops > 3 || topLanguage === 'Shell') {
    return "DevOps Paladin";
  } else if (totalLanguageRepos > 10 && Math.abs(languageStats.frontend - languageStats.backend) <= 2) {
    return "Full Stack Sorcerer";
  } else {
    return "Code Apprentice";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateEnhancedStats(metadata: any, characterClass: string) {
  const {
    totalCommits,
    totalStars,
    followers,
    yearsActive,
    contributionStreak,
    mergedPRs,
    codeReviews,
    organizations
  } = metadata;

  // Scaled stat calculation
  let hp = Math.min(500, totalCommits * 0.5 + (yearsActive * 20));
  let attack = Math.floor(totalStars / 10) + (getLanguageBonus(characterClass) * 5);
  let defense = Math.floor(followers / 5) + (organizations * 10);
  let speed = (totalCommits / (yearsActive * 365)) * 20 + (contributionStreak * 2);
  let mana = Math.min(150, mergedPRs * 3 + Math.floor(totalCommits / 10));
  const critRate = Math.min(0.5, codeReviews / 100);

  // Class-specific bonuses (enhanced)
  switch (characterClass) {
    case "Frontend Warrior":
      speed += 15;
      attack += 5;
      break;
    case "Backend Mage":
      attack += 15;
      mana += 10;
      break;
    case "DevOps Paladin":
      defense += 15;
      hp += 30;
      break;
    case "Full Stack Sorcerer":
      speed += 5;
      attack += 5;
      defense += 5;
      mana += 5;
      break;
    case "Open Source Legend":
      hp += 50;
      attack += 10;
      speed += 10;
      mana += 15;
      break;
    case "Code Apprentice":
    default:
      break;
  }

  hp = Math.min(600, Math.max(200, Math.floor(hp)));
  attack = Math.max(10, Math.floor(attack));
  defense = Math.max(5, Math.floor(defense));
  speed = Math.max(10, Math.floor(speed));
  mana = Math.max(10, Math.floor(mana));

  return {
    hp,
    attack,
    defense,
    speed,
    mana,
    critRate: Math.round(critRate * 100) / 100,
  };
}

function getLanguageBonus(characterClass: string): number {
  switch (characterClass) {
    case "Frontend Warrior": return 3;
    case "Backend Mage": return 4;
    case "DevOps Paladin": return 2;
    case "Full Stack Sorcerer": return 3;
    case "Open Source Legend": return 5;
    default: return 1;
  }
}

// Utility function to get detailed character info for display
export function getCharacterDetails(character: Character) {
  return {
    classDescription: getClassDescription(character.class),
    specialAbility: getSpecialAbility(character.class),
    strengths: getClassStrengths(character.class),
    gitHubInsights: formatGitHubInsights(character.metadata),
  };
}

function getClassDescription(characterClass: string): string {
  const descriptions: { [key: string]: string } = {
    "Frontend Warrior": "Masters of user interfaces, wielding HTML, CSS, and JavaScript with deadly precision.",
    "Backend Mage": "Conjures powerful server-side spells and database magic from the shadows.",
    "DevOps Paladin": "Guardian of infrastructure, protecting systems with containers and pipelines.",
    "Full Stack Sorcerer": "Jack of all trades, weaving spells across the entire technology stack.",
    "Open Source Legend": "Legendary contributor whose code echoes across countless repositories.",
    "Code Apprentice": "Just beginning their journey, but showing great potential.",
  };
  return descriptions[characterClass] || descriptions["Code Apprentice"];
}

function getSpecialAbility(characterClass: string): string {
  const abilities: { [key: string]: string } = {
    "Frontend Warrior": "Pixel Slash - Delivers rapid double strikes with UI precision",
    "Backend Mage": "Server Storm - Massive damage with system recoil",
    "DevOps Paladin": "Container Shield - Damages opponent while healing self",
    "Full Stack Sorcerer": "Code Fusion - Balanced attack with multiple effects",
    "Open Source Legend": "Community Strike - Damage scales with contribution history",
    "Code Apprentice": "Debug Burst - Simple but effective debugging attack",
  };
  return abilities[characterClass] || abilities["Code Apprentice"];
}

function getClassStrengths(characterClass: string): string[] {
  const strengths: { [key: string]: string[] } = {
    "Frontend Warrior": ["High Speed", "Critical Hit Bonus", "UI Mastery"],
    "Backend Mage": ["Massive Attack", "High Mana", "System Knowledge"],
    "DevOps Paladin": ["Strong Defense", "High HP", "Infrastructure Skills"],
    "Full Stack Sorcerer": ["Balanced Stats", "Versatile Skills", "Adaptability"],
    "Open Source Legend": ["All-around Excellence", "Community Power", "Legendary Status"],
    "Code Apprentice": ["Growth Potential", "Eager to Learn", "Fresh Perspective"],
  };
  return strengths[characterClass] || strengths["Code Apprentice"];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatGitHubInsights(metadata: any): string {
  const { totalCommits, totalStars, followers, topLanguage, yearsActive } = metadata;
  return `${totalCommits.toLocaleString()} commits • ${totalStars} stars • ${followers} followers • ${topLanguage} expert • ${yearsActive} years active`;
}
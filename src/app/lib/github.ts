import { Octokit } from "@octokit/rest";

// Github setup client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Define Character
export interface Character {
  username: string;
  avatar: string;
  level: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  class: string;
}

// Fetch user data and Calculate Stats
export async function getCharacterProfile(username: string): Promise<Character | null> {
  try {
    const { data: profile } = await octokit.users.getByUsername({ username });
    const { data: repos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      sort: "updated",
    });

    // Calculate RPG Stats
    
    // Attack = Total Stars
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    
    // Defense = Followers
    const defense = profile.followers;

    // HP = Public Repos * 10
    const hp = (profile.public_repos * 10) + 100;

    // Speed = Account Age (Older accounts = more experience)
    const accountCreated = new Date(profile.created_at);
    const yearsActive = new Date().getFullYear() - accountCreated.getFullYear();
    const speed = 10 + (yearsActive * 2);

    // Count which language appears most in their repos
    const languages: Record<string, number> = {};
    repos.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }
    });
    
    // Find top language
    let topLanguage = "Beginner";
    let maxCount = 0;
    for (const [lang, count] of Object.entries(languages)) {
      if (count > maxCount) {
        maxCount = count;
        topLanguage = lang;
      }
    }

    // Map language to Class Name
    let characterClass = "Novice Adventurer";
    if (["JavaScript", "TypeScript", "CSS", "HTML"].includes(topLanguage)) characterClass = "Frontend Warrior";
    if (["Python", "Java", "Go", "Rust"].includes(topLanguage)) characterClass = "Backend Mage";
    if (["Shell", "Dockerfile"].includes(topLanguage)) characterClass = "DevOps Paladin";

    return {
      username: profile.login,
      avatar: profile.avatar_url,
      level: Math.floor(totalStars / 5) + 1, // Level up every 5 stars
      stats: {
        hp,
        attack: totalStars || 1, // Minimum 1 attack
        defense: defense || 1,
        speed,
      },
      class: characterClass,
    };

  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return null;
  }
}
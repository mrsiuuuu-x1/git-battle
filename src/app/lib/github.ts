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
  };
}

export async function getCharacterProfile(username: string): Promise<Character | null> {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`);
    const data = response.data;

    // --- 1. DETERMINE CLASS ---
    let userClass = "Novice Adventurer";
    const repos = data.public_repos;
    const followers = data.followers;

    if (repos > 50) userClass = "Full Stack Sorcerer"; 
    else if (followers > 50) userClass = "DevOps Paladin"; 
    else if (repos > 20) userClass = "Backend Mage"; 
    else if (repos > 10) userClass = "Frontend Warrior";

    // --- 2. CALCULATE STATS (Deterministic / No Randomness) ---
    // We use 'let' so we can add Class Bonuses below
    
    // HP: Base 100 + (Repos * 3) + Followers
    let hp = 100 + (repos * 3) + (followers * 1);

    // ATTACK: Base 10 + (Repos / 2)
    let attack = 10 + Math.floor(repos / 2);

    // DEFENSE: Base 5 + (Followers / 2)
    let defense = 5 + Math.floor(followers / 2);

    // SPEED: Base 10 + (Repos / 5)
    let speed = 10 + Math.floor(repos / 5);

    // --- 3. CLASS BONUSES ---
    if (userClass === "Frontend Warrior") speed += 15; // Fast
    if (userClass === "DevOps Paladin") defense += 10; // Tanky
    if (userClass === "Backend Mage") attack += 15; // Strong
    if (userClass === "Full Stack Sorcerer") { // Jack of all trades
        speed += 5;
        attack += 5;
    }

    return {
      username: data.login,
      avatar: data.avatar_url,
      class: userClass,
      stats: {
        hp,
        attack,
        defense,
        speed,
      },
    };
  } catch (error) {
    console.error("Error fetching GitHub profile:", error);
    return null;
  }
}
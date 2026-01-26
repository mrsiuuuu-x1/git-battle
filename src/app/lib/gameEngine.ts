import { PixelShield, PixelSword } from "../components/PixelIcons";
import { Character } from "./github";

export interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  opponentHp: number;
  opponentMaxHp: number;
  playerHealsUsed: number;
  playerHealCd: number;
  opponentHealCd: number;
  logs: string[];
  winner: "player" | "opponent" | null;
  isPlayerTurn: boolean;
}

export function initializeBattle(player: Character, opponent: Character): BattleState {
  return {
    playerHp: player.stats.hp,
    playerMaxHp: player.stats.hp,
    opponentHp: opponent.stats.hp,
    opponentMaxHp: opponent.stats.hp,
    playerHealsUsed: 0,
    playerHealCd: 0,
    opponentHealCd: 0,
    logs: ["Battle Started!", `${player.username} (${player.class}) VS ${opponent.username} (${opponent.class})`],
    winner: null,
    isPlayerTurn: player.stats.speed >= opponent.stats.speed,
  };
}

// Helper: Calculate raw damage for a single hit
function getHitDamage(attacker: Character, defender: Character, multiplier: number = 1.0) {
  let damage = (attacker.stats.attack * 3) + 10;
  
  // Defense Mitigation
  const maxBlock = damage * 0.40;
  const actualBlock = Math.min(defender.stats.defense,maxBlock);
  damage = damage - actualBlock;

  // Variance (0.85x to 1.15x)
  const variance = (Math.random() * 0.2) + 0.9;
  damage = Math.floor(damage * variance);

  // Apply ability Multiplier
  damage = Math.floor(damage * multiplier);
  damage = Math.max(5, damage);

  // Critical Hit Logicc
  let critChance = 0.05; 
  if (attacker.stats.speed > defender.stats.speed) {
    critChance += ((attacker.stats.speed - defender.stats.speed) * 0.01);
  }
  critChance = Math.min(critChance, 0.50);

  let isCrit = false;
  if (Math.random() < critChance) {
    isCrit = true;
    damage = Math.floor(damage * 1.5);
  }

  return { damage, isCrit };
}

export function performPlayerTurn(state: BattleState, player: Character, opponent: Character, action: "attack" | "heal"): BattleState {
  const newState = { ...state };

  if (action === "heal") {
    const healAmount = Math.floor(player.stats.hp * 0.4);
    newState.playerHp = Math.min(newState.playerMaxHp, newState.playerHp + healAmount);
    newState.playerHealsUsed += 1;
    newState.playerHealCd = 3;
    newState.logs = [...newState.logs, `You used Merge Shield! +${healAmount} HP.`];
  } else {
    // class ability logic
    const userClass = player.class;

    if (userClass === "Frontend Warrior") {
      // ABILITY: PIXEL SLASH (Double Hit with 60% dmg on each hit)
      const hit1 = getHitDamage(player, opponent, 0.6);
      const hit2 = getHitDamage(player, opponent, 0.6);
      const totalDmg = hit1.damage + hit2.damage;
      
      newState.opponentHp = Math.max(0, newState.opponentHp - totalDmg);
      
      newState.logs = [
        ...newState.logs, 
        `PIXEL SLASH!`,
        `Hit 1: ${hit1.damage} DMG${hit1.isCrit ? " (CRIT!)" : ""}`,
        `Hit 2: ${hit2.damage} DMG${hit2.isCrit ? " (CRIT!)" : ""}`
      ];

    } else if (userClass === "Backend Mage") {
      // ABILITY: DDOS BLAST (1.5x Dmg with Self Dmg)
      const hit = getHitDamage(player, opponent, 1.5);
      const recoil = Math.floor(player.stats.hp * 0.10); // 10% Recoil

      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.playerHp = Math.max(0, newState.playerHp - recoil);

      newState.logs = [
        ...newState.logs, 
        `DDOS BLAST! 💥 ${hit.damage} DMG${hit.isCrit ? " (CRIT!)" : ""}`,
        `Server Overload! You took ${recoil} recoil damage.`
      ];

    } else if (userClass === "DevOps Paladin") {
      // ABILITY: CONTAINER SHIELD (1.0x Dmg, Heal 10)
      const hit = getHitDamage(player, opponent, 1.0);
      const heal = 10;

      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.playerHp = Math.min(newState.playerMaxHp, newState.playerHp + heal);

      newState.logs = [
        ...newState.logs, 
        `CONTAINER SHIELD! ${hit.damage} DMG${hit.isCrit ? " (CRIT!)" : ""}`,
        `You repaired ${heal} HP.`
      ];

    } else {
      // default damage
      const hit = getHitDamage(player, opponent, 1.0);
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.logs = [...newState.logs, `GIT PUSH! ${hit.damage} DMG${hit.isCrit ? " (CRIT!)" : ""}`];
    }
  }

  // victory check
  if (newState.opponentHp <= 0) {
    newState.winner = "player";
    newState.logs.push("🏆 YOU WON!");
    return newState;
  }
  
  // Self-KO Check 
  if (newState.playerHp <= 0) {
    newState.winner = "opponent";
    newState.logs.push("💀 YOU KNOCKED YOURSELF OUT...");
    return newState;
  }

  newState.isPlayerTurn = false;
  return newState;
}

export function performOpponentTurn(state: BattleState, player: Character, opponent: Character): BattleState {
  const newState = { ...state };

  if (newState.playerHealCd > 0) newState.playerHealCd -= 1;
  if (newState.opponentHealCd > 0) newState.opponentHealCd -= 1;

  // Simple AI logic
  const hpPercent = newState.opponentHp / newState.opponentMaxHp;
  let shouldHeal = false;

  if (newState.opponentHealCd === 0) {
     if (hpPercent < 0.25) shouldHeal = Math.random() < 0.80; // Panic
     else if (hpPercent < 0.50) shouldHeal = Math.random() < 0.30; // Cautious
  }

  if (shouldHeal) {
    const healAmount = Math.floor(opponent.stats.hp * 0.3);
    newState.opponentHp = Math.min(newState.opponentMaxHp, newState.opponentHp + healAmount);
    newState.opponentHealCd = 4;
    newState.logs = [...newState.logs, `${opponent.username} patches themselves up! +${healAmount} HP.`];
  } else {
    // AI ABILITIES (Mirroring Player Logic)
    const aiClass = opponent.class;

    if (aiClass === "Frontend Warrior") {
      const hit1 = getHitDamage(opponent, player, 0.6);
      const hit2 = getHitDamage(opponent, player, 0.6);
      const totalDmg = hit1.damage + hit2.damage;
      newState.playerHp = Math.max(0, newState.playerHp - totalDmg);
      newState.logs = [...newState.logs, `${opponent.username} uses PIXEL SLASH!`, `Hit 1: ${hit1.damage}`, `Hit 2: ${hit2.damage}`];

    } else if (aiClass === "Backend Mage") {
      const hit = getHitDamage(opponent, player, 1.5);
      const recoil = Math.floor(opponent.stats.hp * 0.10);
      newState.playerHp = Math.max(0, newState.playerHp - hit.damage);
      newState.opponentHp = Math.max(0, newState.opponentHp - recoil);
      newState.logs = [...newState.logs, `${opponent.username} uses DDOS BLAST! 💥 ${hit.damage} DMG`, `They took ${recoil} recoil.`];

    } else if (aiClass === "DevOps Paladin") {
      const hit = getHitDamage(opponent, player, 1.0);
      const heal = 10;
      newState.playerHp = Math.max(0, newState.playerHp - hit.damage);
      newState.opponentHp = Math.min(newState.opponentMaxHp, newState.opponentHp + heal);
      newState.logs = [...newState.logs, `${opponent.username} uses CONTAINER SHIELD! 🛡️ ${hit.damage} DMG`, `They healed ${heal} HP.`];

    } else {
      // Default (Novice/Other)
      const hit = getHitDamage(opponent, player, 1.0);
      newState.playerHp = Math.max(0, newState.playerHp - hit.damage);
      newState.logs = [...newState.logs, `${opponent.username} hits you for ${hit.damage} DMG!${hit.isCrit ? " CRIT!" : ""}`];
    }
  }

  if (newState.playerHp <= 0) {
    newState.winner = "opponent";
    newState.logs.push("💀 YOU LOST...");
    return newState;
  }

  newState.isPlayerTurn = true;
  return newState;
}
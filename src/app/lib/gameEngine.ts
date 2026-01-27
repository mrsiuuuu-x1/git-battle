import { Character } from "./github";

export interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  opponentHp: number;
  opponentMaxHp: number;
  playerHealsUsed: number;
  playerHealCd: number;
  playerSpecialCd: number;
  opponentHealCd: number;
  opponentSpecialCd: number;
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
    playerSpecialCd: 0,
    opponentHealCd: 0,
    opponentSpecialCd: 0,
    logs: ["Battle Started!", `${player.username} (${player.class}) VS ${opponent.username} (${opponent.class})`],
    winner: null,
    isPlayerTurn: player.stats.speed >= opponent.stats.speed,
  };
}

function getHitDamage(attacker: Character, defender: Character, multiplier: number = 1.0) {
  // NERFED DAMAGE FORMULA 
  let damage = (attacker.stats.attack * 1.8) + 5;
  
  const maxBlock = damage * 0.40;
  const actualBlock = Math.min(defender.stats.defense, maxBlock);
  damage = damage - actualBlock;

  const variance = (Math.random() * 0.2) + 0.9;
  damage = Math.floor(damage * variance);
  damage = Math.floor(damage * multiplier);
  damage = Math.max(5, damage); 

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

// player turn
export function performPlayerTurn(state: BattleState, player: Character, opponent: Character, action: "attack" | "heal" | "special"): BattleState {
  const newState = { ...state };

  if (action === "heal") {
    if (state.playerHealsUsed >= 3) {
      return state;
    }
    const healAmount = Math.floor(player.stats.hp * 0.4);
    newState.playerHp = Math.min(newState.playerMaxHp, newState.playerHp + healAmount);
    newState.playerHealsUsed += 1;
    newState.playerHealCd = 3;
    newState.logs = [...newState.logs, `You used Merge Shield! +${healAmount} HP.`];
  } 
  
  else if (action === "special") {
    const userClass = player.class;
    newState.playerSpecialCd = 3; 

    if (userClass === "Frontend Warrior") {
      const hit1 = getHitDamage(player, opponent, 0.6);
      const hit2 = getHitDamage(player, opponent, 0.6);
      const totalDmg = hit1.damage + hit2.damage;
      newState.opponentHp = Math.max(0, newState.opponentHp - totalDmg);
      newState.logs = [...newState.logs, `PIXEL SLASH! ⚔️`, `Hit 1: ${hit1.damage}`, `Hit 2: ${hit2.damage}`];

    } else if (userClass === "Backend Mage") {
      const hit = getHitDamage(player, opponent, 1.5);
      const recoil = Math.floor(player.stats.hp * 0.10);
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.playerHp = Math.max(0, newState.playerHp - recoil);
      newState.logs = [...newState.logs, `DDOS BLAST! 💥 ${hit.damage} DMG`, `You took ${recoil} recoil.`];

    } else if (userClass === "DevOps Paladin") {
      const hit = getHitDamage(player, opponent, 1.0);
      const heal = 10;
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.playerHp = Math.min(newState.playerMaxHp, newState.playerHp + heal);
      newState.logs = [...newState.logs, `CONTAINER SHIELD! 🛡️ ${hit.damage} DMG`, `You healed ${heal} HP.`];

    } else {
      const hit = getHitDamage(player, opponent, 1.2);
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.logs = [...newState.logs, `HELLO WORLD SMASH! ${hit.damage} DMG${hit.isCrit ? " CRIT!" : ""}`];
    }
  } 
  
  else {
    const hit = getHitDamage(player, opponent, 1.0);
    newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
    newState.logs = [...newState.logs, `You hit ${opponent.username} for ${hit.damage} DMG!${hit.isCrit ? " CRIT!" : ""}`];
  }

  if (newState.opponentHp <= 0) {
    newState.winner = "player";
    newState.logs.push("🏆 YOU WON!");
    return newState;
  }
  if (newState.playerHp <= 0) {
    newState.winner = "opponent";
    newState.logs.push("💀 YOU KNOCKED YOURSELF OUT...");
    return newState;
  }

  newState.isPlayerTurn = false;
  return newState;
}

// AI turn
export function performOpponentTurn(state: BattleState, player: Character, opponent: Character): BattleState {
  const newState = { ...state };

  // Tick down ALL cooldowns
  if (newState.playerHealCd > 0) newState.playerHealCd -= 1;
  if (newState.playerSpecialCd > 0) newState.playerSpecialCd -= 1;
  if (newState.opponentHealCd > 0) newState.opponentHealCd -= 1;
  if (newState.opponentSpecialCd > 0) newState.opponentSpecialCd -= 1;

  const hpPercent = newState.opponentHp / newState.opponentMaxHp;
  let shouldHeal = false;

  if (newState.opponentHealCd === 0) {
     if (hpPercent < 0.25) shouldHeal = Math.random() < 0.80; 
     else if (hpPercent < 0.50) shouldHeal = Math.random() < 0.30;
  }

  // AI DECISION MAKING
  if (shouldHeal) {
    const healAmount = Math.floor(newState.opponentMaxHp * 0.3);
    newState.opponentHp = Math.min(newState.opponentMaxHp, newState.opponentHp + healAmount);
    newState.opponentHealCd = 4; 
    newState.logs = [...newState.logs, `${opponent.username} patches themselves up! +${healAmount} HP.`];
  } else {
    // Check if AI can use Special
    const canUseSpecial = newState.opponentSpecialCd === 0 && Math.random() < 0.5;

    if (canUseSpecial) {
        newState.opponentSpecialCd = 3;
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
            // Default Special
            const hit = getHitDamage(opponent, player, 1.2);
            newState.playerHp = Math.max(0, newState.playerHp - hit.damage);
            newState.logs = [...newState.logs, `${opponent.username} uses SUPER SMASH! ${hit.damage} DMG`];
        }
    } else {
        // Standard Attack
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
  if (newState.opponentHp <= 0) {
    newState.winner = "player";
    newState.logs.push("🏆 ENEMY KNOCKED THEMSELVES OUT!");
    return newState;
  }

  newState.isPlayerTurn = true;
  return newState;
}
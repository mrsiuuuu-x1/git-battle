import { Character } from "./github";

export interface BattleState {
  playerHp: number;
  playerMaxHp: number;
  playerMana: number;
  playerMaxMana: number;
  opponentHp: number;
  opponentMaxHp: number;
  opponentMana: number;
  opponentMaxMana: number;
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
    playerMana: player.stats.mana,
    playerMaxMana: player.stats.mana,
    opponentHp: opponent.stats.hp,
    opponentMaxHp: opponent.stats.hp,
    opponentMana: opponent.stats.mana,
    opponentMaxMana: opponent.stats.mana,
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

const MANA_COST_SPECIAL = 25;
const MANA_COST_HEAL = 15;

function canAffordAction(currentMana: number, action: "special" | "heal"): boolean {
  return currentMana >= (action === "special" ? MANA_COST_SPECIAL : MANA_COST_HEAL);
}

function getHitDamage(attacker: Character, defender: Character, multiplier: number = 1.0): { damage: number; isCrit: boolean } {
  let damage = (attacker.stats.attack * 1.8) + 5;

  const maxBlock = damage * 0.40;
  const actualBlock = Math.min(defender.stats.defense, maxBlock);
  damage = damage - actualBlock;

  const variance = (Math.random() * 0.2) + 0.9;
  damage = Math.floor(damage * variance);
  damage = Math.floor(damage * multiplier);
  damage = Math.max(5, damage);

  let critChance = attacker.stats.critRate || 0.05;
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
export function performPlayerTurn(
  state: BattleState,
  player: Character,
  opponent: Character,
  action: "attack" | "heal" | "special"
): BattleState {
  const newState = { ...state };

  if (action === "heal") {
    if (state.playerHealsUsed >= 3 || !canAffordAction(state.playerMana, "heal")) {
      return state;
    }
    const healAmount = Math.floor(player.stats.hp * 0.4);
    newState.playerHp = Math.min(newState.playerMaxHp, newState.playerHp + healAmount);
    newState.playerMana = Math.max(0, newState.playerMana - MANA_COST_HEAL);
    newState.playerHealsUsed += 1;
    newState.playerHealCd = 3;
    newState.logs = [...newState.logs, `You used Merge Shield! +${healAmount} HP (${MANA_COST_HEAL}⚡ mana)`];
  }

  else if (action === "special") {
    if (!canAffordAction(state.playerMana, "special")) {
      newState.logs = [...newState.logs, "Not enough mana for special ability!"];
      return newState;
    }

    const userClass = player.class;
    newState.playerSpecialCd = 3;
    newState.playerMana = Math.max(0, newState.playerMana - MANA_COST_SPECIAL);

    if (userClass === "Frontend Warrior") {
      const hit1 = getHitDamage(player, opponent, 0.6);
      const hit2 = getHitDamage(player, opponent, 0.6);
      const totalDmg = hit1.damage + hit2.damage;
      newState.opponentHp = Math.max(0, newState.opponentHp - totalDmg);
      newState.logs = [...newState.logs, `PIXEL SLASH! ⚔️ (${MANA_COST_SPECIAL}⚡)`, `Hit 1: ${hit1.damage}`, `Hit 2: ${hit2.damage}`];

    } else if (userClass === "Backend Mage") {
      const hit = getHitDamage(player, opponent, 1.5);
      const recoil = Math.floor(player.stats.hp * 0.10);
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.playerHp = Math.max(0, newState.playerHp - recoil);
      newState.logs = [...newState.logs, `DDOS BLAST! 💥 ${hit.damage} DMG (${MANA_COST_SPECIAL}⚡)`, `You took ${recoil} recoil.`];

    } else if (userClass === "DevOps Paladin") {
      const hit = getHitDamage(player, opponent, 1.0);
      const heal = 10;
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.playerHp = Math.min(newState.playerMaxHp, newState.playerHp + heal);
      newState.logs = [...newState.logs, `CONTAINER SHIELD! 🛡️ ${hit.damage} DMG (${MANA_COST_SPECIAL}⚡)`, `You healed ${heal} HP.`];

    } else if (userClass === "Full-Stack Samurai") {
      const hit = getHitDamage(player, opponent, 1.3);
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.playerMana = Math.min(newState.playerMaxMana, newState.playerMana + 10);
      newState.logs = [...newState.logs, `CODE FUSION! 🔮 ${hit.damage} DMG + 10 mana restored (${MANA_COST_SPECIAL}⚡)`];

    } else if (userClass === "Open-Source Wizard") {
      const communityMultiplier = 1.5 + (player.metadata?.totalStars || 0) / 1000;
      const hit = getHitDamage(player, opponent, communityMultiplier);
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.logs = [...newState.logs, `COMMUNITY STRIKE! 🌟 ${hit.damage} legendary DMG (${MANA_COST_SPECIAL}⚡)`];

    } else {
      const hit = getHitDamage(player, opponent, 1.2);
      newState.opponentHp = Math.max(0, newState.opponentHp - hit.damage);
      newState.logs = [...newState.logs, `HELLO WORLD SMASH! ${hit.damage} DMG${hit.isCrit ? " CRIT!" : ""} (${MANA_COST_SPECIAL}⚡)`];
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

  // Tick down cooldowns
  if (newState.playerHealCd > 0) newState.playerHealCd -= 1;
  if (newState.playerSpecialCd > 0) newState.playerSpecialCd -= 1;
  if (newState.opponentHealCd > 0) newState.opponentHealCd -= 1;
  if (newState.opponentSpecialCd > 0) newState.opponentSpecialCd -= 1;

  // Mana regeneration each turn
  newState.playerMana = Math.min(newState.playerMaxMana, newState.playerMana + 5);
  newState.opponentMana = Math.min(newState.opponentMaxMana, newState.opponentMana + 5);

  const hpPercent = newState.opponentHp / newState.opponentMaxHp;
  const manaPercent = newState.opponentMana / newState.opponentMaxMana;

  let shouldHeal = false;
  let shouldUseSpecial = false;

  if (newState.opponentHealCd === 0 && canAffordAction(newState.opponentMana, "heal")) {
    if (hpPercent < 0.25) shouldHeal = Math.random() < 0.80;
    else if (hpPercent < 0.50) shouldHeal = Math.random() < 0.30;
  }

  if (!shouldHeal && newState.opponentSpecialCd === 0 && canAffordAction(newState.opponentMana, "special")) {
    if (manaPercent > 0.6) shouldUseSpecial = Math.random() < 0.5;
    else if (hpPercent < 0.3) shouldUseSpecial = Math.random() < 0.7;
  }

  if (shouldHeal) {
    const healAmount = Math.floor(newState.opponentMaxHp * 0.3);
    newState.opponentHp = Math.min(newState.opponentMaxHp, newState.opponentHp + healAmount);
    newState.opponentMana = Math.max(0, newState.opponentMana - MANA_COST_HEAL);
    newState.opponentHealCd = 4;
    newState.logs = [...newState.logs, `${opponent.username} patches themselves up! +${healAmount} HP.`];

  } else if (shouldUseSpecial) {
    newState.opponentSpecialCd = 3;
    newState.opponentMana = Math.max(0, newState.opponentMana - MANA_COST_SPECIAL);

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
      newState.logs = [...newState.logs, `${opponent.username} uses CONTAINER SHIELD! 🛡️ ${hit.damage} DMG`];

    } else {
      const hit = getHitDamage(opponent, player, 1.2);
      newState.playerHp = Math.max(0, newState.playerHp - hit.damage);
      newState.logs = [...newState.logs, `${opponent.username} uses SUPER SMASH! ${hit.damage} DMG`];
    }

  } else {
    const hit = getHitDamage(opponent, player, 1.0);
    newState.playerHp = Math.max(0, newState.playerHp - hit.damage);
    newState.logs = [...newState.logs, `${opponent.username} hits you for ${hit.damage} DMG!${hit.isCrit ? " CRIT!" : ""}`];
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

export function getManaBarColor(currentMana: number, maxMana: number): string {
  const percentage = currentMana / maxMana;
  if (percentage > 0.6) return 'linear-gradient(90deg, #4f46e5, #7c3aed)';
  if (percentage > 0.3) return 'linear-gradient(90deg, #7c3aed, #db2777)';
  return 'linear-gradient(90deg, #db2777, #dc2626)';
}

export function canUseAbility(state: BattleState, ability: "special" | "heal"): boolean {
  switch (ability) {
    case "special":
      return state.playerSpecialCd === 0 && canAffordAction(state.playerMana, "special");
    case "heal":
      return state.playerHealCd === 0 && state.playerHealsUsed < 3 && canAffordAction(state.playerMana, "heal");
    default:
      return false;
  }
}

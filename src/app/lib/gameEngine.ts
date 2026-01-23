import { Character } from "./github";
export interface BattleState {
    playerHp: number;
    playerMaxHp: number;
    opponentHp: number;
    opponentMaxHp: number;
    logs: string[];
    winner: string | null;
    turn: number;
    isPlayerTurn: boolean;
    //Cooldown timers
    playerHealCd: number;
    opponentHealCd: number;
    // track num of heals used
    playerHealsUsed: number;
    opponentHealsUsed: number;
}

// Cooldown amount
const HEAL_COOLDOWN_TURNS = 3;
const MAX_HEALS = 3;

// The Nerfing Algorithm
function normalizeStat(value: number): number {
    if (value <= 0) return 1;
    return Math.floor(Math.log10(value + 1) * 20) + 5;
}

// Feature: Class Bonus Calculator(buffs/powerups)
function getEffectiveStats(char: Character) {
    let atk = normalizeStat(char.stats.attack);
    let def = normalizeStat(char.stats.defense);
    let spd = normalizeStat(char.stats.speed);

    if (char.class === "Frontend Warrior") {
        spd = Math.floor(spd * 1.25);       // +25% speed
    } else if (char.class === "Backend Mage") {
        atk = Math.floor(atk * 1.25);       // +25% attack
    } else if (char.class === "DevOps Paladin") {
        def = Math.floor(def * 1.25);       // +25% defense
    }

    return { atk, def, spd};
}

export function initializeBattle(player: Character, opponent: Character): BattleState {
    const pMax = normalizeStat(player.stats.hp) * 10;
    const oMax = normalizeStat(opponent.stats.hp) * 10;

    //Decides who goes first based on speed
    const pStats = getEffectiveStats(player);
    const oStats = getEffectiveStats(opponent);
    const playerGoesFirst = pStats.spd >= oStats.spd;
    
    return {
        playerHp: pMax,
        playerMaxHp: pMax,
        opponentHp: oMax,
        opponentMaxHp: oMax,
        logs: [
            `Battle Started!`,
            `${player.username} (${player.class}) VS ${opponent.username} (${opponent.class})`,
            playerGoesFirst ? "You are faster! You go first." : "Opponent is faster! They go first."
        ],
        winner: null,
        turn: 1,
        isPlayerTurn: playerGoesFirst,
        playerHealCd: 0,
        opponentHealCd: 0,
        playerHealsUsed: 0,
        opponentHealsUsed: 0,
    };
}

export function performPlayerTurn(
    state: BattleState,
    player: Character,
    opponent: Character,
    action: "attack" | "heal"
): BattleState {
    if (!state.isPlayerTurn || state.winner) return state;

    const newState = { ...state, logs: [...state.logs] };

    //Get Stats with buffs
    const pStats = getEffectiveStats(player);
    const oStats = getEffectiveStats(opponent);

    if (action === "attack") {
        // Player Attacks
        // Damage Formula: attack * random - (defense * 0.2)
        const pRandom = (Math.random() * 0.4) + 0.8;
        let pDmg = Math.floor((pStats.atk * pRandom) - (oStats.def * 0.1));
        if (pDmg < 1) pDmg = 1;    // Default Damage

        //Critical Hit (based on speed difference)
        if (pStats.spd > oStats.spd && Math.random() > 0.8) {
            pDmg = Math.floor(pDmg * 1.5);   // +50% damage
            newState.logs.push(`CRITICAL HIT! Speed Bonus!`);
        }
    
        newState.opponentHp -= pDmg;
        newState.logs.push(`Turn ${newState.turn}: You used Commit Storm! -${pDmg} HP`);
    } else if (action === "heal") {
        //Heal LOGIC
        // check limit
        if (newState.playerHealsUsed >= MAX_HEALS) {
            newState.logs.push(`No potions left! You cannot heal anymore.`);
            return newState;
        }
        if (newState.playerHealCd > 0) {
            return newState;
        }

        const healAmount = Math.floor(newState.playerMaxHp * 0.30);
        newState.playerHp = Math.min(newState.playerHp + healAmount, newState.playerMaxHp);
        // set cooldown
        newState.playerHealCd = HEAL_COOLDOWN_TURNS;
        newState.playerHealsUsed += 1; //increment usage
        newState.logs.push(`Turn ${newState.turn}: You used Merge Shield! +${healAmount} HP. (${MAX_HEALS - newState.playerHealsUsed} left)`);
    }

    // check if opponent died (VICTORY)
    if (newState.opponentHp <= 0) {
        newState.opponentHp = 0;
        newState.winner = "player";
        newState.logs.push(`VICTORY! You defeated ${opponent.username}!`);
        return newState;
    }

    newState.isPlayerTurn = false;
    return newState;
}

export function performOpponentTurn(
    state: BattleState,
    player: Character,
    opponent: Character
): BattleState {
    if (state.isPlayerTurn || state.winner) return state;

    const newState = { ...state, logs: [...state.logs] };
    newState.playerHealCd = Math.max(0, newState.playerHealCd - 1);
    newState.opponentHealCd = Math.max(0, newState.opponentHealCd - 1);

    const pStats = getEffectiveStats(player);
    const oStats = getEffectiveStats(opponent);

    // AI LOGIC (CHECK IF HP BELOW 40%, heal)
    const isLowHp = newState.opponentHp < (newState.opponentMaxHp * 0.4);
    const isHealReady = newState.opponentHealCd === 0;
    // check limit
    const hasHealsLeft = newState.opponentHealsUsed < MAX_HEALS;
    
    if (isLowHp && isHealReady && hasHealsLeft) {
        const healAmount = Math.floor(newState.opponentMaxHp * 0.30);
        newState.opponentHp = Math.min(newState.opponentHp + healAmount , newState.opponentMaxHp);
        newState.opponentHealCd = HEAL_COOLDOWN_TURNS;
        newState.opponentHealsUsed += 1; // increment usage
        newState.logs.push(`Turn ${newState.turn}: ${opponent.username} used Merge Shield! +${healAmount} HP.`);
    } else {
            // Opponent Attacks (same formula)
            const oRandom = (Math.random() * 0.4) + 0.8;
            let oDmg = Math.floor((oStats.atk * oRandom) - (pStats.def * 0.2));
            if (oDmg < 1) oDmg = 1;   // Default Damage

            //Enemy CRTICIAL DAMAGE
            if (oStats.spd > pStats.spd && Math.random() > 0.8) {
            oDmg = Math.floor(oDmg * 1.5)   // +50% damage buff
            newState.logs.push(`ENEMY CRIT! They are too fast!`);
        }

        newState.playerHp -= oDmg;
        newState.logs.push(`Turn ${state.turn}: ${opponent.username} hits you for ${oDmg} DMG!`);
    }

    //checking if player died (DEFEAT!)
    if (newState.playerHp <= 0) {
        newState.playerHp = 0;
        newState.winner = "opponent";
        newState.logs.push(`💀 DEFEAT! ${opponent.username} crushed you.`);
        return newState;
    }

    newState.isPlayerTurn = true;
    newState.turn += 1;
    return newState;
}
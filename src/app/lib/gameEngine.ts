import { stat } from "fs";
import { Character } from "./github";
export interface BattleState {
    playerHp: number;
    opponentHp: number;
    logs: string[];
    winner: string | null;
    turn: number;
}
// The Nerfing Algorithm
function normalizeStat(value: number): number {
    if (value <= 0) return 1;
    return Math.floor(Math.log10(value + 1) * 20) + 5;
}

export function initializeBattle(player: Character, opponent: Character): BattleState {
    return {
        playerHp: normalizeStat(player.stats.hp) * 10,
        opponentHp: normalizeStat(opponent.stats.hp) * 10,
        logs: ["Battle Started!"],
        winner: null,
        turn: 1,
    };
}

export function simulateTurn(
    state: BattleState,
    player: Character,
    opponent: Character
): BattleState {
    const newState = { ...state };
    const logs = [...newState.logs];

    // Calculate scaled stats
    const pAtk = normalizeStat(player.stats.attack);    // pAtk = playerAttack
    const pDef = normalizeStat(player.stats.defense);   // pDef = playerDefense
    const oAtk = normalizeStat(opponent.stats.attack)   //oAtk = opponentAttack
    const oDef = normalizeStat(opponent.stats.defense)  //oDef = opponentDefense

    // Player Attacks
    const pRandom = (Math.random() * 0.4) + 0.8;
    // Damage Formula: attack * random - (defense * 0.2)
    let pDmg = Math.floor((pAtk * pRandom) - (oDef * 0.2));
    if (pDmg < 1) pDmg = 1;    // Default Damage
    
    newState.opponentHp -= pDmg;
    logs.push(`Turn ${state.turn}: You hit ${opponent.username} for ${pDmg} DMG!`);

    // check if opponent died
    if (newState.opponentHp <= 0) {
        newState.opponentHp = 0;
        newState.winner = "player";
        newState.logs = [...logs, `VICTORY! You defeated ${opponent.username}!`];
        return newState;
    }

    // Opponent Attacks (same formula)
    const oRandom = (Math.random() * 0.4) + 0.8;
    let oDmg = Math.floor((oAtk * oRandom) - (pDef * 0.2));
    if (oDmg < 1) oDmg = 1;   // Default Damage

    newState.playerHp -= oDmg;
    logs.push(`Turn ${state.turn}: ${opponent.username} hits you for ${oDmg} DMG!`);

    //checking if player died
    if (newState.playerHp <= 0) {
        newState.playerHp = 0;
        newState.winner = "opponent";
        newState.logs = [...logs, `DEFEAT! ${opponent.username} crushed you.`];
        return newState;
    }

    newState.turn += 1;
    newState.logs = logs;
    return newState;
}
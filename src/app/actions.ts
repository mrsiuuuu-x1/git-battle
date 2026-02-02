"use server";
import { getCharacterProfile } from "./lib/github";
import { prisma } from "./lib/prisma";

export async function fetchUserStats(username: string) {
    return await getCharacterProfile(username);
}

export async function saveBattleResult(
    username: string,
    avatar: string,
    result: "WIN" | "LOSS",
    opponentName: string
) {
    if (!username) return;

    try {
        const user = await prisma.user.upsert({
            where: { username },
            update: {
                wins: { increment: result === "WIN" ? 1 : 0 },
                losses: { increment: result === "LOSS" ? 1 : 0 },
                avatar: avatar
            },
            create: {
                username,
                avatar,
                wins: result === "WIN" ? 1 : 0,
                losses: result === "LOSS" ? 1 : 0
            }
        });

        await prisma.battle.create({
            data: {
                playerId: user.id,
                opponent: opponentName,
                winner: result === "WIN" ? "player" : "opponent",
            }
        });

        console.log(`saved battle for ${username}: ${result}`);
        return { success: true };

    } catch (error) {
        console.error("failed to save battle:", error);
        return { success: false};
    }
}
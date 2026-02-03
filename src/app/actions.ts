"use server";
import { pusherServer } from "./lib/pusher";
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

// fetch top 10 players by wins
export async function getLeaderboard() {
    try {
        const topPlayers = await prisma.user.findMany({
            orderBy: { wins: 'desc'},
            take: 10,
            select: {
                username: true,
                avatar: true,
                wins: true,
                losses: true
            }
        });
        return topPlayers;
    } catch (error) {
        console.error("failed to fetch leaderboard:", error);
        return [];
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function joinMultiplayerRoom(roomId: string, player: any) {
    try {
    await pusherServer.trigger(roomId, "user-joined", player);
    return { success: true };
  } catch (error) {
    console.error("Pusher error:", error);
    return { success: false };
  }
}

// send battle move to opponent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendBattleMove(roomId: string, moveData: any) {
    try {
        await pusherServer.trigger(roomId, "battle-move", moveData);
        return { success: true};
    } catch (error) {
        console.error("Error sending move:", error);
        return { success: false};
    }
}
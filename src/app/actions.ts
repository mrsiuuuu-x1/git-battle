"use server";
import { pusherServer } from "./lib/pusher";
import { getCharacterProfile } from "./lib/github";
import { prisma } from "./lib/prisma";

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i =0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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
        const payload = {
            ...moveData,
            moveId: Date.now() + Math.random()
        };
        await pusherServer.trigger(roomId, "battle-move", payload);
        return { success: true};
    } catch (error) {
        console.error("Error sending move:", error);
        return { success: false};
    }
}

export async function createRoom(hostUsername: string, isPrivate: boolean = false) {
    try {
        let roomId = generateRoomCode();
        let isUnique = false;

        while (!isUnique) {
            const existing = await prisma.room.findUnique({
                where: { id: roomId }
            });
            if (!existing) {
                isUnique = true;
            } else {
                roomId = generateRoomCode();
            }
        }
    const room = await prisma.room.create({
        data: {
            id: roomId,
            host: hostUsername,
            isPrivate: isPrivate,
            status: "WAITING",
        },
    });
    return { success: true, roomId: room.id };
    } catch (error) {
        console.error("Error creating room:", error);
        return { success: false, error: "Failed to create room"};
    }
}

export async function getPublicRooms() {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        status: "WAITING",
        isPrivate: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    return { success: true, rooms };
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return { success: false, rooms: [] };
  }
}

export async function joinRoomDB(roomId: string, guestUsername: string) {
    try {
        await prisma.room.update({
            where: { id: roomId },
            data: {
                guest: guestUsername,
                status: "PLAYING"
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error joining room:", error);
        return { success: false };
    }
}
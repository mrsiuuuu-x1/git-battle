"use server";
import { pusherServer } from "./lib/pusher";
import { getCharacterProfile } from "./lib/github";
import { prisma } from "./lib/prisma";
import { ACHIEVEMENTS } from "./lib/achievements";

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i =0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function fetchUserStats(username: string) {
    const profile = await getCharacterProfile(username);
    if (profile) {
        await checkAndGrantAchievements(username, {
            totalCommits: profile.metadata.totalCommits,
            totalStars: profile.metadata.totalStars,
            mergedPRs: profile.metadata.mergedPRs,
            contributionStreak: profile.metadata.contributionStreak,
            organizations: profile.metadata.organizations,
        });
    }
    return profile;
}

interface AchievementContext {
    wins?: number;
    currentStreak?: number;
    totalCommits?: number;
    totalStars?: number;
    mergedPRs?: number;
    contributionStreak?: number;
    organizations?: number;
}

async function checkAndGrantAchievements(username: string, context: AchievementContext): Promise<string[]> {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, achievements: { select: { key: true } } }
        });
        if (!user) return [];

        const earned = new Set(user.achievements.map(a => a.key));

        const conditions: Record<string, boolean> = {
            FIRST_BLOOD:    (context.wins ?? 0) >= 1,
            UNSTOPPABLE:    (context.currentStreak ?? 0) >= 10,
            LEGEND:         (context.wins ?? 0) >= 100,
            COMMIT_MASTER:  (context.totalCommits ?? 0) >= 1000,
            STAR_COLLECTOR: (context.totalStars ?? 0) >= 100,
            COLLAB_KING:    (context.mergedPRs ?? 0) >= 50,
            STREAK_WARRIOR: (context.contributionStreak ?? 0) >= 7,
            OPEN_SOURCE:    (context.organizations ?? 0) >= 3,
        };

        const newlyUnlocked: string[] = [];

        for (const def of ACHIEVEMENTS) {
            if (earned.has(def.key)) continue;
            if (!conditions[def.key]) continue;

            await prisma.achievement.create({
                data: { userId: user.id, key: def.key }
            });
            newlyUnlocked.push(def.key);
        }

        return newlyUnlocked;
    } catch (error) {
        console.error("Achievement check failed:", error);
        return [];
    }
}

export async function getUserAchievements(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { achievements: { select: { key: true, unlockedAt: true } } }
        });
        return user?.achievements ?? [];
    } catch (error) {
        console.error("Failed to fetch achievements:", error);
        return [];
    }
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

        // Check battle achievements
        const battles = await prisma.battle.findMany({
            where: { playerId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { winner: true }
        });
        let streak = 0;
        for (const b of battles) {
            if (b.winner === "player") streak++; else break;
        }

        const updatedWins = user.wins + (result === "WIN" ? 1 : 0);
        const newAchievements = await checkAndGrantAchievements(username, {
            wins: updatedWins,
            currentStreak: result === "WIN" ? streak : 0,
        });

        console.log(`saved battle for ${username}: ${result}`);
        return { success: true, newAchievements };

    } catch (error) {
        console.error("failed to save battle:", error);
        return { success: false};
    }
}

// fetch battle history for a user
export async function getBattleHistory(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, wins: true, losses: true }
        });
        if (!user) return { battles: [], wins: 0, losses: 0, streak: 0 };

        const battles = await prisma.battle.findMany({
            where: { playerId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                opponent: true,
                winner: true,
                createdAt: true,
            }
        });

        // Calculate current streak
        let streak = 0;
        for (const battle of battles) {
            if (battle.winner === "player") {
                streak++;
            } else {
                break;
            }
        }

        return {
            battles,
            wins: user.wins,
            losses: user.losses,
            streak
        };
    } catch (error) {
        console.error("failed to fetch battle history:", error);
        return { battles: [], wins: 0, losses: 0, streak: 0 };
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
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    
    await prisma.room.deleteMany({
      where: {
        createdAt: {
          lt: sixMinutesAgo
        }
      }
    });

    const rooms = await prisma.room.findMany({
      where: { isPrivate: false },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return { rooms };
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return { rooms: [] };
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

export async function notifyOpponentLeft(roomId: string, username: string) {
    try {
        await pusherServer.trigger(roomId, "player-left", {
            username: username
        });
        return { success: true };
    } catch (error) {
        console.error("Error notifying left:", error);
        return { success: false };
    }
}

export async function checkRoomStatus(roomId: string) {
    try {
        const room = await prisma.room.findUnique({
            where: { id: roomId }
        });
        if (!room) {
            return { success: false, message: "ROOM NOT FOUND" };
        }
        if (room.status !== "WAITING") {
            return { success: false, message: "GAME ALREADY STARTED" };
        }

        return { success: true };
    } catch (error) {
        console.error("CHECK ROOM ERROR:", error);
        return { success: false, message: "SERVER ERROR" };
    }
}

export async function notifyPlayerReady(roomId: string, username: string) {
    try {
        await pusherServer.trigger(roomId, "player-ready", { username });
        return { success: true };
    } catch (error) {
        console.error("Error notifying ready:", error);
        return { success: false };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function notifyHostReply(roomId: string, hostProfile: any) {
    try {
        await pusherServer.trigger(roomId, "host-reply", hostProfile);
        return { success: true };
    } catch (error) {
        console.error("error sending host reply:", error);
        return { success: false };
    }
}

export async function notifyRematch(roomId: string) {
    try {
        await pusherServer.trigger(roomId, "rematch", {});
        return { success: true };
    } catch (error) {
        console.error("Error sending rematch:", error);
    }
}
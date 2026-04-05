"use server";
import { pusherServer } from "./lib/pusher";
import { getCharacterProfile } from "./lib/github";
import { prisma } from "./lib/prisma";
import { ACHIEVEMENTS, LANGUAGE_BADGES } from "./lib/achievements";

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i =0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function fetchUserStats(username: string, forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
        try {
            const cached = await prisma.statsCache.findUnique({ where: { username } });
            if (cached && (Date.now() - cached.fetchedAt.getTime()) < CACHE_TTL_MS) {
                const profile = cached.data as unknown as ReturnType<typeof getCharacterProfile> extends Promise<infer T> ? T : never;
                if (profile) {
                    await checkAndGrantAchievements(username, {
                        totalCommits: profile.metadata.totalCommits,
                        totalStars: profile.metadata.totalStars,
                        mergedPRs: profile.metadata.mergedPRs,
                        contributionStreak: profile.metadata.contributionStreak,
                        organizations: profile.metadata.organizations,
                        languageCounts: profile.metadata.languageCounts,
                    });
                }
                return profile;
            }
        } catch {
            // Cache miss or error, proceed to fetch
        }
    }

    const profile = await getCharacterProfile(username);
    if (profile) {
        await checkAndGrantAchievements(username, {
            totalCommits: profile.metadata.totalCommits,
            totalStars: profile.metadata.totalStars,
            mergedPRs: profile.metadata.mergedPRs,
            contributionStreak: profile.metadata.contributionStreak,
            organizations: profile.metadata.organizations,
            languageCounts: profile.metadata.languageCounts,
        });

        // Save to cache
        try {
            await prisma.statsCache.upsert({
                where: { username },
                update: { data: profile as object, fetchedAt: new Date() },
                create: { username, data: profile as object },
            });
        } catch {
            // Cache write failure is non-critical
        }
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
    languageCounts?: Record<string, number>;
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

        // Language specialist badges
        const langCounts = context.languageCounts ?? {};
        for (const lb of LANGUAGE_BADGES) {
            conditions[lb.key] = (langCounts[lb.language] ?? 0) >= 5;
        }

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
    opponentName: string,
    gameMode: "pve" | "pvp" | "friend" = "pve"
) {
    if (!username) return;

    const isPvP = gameMode === "pvp";

    try {
        const user = await prisma.user.upsert({
            where: { username },
            update: {
                wins: { increment: isPvP && result === "WIN" ? 1 : 0 },
                losses: { increment: isPvP && result === "LOSS" ? 1 : 0 },
                avatar: avatar
            },
            create: {
                username,
                avatar,
                wins: isPvP && result === "WIN" ? 1 : 0,
                losses: isPvP && result === "LOSS" ? 1 : 0
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

export async function createRoom(hostUsername: string, isPrivate: boolean = false, isFriendBattle: boolean = false) {
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
            isFriendBattle: isFriendBattle,
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

// ── Friend System ──

export async function searchUsers(query: string, currentUsername: string) {
    if (!query || query.length < 2) return [];
    try {
        const users = await prisma.user.findMany({
            where: {
                username: { contains: query, mode: "insensitive" },
                NOT: { username: currentUsername },
            },
            take: 10,
            select: { username: true, avatar: true, wins: true, losses: true },
        });
        return users;
    } catch (error) {
        console.error("User search failed:", error);
        return [];
    }
}

export async function sendFriendRequest(requesterUsername: string, addresseeUsername: string) {
    if (!requesterUsername || !addresseeUsername || requesterUsername === addresseeUsername) {
        return { success: false, error: "Invalid request" };
    }
    try {
        const [requester, addressee] = await Promise.all([
            prisma.user.findUnique({ where: { username: requesterUsername }, select: { id: true } }),
            prisma.user.findUnique({ where: { username: addresseeUsername }, select: { id: true } }),
        ]);
        if (!requester || !addressee) return { success: false, error: "User not found" };

        // Check if friendship already exists in either direction
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: requester.id, addresseeId: addressee.id },
                    { requesterId: addressee.id, addresseeId: requester.id },
                ],
            },
        });

        if (existing) {
            if (existing.status === "ACCEPTED") return { success: false, error: "Already friends" };
            if (existing.status === "PENDING") return { success: false, error: "Request already pending" };
            // If DECLINED, allow re-request by updating
            await prisma.friendship.update({
                where: { id: existing.id },
                data: { requesterId: requester.id, addresseeId: addressee.id, status: "PENDING", updatedAt: new Date() },
            });
            return { success: true };
        }

        await prisma.friendship.create({
            data: { requesterId: requester.id, addresseeId: addressee.id },
        });
        return { success: true };
    } catch (error) {
        console.error("Send friend request failed:", error);
        return { success: false, error: "Server error" };
    }
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
    try {
        await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: accept ? "ACCEPTED" : "DECLINED" },
        });
        return { success: true };
    } catch (error) {
        console.error("Friend request response failed:", error);
        return { success: false };
    }
}

export async function removeFriend(friendshipId: string) {
    try {
        await prisma.friendship.delete({ where: { id: friendshipId } });
        return { success: true };
    } catch (error) {
        console.error("Remove friend failed:", error);
        return { success: false };
    }
}

export async function sendChallenge(fromUsername: string, toUsername: string, roomId: string) {
    try {
        await pusherServer.trigger(`user-${toUsername}`, "friend-challenge", {
            from: fromUsername,
            roomId,
        });
        return { success: true };
    } catch (error) {
        console.error("Send challenge failed:", error);
        return { success: false };
    }
}

export async function getFriendsList(username: string) {
    try {
        const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
        if (!user) return { friends: [], pending: [] };

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: user.id, status: "ACCEPTED" },
                    { addresseeId: user.id, status: "ACCEPTED" },
                ],
            },
            include: {
                requester: { select: { username: true, avatar: true, wins: true, losses: true } },
                addressee: { select: { username: true, avatar: true, wins: true, losses: true } },
            },
        });

        const friends = friendships.map((f) => ({
            friendshipId: f.id,
            ...(f.requesterId === user.id ? f.addressee : f.requester),
        }));

        // Pending requests received by this user
        const pendingRequests = await prisma.friendship.findMany({
            where: { addresseeId: user.id, status: "PENDING" },
            include: {
                requester: { select: { username: true, avatar: true, wins: true, losses: true } },
            },
        });

        const pending = pendingRequests.map((f) => ({
            friendshipId: f.id,
            ...f.requester,
        }));

        return { friends, pending };
    } catch (error) {
        console.error("Get friends list failed:", error);
        return { friends: [], pending: [] };
    }
}
"use client";

import { useState, useEffect } from "react";
import { searchUsers, sendFriendRequest, respondToFriendRequest, removeFriend, getFriendsList, createRoom } from "../actions";
import { getTier } from "../lib/tiers";
import { useRouter } from "next/navigation";

interface FriendEntry {
  friendshipId: string;
  username: string;
  avatar: string | null;
  wins: number;
  losses: number;
}

interface FriendsPanelProps {
  currentUsername: string;
  onBack: () => void;
}

export default function FriendsPanel({ currentUsername, onBack }: FriendsPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pending, setPending] = useState<FriendEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadFriends = async () => {
    const data = await getFriendsList(currentUsername);
    setFriends(data.friends);
    setPending(data.pending);
  };

  useEffect(() => {
    loadFriends();
  }, [currentUsername]);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setLoading(true);
    const results = await searchUsers(searchQuery, currentUsername);
    setSearchResults(results);
    setLoading(false);
  };

  const handleSendRequest = async (targetUsername: string) => {
    const res = await sendFriendRequest(currentUsername, targetUsername);
    if (res.success) {
      setMessage(`Request sent to ${targetUsername}!`);
      setSearchResults((prev) => prev.filter((u) => u.username !== targetUsername));
    } else {
      setMessage(res.error || "Failed to send request");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleRespond = async (friendshipId: string, accept: boolean, username: string) => {
    await respondToFriendRequest(friendshipId, accept);
    setMessage(accept ? `${username} added as friend!` : `Request declined`);
    await loadFriends();
    setTimeout(() => setMessage(""), 3000);
  };

  const handleRemove = async (friendshipId: string, username: string) => {
    await removeFriend(friendshipId);
    setMessage(`Removed ${username}`);
    await loadFriends();
    setTimeout(() => setMessage(""), 3000);
  };

  const handleChallenge = async (friendUsername: string) => {
    const res = await createRoom(currentUsername, true);
    if (res.success && res.roomId) {
      router.push(`/lobby/${res.roomId}?challenge=${friendUsername}`);
    }
  };

  const tabs = [
    { key: "friends" as const, label: `FRIENDS (${friends.length})` },
    { key: "requests" as const, label: `REQUESTS${pending.length > 0 ? ` (${pending.length})` : ""}` },
    { key: "search" as const, label: "ADD FRIEND" },
  ];

  return (
    <div className="w-full max-w-lg flex flex-col gap-4 animate-in slide-in-from-right duration-300">
      <h2 className="retro-font text-xl text-center text-[#845ec2] mb-2">FRIENDS</h2>

      {/* Tabs */}
      <div className="flex gap-1 w-full">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 retro-font text-[10px] md:text-xs py-2 px-1 border-4 border-black cursor-pointer transition-all ${
              tab === t.key
                ? "bg-[#845ec2] text-white translate-y-0.5 shadow-none"
                : "bg-gray-200 text-gray-600 hover:bg-white shadow-[3px_3px_0_#000]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toast message */}
      {message && (
        <div className="bg-[#ffd700]/20 border-2 border-[#ffd700] p-2 text-center retro-font text-xs text-[#ffd700] animate-in fade-in">
          {message}
        </div>
      )}

      {/* Friends List Tab */}
      {tab === "friends" && (
        <div className="bg-black/40 border-4 border-black p-4 max-h-80 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="text-center text-gray-400 retro-font text-xs py-8">
              NO FRIENDS YET...<br />
              <span className="text-gray-500 mt-2 block">Search for players to add!</span>
            </div>
          ) : (
            friends.map((friend) => {
              const tier = getTier(friend.wins);
              return (
                <div key={friend.friendshipId} className="flex items-center justify-between border-b-2 border-gray-700 py-3 last:border-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={friend.avatar || ""} alt="" className="w-8 h-8 border-2 border-white rounded-full bg-white shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white retro-font text-xs truncate">{friend.username}</p>
                      <div className="flex items-center gap-1">
                        <span className="retro-font text-[9px] px-1 py-0.5 border border-black whitespace-nowrap" style={{ color: tier.color, backgroundColor: tier.bgColor }}>
                          {tier.icon} {tier.name}
                        </span>
                        <span className="text-gray-500 retro-font text-[9px]">{friend.wins}W/{friend.losses}L</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleChallenge(friend.username)}
                      className="bg-[#ff6b6b] text-white px-2 py-1 border-2 border-black retro-font text-[9px] hover:bg-red-600 cursor-pointer"
                    >
                      FIGHT
                    </button>
                    <button
                      onClick={() => handleRemove(friend.friendshipId, friend.username)}
                      className="bg-gray-600 text-white px-2 py-1 border-2 border-black retro-font text-[9px] hover:bg-gray-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <div className="bg-black/40 border-4 border-black p-4 max-h-80 overflow-y-auto">
          {pending.length === 0 ? (
            <div className="text-center text-gray-400 retro-font text-xs py-8">
              NO PENDING REQUESTS
            </div>
          ) : (
            pending.map((req) => (
              <div key={req.friendshipId} className="flex items-center justify-between border-b-2 border-gray-700 py-3 last:border-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={req.avatar || ""} alt="" className="w-8 h-8 border-2 border-white rounded-full bg-white shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white retro-font text-xs truncate">{req.username}</p>
                    <span className="text-gray-500 retro-font text-[9px]">{req.wins}W/{req.losses}L</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleRespond(req.friendshipId, true, req.username)}
                    className="bg-[#00e756] text-black px-2 py-1 border-2 border-black retro-font text-[9px] hover:bg-green-400 cursor-pointer"
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={() => handleRespond(req.friendshipId, false, req.username)}
                    className="bg-[#ff6b6b] text-white px-2 py-1 border-2 border-black retro-font text-[9px] hover:bg-red-600 cursor-pointer"
                  >
                    DENY
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search Tab */}
      {tab === "search" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="SEARCH USERNAME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 retro-font p-3 text-black border-4 border-black text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={loading || searchQuery.length < 2}
              className="bg-[#845ec2] text-white px-4 border-4 border-black retro-font text-xs hover:bg-purple-600 cursor-pointer disabled:opacity-50"
            >
              {loading ? "..." : "SEARCH"}
            </button>
          </div>

          <div className="bg-black/40 border-4 border-black p-4 max-h-64 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-center text-gray-400 retro-font text-xs py-6">
                {searchQuery.length >= 2 && !loading ? "NO PLAYERS FOUND" : "TYPE A USERNAME TO SEARCH"}
              </div>
            ) : (
              searchResults.map((user) => {
                const tier = getTier(user.wins);
                return (
                  <div key={user.username} className="flex items-center justify-between border-b-2 border-gray-700 py-3 last:border-0 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={user.avatar || ""} alt="" className="w-8 h-8 border-2 border-white rounded-full bg-white shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white retro-font text-xs truncate">{user.username}</p>
                        <div className="flex items-center gap-1">
                          <span className="retro-font text-[9px] px-1 py-0.5 border border-black whitespace-nowrap" style={{ color: tier.color, backgroundColor: tier.bgColor }}>
                            {tier.icon} {tier.name}
                          </span>
                          <span className="text-gray-500 retro-font text-[9px]">{user.wins}W/{user.losses}L</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.username)}
                      className="bg-[#00e756] text-black px-3 py-1 border-2 border-black retro-font text-[9px] hover:bg-green-400 cursor-pointer shrink-0"
                    >
                      + ADD
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="text-gray-400 retro-font text-xs hover:text-white underline mt-2 text-center cursor-pointer"
      >
        ← BACK TO MENU
      </button>
    </div>
  );
}

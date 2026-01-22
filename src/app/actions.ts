"use server";
import { getCharacterProfile } from "./lib/github";

export async function fetchUserStats(username: string) {
    return await getCharacterProfile(username);
}
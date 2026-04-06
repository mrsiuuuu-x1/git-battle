# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Next.js on localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint with Next.js core-web-vitals + TypeScript configs)
- **Database migrations:** `npx prisma migrate dev` / `npx prisma db push`
- **Generate Prisma client:** `npx prisma generate`

No test framework is configured.

## Architecture

Git Battle is a turn-based RPG where GitHub profiles are converted into RPG characters that fight each other. Built with Next.js 16 App Router, TypeScript, Tailwind CSS v4, and PostgreSQL via Prisma.

### Core Data Flow

1. **GitHub profile fetch** (`src/app/lib/github.ts`) - Calls GitHub REST API (via axios, no auth token), analyzes repos/languages/activity, determines a character class (Frontend Warrior, Backend Mage, DevOps Paladin, Full-Stack Samurai, Open-Source Wizard, Code Apprentice), and computes RPG stats (HP, attack, defense, speed, mana, critRate). Metadata includes `languageCounts` (per-language repo count) used for language specialist badges.

2. **Battle engine** (`src/app/lib/gameEngine.ts`) - Pure functions, no side effects. `initializeBattle` creates state, `performPlayerTurn` handles player actions (attack/heal/special), `performOpponentTurn` runs AI logic. Each class has a unique special ability with different damage multipliers and effects. Mana system gates special (25 mana) and heal (15 mana) actions.

3. **Server actions** (`src/app/actions.ts`) - All server-side logic uses Next.js `"use server"` actions (no API routes except NextAuth). Handles battle persistence, leaderboard, achievements, and multiplayer room management.

4. **Real-time multiplayer** - Pusher (server + client) for room-based multiplayer. Rooms are created with 6-char codes, auto-deleted after 6 minutes. Events: `user-joined`, `battle-move`, `player-left`, `player-ready`, `host-reply`, `rematch`.

5. **Friend system** - Users can search, add, and manage friends. Friends can challenge each other to battles via Pusher events (`friend-challenge`). Friend battle rooms are flagged with `isFriendBattle: true`.

### Key Models (Prisma/PostgreSQL)

- **User** - username (unique), wins/losses counters (PvP matchmaking only), achievements relation, friendships
- **Battle** - links to player, stores opponent name and winner
- **Achievement** - per-user unlocks keyed by achievement key (unique per user). Includes battle, github, special, and language specialist categories
- **Room** - multiplayer lobby with host/guest, status (WAITING/PLAYING), `isPrivate`, `isFriendBattle` flags, auto-cleanup after 6 minutes
- **Friendship** - bidirectional friend requests with status (PENDING/ACCEPTED/DECLINED)
- **StatsCache** - caches GitHub profile data per username with 7-day TTL

### Auth

NextAuth with GitHub OAuth provider (`src/app/lib/auth.ts`). Username extracted from GitHub profile's `login` field via JWT callback.

### Environment Variables

Requires: `PRISMA_DATABASE_URL`, `POSTGRES_URL` (Prisma), `GITHUB_ID`, `GITHUB_SECRET` (NextAuth), `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`.

## Key Patterns

- Battle state is immutable - turn functions return new state objects via spread
- AI opponent decision-making uses probability thresholds based on HP/mana percentages
- Stats are clamped to ranges (HP: 200-600, attack: 10+, defense: 5+, speed: 10+, mana: 10+)
- Achievement checking runs on both profile fetch and battle result save
- Wins/losses only increment for PvP matchmaking battles — PvE (AI) and friend battles are recorded in history but don't affect leaderboard standings
- Language specialist badges unlock when a user has 5+ repos in a language (18 languages supported)
- Achievements panel has category filter tabs (all/battle/github/special/language)
- Leaderboard supports filters: sort by (wins/win rate/total battles), tier filter, and top N (10/25/50)

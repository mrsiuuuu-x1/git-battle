import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { getCharacterProfile } from "@/app/lib/github";
import ActiveRoom from "../../components/ActiveRoom"; 

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LobbyPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.name) {
    redirect("/");
  }

  const resolvedParams = await params;
  const roomId = resolvedParams.id;
  
  const username = session.user.name;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let myCharacter: any = null;
  
  try {
      myCharacter = await getCharacterProfile(username);
  } catch (e) {
      console.error("Failed to fetch character:", e);
  }

  // fallback profile
  if (!myCharacter) {
      console.log(`Using Fallback Profile for ${username}`);
      myCharacter = {
          username: username,
          avatar: session.user.image || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
          class: "Code Apprentice",
          stats: { hp: 200, attack: 15, defense: 5, speed: 10, mana: 30, critRate: 0.05 },
          metadata: {
              totalCommits: 0, totalStars: 0, followers: 0, publicRepos: 0,
              yearsActive: 1, topLanguage: "JavaScript", contributionStreak: 0,
              mergedPRs: 0, codeReviews: 0, organizations: 0,
          },
      };
  }

  return (
    <ActiveRoom 
      player={myCharacter} 
      roomId={roomId} 
      initialOpponent={null} 
    />
  );
}
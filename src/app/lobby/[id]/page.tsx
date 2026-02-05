import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; 
import { redirect } from "next/navigation";
import { getCharacterProfile } from "@/app/lib/github";
import ActiveRoom from "../../components/ActiveRoom"; 

interface PageProps {
  params: {
    id: string;
  };
}

export default async function LobbyPage({ params }: PageProps) {
  // 1. Check if user is logged in
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.name) {
    redirect("/");
  }

  const roomId = params.id;
  const username = session.user.name;

  // 2. Fetch MY stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let myCharacter: any = null;
  
  try {
      myCharacter = await getCharacterProfile(username);
  } catch (e) {
      console.error("Failed to fetch character:", e);
      // Do not redirect yet, try fallback first
  }

  // 🔥 FALLBACK FIX: If GitHub blocked us, create a "Guest" character so we can still play
  if (!myCharacter) {
      console.log(`⚠️ Using Fallback Profile for ${username} (GitHub API limit likely reached)`);
      myCharacter = {
          username: username,
          avatar: session.user.image || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
          class: "Frontend Warrior", // Default class
          level: 1,
          stats: {
              hp: 100,
              attack: 15,
              defense: 5,
              speed: 10
          }
      };
  }

  // 3. Render the Room
  return (
    <ActiveRoom 
      player={myCharacter} 
      roomId={roomId} 
      initialOpponent={null} 
    />
  );
}
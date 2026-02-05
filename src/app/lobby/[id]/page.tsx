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
      // Don't crash, just go home
      redirect("/"); 
  }

  if (!myCharacter) {
      console.error("Character not found for username:", username);
      // Redirect with an error flag so you know what happened
      redirect("/?error=github_fetch_failed");
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
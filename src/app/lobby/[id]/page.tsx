import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { getCharacterProfile } from "@/app/lib/github";
import ActiveRoom from "@/app/components/ActiveRoom";

interface PageProps {
    params: {
        id: string;
    };
}

export default async function LobbyPage({ params }: PageProps) {
    // check if user is logged in
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.name) {
        redirect("/");
    }

    const roomId = params.id;
    const username = session.user.name;

    // fetch player stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let myCharacter: any = null;

    try {
        myCharacter = await getCharacterProfile(username);
    } catch (e) {
        console.error("Failed to fetch character:", e)
        redirect("/");
    }

    // render the room
    return (
        <ActiveRoom
            player={myCharacter}
            roomId={roomId}
            initialOpponent={null}
        />
    );
}
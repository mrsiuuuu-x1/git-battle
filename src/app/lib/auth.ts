import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).username = (token as any).username || session.user.name;
            }
            return session;
        },
        async jwt({ token, profile }) {
            if (profile) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (token as any).username = (profile as any).login;
            }
            return token;
        },
    },
};
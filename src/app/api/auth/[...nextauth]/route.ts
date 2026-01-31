import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const handler = NextAuth({
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: { params: { scopre: "read:user" }},
        }),
    ],
    pages: {
        signIn: "/",
    },
    callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, profile }: any) {
            if (profile) {
                token.username = profile.login;;
            }
            return token;
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: any) {
            if (session.user) {
                session.user.username = token.username;
            }
            return session;
        },
    },
});

export { handler as GET, handler as POST };
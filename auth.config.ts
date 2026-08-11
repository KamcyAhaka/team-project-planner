import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Overridden in auth.ts with credentials/other providers
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.displayName = user.displayName;
        token.profilePictureURL = user.profilePictureURL;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || session.user.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.displayName = token.displayName;
        session.user.profilePictureURL = token.profilePictureURL;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

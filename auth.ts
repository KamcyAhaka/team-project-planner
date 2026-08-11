import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "./lib/mongodb";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface User {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    profilePictureURL?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
      profilePictureURL?: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    profilePictureURL?: string;
  }
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const db = await getDb();
        const normalizedEmail = email.toLowerCase().trim();

        // Query user safely with normalized email
        const user = await db.collection("users").findOne({ email: normalizedEmail });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name:
            user.displayName ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.email,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          displayName: user.displayName || "",
          profilePictureURL: user.profilePictureURL || "",
        };
      },
    }),
  ],
});

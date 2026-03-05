// app/lib/auth.config.ts
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import sql from "@/utilities/db";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// DB User type
export type DBUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  profileImage: string | null;
  biography: string;
};

// Extend NextAuth types for token and session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username?: string;
      email?: string;
      profileImage?: string | null;
      biography?: string;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// --- Auth config ---
export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
        register: { label: "Register?", type: "boolean" },
      },
      async authorize(
        credentials
      ): Promise<DBUser | null> {
        if (!credentials?.email || !credentials?.password) return null;

        const rows = await sql<DBUser[]>`
          SELECT * FROM ssu_users WHERE email = ${credentials.email} LIMIT 1
        `;
        const existingUser = rows[0];

        // Registration
        if (credentials.register && !existingUser) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(credentials.password, salt);

          const newUserRows = await sql<DBUser[]>`
            INSERT INTO ssu_users (email, username, password_hash, role)
            VALUES (${credentials.email}, ${credentials.username || credentials.email}, ${hashedPassword}, 'user')
            RETURNING *
          `;
          return newUserRows[0] || null;
        }

        // Login
        if (!existingUser) return null;

        const isValid = await bcrypt.compare(credentials.password, existingUser.password_hash);
        if (!isValid) return null;

        return existingUser;
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: DBUser;
      account?: any;
      profile?: any;
      isNewUser?: boolean;
    }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      // Ensure session.user has id and role
      const user = session.user as Session["user"];
      user.id = token.id!;
      user.role = token.role!;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
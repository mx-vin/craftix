// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import sql from "@/utilities/db";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// --- DB user type ---
type DBUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  profileImage: string | null;
  biography: string;
};

// --- Extend JWT for custom fields ---
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// --- Extend Session user to include DB fields ---
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

// --- NextAuth configuration ---
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" },
        register: { label: "Register?", type: "boolean" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Fetch user from DB
        const rows = await sql<DBUser[]>`
          SELECT * FROM ssu_users WHERE email = ${credentials.email} LIMIT 1
        `;
        const existingUser = rows[0];

        // Registration flow
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

        // Login flow
        if (!existingUser) return null;

        const isValid = await bcrypt.compare(credentials.password, existingUser.password_hash);
        if (!isValid) return null;

        return existingUser;
      },
    }),
  ],
  session: { strategy: "jwt" as const }, // literal type to satisfy TS
  callbacks: {
    // --- JWT callback ---
    async jwt(params) {
      const { token, user } = params; // NextAuth v5
      if (user) {
        const dbUser = user as DBUser; // cast safely
        token.id = dbUser.id;
        token.role = dbUser.role;
      }
      return token;
    },

    // --- Session callback ---
    async session({ session, token }) {
      // Assert session.user type to include id & role
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
});

// --- App Router export ---
export { handler as GET, handler as POST };
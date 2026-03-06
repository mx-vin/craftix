'use server';

import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import sql from "../../../utilities/db";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

type DBUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  profileImage: string | null;
  biography: string;
};

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

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
    async jwt({ token, user }) {
      if (user) {
        const dbUser = user as DBUser;
        token.id = dbUser.id;
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
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
  // <--- Force JSON responses for credentials provider
  events: {},
  debug: false,
});

export async function POST(req: Request) {
  const body = await req.json();

  // Force redirect:false for REST/POST requests
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, redirect: false }),
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: res.headers,
  });
}

export { handler as GET };
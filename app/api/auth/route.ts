// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import sql from "@/utilities/db";

type User = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  profileImage: string | null;
  biography: string;
};

// --- NextAuth configuration ---
const authOptions = {
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

        // Check if user exists
        const rows = await sql<User[]>`
          SELECT * FROM ssu_users WHERE email = ${credentials.email} LIMIT 1
        `;
        const existingUser = rows[0];

        // Registration flow
        if (credentials.register && !existingUser) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(credentials.password, salt);

          const newUserRows = await sql<User[]>`
            INSERT INTO ssu_users (email, username, password_hash, role)
            VALUES (${credentials.email}, ${credentials.username || credentials.email}, ${hashedPassword}, 'user')
            RETURNING *
          `;
          const newUser = newUserRows[0];
          if (!newUser) return null;

          return {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            profileImage: newUser.profileImage,
            biography: newUser.biography,
          };
        }

        // Login flow
        if (!existingUser) return null;

        const isValid = await bcrypt.compare(credentials.password, existingUser.password_hash);
        if (!isValid) return null;

        return {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role,
          profileImage: existingUser.profileImage,
          biography: existingUser.biography,
        };
      },
    }),
  ],
  session: { strategy: "jwt" as const }, // literal type fixes TS error
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// --- App Router export ---
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
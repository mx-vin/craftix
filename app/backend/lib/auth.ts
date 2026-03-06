// app/backend/lib/auth.ts

import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import sql from "../utilities/db";
import { z } from "zod";

// --- DB User type ---
export type DBUser = {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  profileImage: string | null;
  biography: string;
};

// --- Helper: fetch user by email ---
export async function getUserByEmail(email: string): Promise<DBUser | null> {
  try {
    const rows = await sql<DBUser[]>`
      SELECT * FROM ssu_users WHERE email = ${email} LIMIT 1
    `;
    return rows[0] || null;
  } catch (err) {
    console.error("Failed to fetch user:", err);
    return null;
  }
}

// --- Credentials provider (backend-safe) ---
export const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "text" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials) return null;

    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .safeParse(credentials);

    if (!parsed.success) return null;

    const { email, password } = parsed.data;
    const user = await getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      biography: user.biography,
    };
  },
});

// --- STUB EXPORTS for frontend-only functions ---
// These exist so backend compiles cleanly without importing frontend code
export const signIn = async () => null;
export const signOut = async () => null;
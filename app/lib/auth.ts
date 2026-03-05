// app/lib/auth.ts
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import sql from "@/utilities/db";
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

// --- Credentials provider ---
export const credentialsProvider = CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "text" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials) return null;

    // Validate input using Zod
    const parsed = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .safeParse(credentials);

    if (!parsed.success) return null;

    const { email, password } = parsed.data;

    // Fetch user
    const user = await getUserByEmail(email);
    if (!user) return null;

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    // Return user with required fields
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
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
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

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        username: { label: "Username", type: "text" }, // optional for registration
        register: { label: "Register?", type: "boolean" }, // optional flag
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Step 1: Check if user exists
        const rows = await sql<User[]>`
          SELECT * FROM ssu_users WHERE email = ${credentials.email} LIMIT 1
        `;
        const existingUser = rows[0];

        // Step 2: Handle registration
        if (credentials.register && !existingUser) {
          // Hash password
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(credentials.password, salt);

          // Insert new user
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

        // Step 3: Login flow
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
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // optional custom login page
  },
  secret: process.env.NEXTAUTH_SECRET,
});

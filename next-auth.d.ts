import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      username?: string;
      email?: string;
      image?: string | null;
      profileImage?: string | null;
      biography?: string;
    };
  }

  interface User {
    id: string;
    role: string;
    username?: string;
    profileImage?: string | null;
    biography?: string;
  }

  interface JWT {
    id: string;
    role: string;
  }
}

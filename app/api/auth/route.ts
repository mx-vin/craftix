import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import sql from '../../../utilities/db';

type User = {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: string;
  profileImage: string | null;
  biography: string;
};

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // fetch user from DB
        const rows = await sql<User[]>`
          SELECT *
          FROM ssu_users
          WHERE email = ${credentials.email}
          LIMIT 1
        `;
        const user = rows[0];
        if (!user) return null;

        // verify password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // return safe user object
        return {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          biography: user.biography,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
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
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

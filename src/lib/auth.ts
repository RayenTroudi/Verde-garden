import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const adminUsername = process.env.NEXT_AUTH_ADMIN_USERNAME ?? "admin";
        const adminPassword = process.env.NEXT_AUTH_ADMIN_PASSWORD ?? "";

        if (
          credentials.username !== adminUsername ||
          credentials.password !== adminPassword
        ) {
          return null;
        }

        return { id: "1", name: adminUsername, email: `${adminUsername}@verde-garden.local` };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 86400,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "admin";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};

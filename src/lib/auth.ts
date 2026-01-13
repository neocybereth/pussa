import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export type Role = "TEACHER" | "STUDENT";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Dynamic import to avoid edge runtime issues
        const { prisma } = await import("@/lib/db");
        const bcrypt = await import("bcryptjs");

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const pathname = nextUrl.pathname;

      const isAuthPage =
        pathname.startsWith("/login") || pathname.startsWith("/register");
      const isDashboardPage = pathname.startsWith("/dashboard");
      const isTeacherPage = pathname.startsWith("/dashboard/teacher");
      const isStudentPage = pathname.startsWith("/dashboard/student");
      const isPublicPage = pathname === "/" || pathname.startsWith("/about");

      // Allow public pages
      if (isPublicPage) {
        return true;
      }

      // Redirect logged-in users away from auth pages
      if (isAuthPage && isLoggedIn) {
        const redirectUrl =
          userRole === "TEACHER"
            ? "/dashboard/teacher"
            : "/dashboard/student";
        return Response.redirect(new URL(redirectUrl, nextUrl));
      }

      // Allow auth pages for non-logged-in users
      if (isAuthPage) {
        return true;
      }

      // Redirect non-logged-in users to login
      if (isDashboardPage && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Redirect to role-specific dashboard if accessing generic /dashboard
      if (pathname === "/dashboard" && isLoggedIn) {
        const redirectUrl =
          userRole === "TEACHER"
            ? "/dashboard/teacher"
            : "/dashboard/student";
        return Response.redirect(new URL(redirectUrl, nextUrl));
      }

      // Prevent students from accessing teacher pages
      if (isTeacherPage && userRole === "STUDENT") {
        return Response.redirect(new URL("/dashboard/student", nextUrl));
      }

      // Prevent teachers from accessing student pages
      if (isStudentPage && userRole === "TEACHER") {
        return Response.redirect(new URL("/dashboard/teacher", nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

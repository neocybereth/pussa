import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET 
  });
  const { pathname } = request.nextUrl;

  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isTeacherPage = pathname.startsWith("/dashboard/teacher");
  const isStudentPage = pathname.startsWith("/dashboard/student");
  const isAboutPage = pathname.startsWith("/about");

  // Redirect home page to dashboard or login
  if (pathname === "/") {
    if (isLoggedIn) {
      const redirectUrl =
        userRole === "TEACHER"
          ? "/dashboard/teacher"
          : "/dashboard/student";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Allow about page
  if (isAboutPage) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    const redirectUrl =
      userRole === "TEACHER"
        ? "/dashboard/teacher"
        : "/dashboard/student";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Allow auth pages for non-logged-in users
  if (isAuthPage) {
    return NextResponse.next();
  }

  // Redirect non-logged-in users to login
  if (isDashboardPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to role-specific dashboard if accessing generic /dashboard
  if (pathname === "/dashboard" && isLoggedIn) {
    const redirectUrl =
      userRole === "TEACHER"
        ? "/dashboard/teacher"
        : "/dashboard/student";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Prevent students from accessing teacher pages
  if (isTeacherPage && userRole === "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard/student", request.url));
  }

  // Prevent teachers from accessing student pages
  if (isStudentPage && userRole === "TEACHER") {
    return NextResponse.redirect(new URL("/dashboard/teacher", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

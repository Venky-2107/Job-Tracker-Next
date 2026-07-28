import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // read token from cookie — middleware runs on server so localStorage is not accessible
  const token = request.cookies.get("token")?.value;

  // check if the user is trying to access login or register page
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");

  // no token and trying to access a protected page → send to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // has token and trying to access login/register → send to dashboard
  // prevents logged in users from seeing login page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // all good — let the request through
  return NextResponse.next();
}

// defines which routes this middleware runs on
// :path* means match the route and all sub routes under it
export const config = {
  matcher: ["/dashboard/:path*", "/application/:path*", "/login", "/register"],
};

import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only redirect unauthenticated users away from protected routes
  // Role-based access is handled in each page's Server Component
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token") ??
    req.cookies.get("next-auth.session-token") ??
    req.cookies.get("__Secure-next-auth.session-token")

  const isProtected = pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student")

  if (!sessionCookie && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

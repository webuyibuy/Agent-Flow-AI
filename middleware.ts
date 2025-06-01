import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get("next-auth.session-token")
  const secureToken = request.cookies.get("__Secure-next-auth.session-token")

  if (!token && !secureToken) {
    return NextResponse.redirect(new URL("/auth/login", request.nextUrl))
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
}

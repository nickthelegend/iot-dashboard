import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Special handling for WebSocket connections
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/ws")) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-middleware-rewrite", pathname)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

// /proxy.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = new Set<string>(["/login"])

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true
  if (pathname.startsWith("/api/auth")) return true
  if (pathname.startsWith("/_next")) return true
  if (pathname.startsWith("/favicon")) return true
  return false
}

// ✅ Edge runtime'da Prisma kullanamayız.
// Bu yüzden auth() ÇAĞIRMIYORUZ.
// Sadece cookie'de authjs session token var mı bakıyoruz.
function hasAuthSessionCookie(req: NextRequest) {
  // Auth.js cookie isimleri (prod/dev farklı olabilir)
  const names = [
    "__Secure-authjs.session-token",
    "authjs.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ]

  return names.some((n) => req.cookies.get(n)?.value)
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicPath(pathname)) return NextResponse.next()

  // API'leri burada engellemiyoruz (istersen sonra kısıtlarız)
  if (pathname.startsWith("/api")) return NextResponse.next()

  const loggedIn = hasAuthSessionCookie(req)
  if (loggedIn) return NextResponse.next()

  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.searchParams.set("from", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

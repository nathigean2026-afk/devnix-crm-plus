import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware Edge Runtime — adiciona headers de segurança e performance.
 * Não importa módulos Node.js (Drizzle/Neon/auth) pois o Edge Runtime
 * não suporta APIs nativas como node:util/types.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Headers de segurança
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Strict Transport Security — força HTTPS por 1 ano
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

  // DNS Prefetch Control
  res.headers.set("X-DNS-Prefetch-Control", "on")

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/turnstile).*)"],
}

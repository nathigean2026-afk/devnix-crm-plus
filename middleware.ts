import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware de sessão única via cookie "ea-latest-sid".
 *
 * Fluxo:
 * 1. Quando o usuário faz login, a rota POST /api/auth/set-latest-session
 *    grava o ID da sessão mais recente no cookie "ea-latest-sid" (httpOnly).
 * 2. O middleware lê "ea-latest-sid" e "ea-current-sid" a cada request.
 *    Se ea-current-sid !== ea-latest-sid → sessão foi superada → kick.
 *
 * Isso elimina qualquer fetch interno e não causa loops.
 */

const PUBLIC_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/api/",
  "/os/",
  "/orc/",
  "/_next/",
  "/favicon",
  "/planos/sucesso",
  "/esqueci-senha",
  "/cadastro",
  "/demo",
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rotas públicas passam direto
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // IDs de sessão gravados em cookies pela rota de login (aceita versão __Secure- também)
  const latestSid =
    req.cookies.get("__Secure-ea-latest-sid")?.value ??
    req.cookies.get("ea-latest-sid")?.value
  const currentSid =
    req.cookies.get("__Secure-ea-current-sid")?.value ??
    req.cookies.get("ea-current-sid")?.value

  // Se ambos existem e diferem, esta sessão foi superada por um novo login
  if (latestSid && currentSid && latestSid !== currentSid) {
    const loginUrl = new URL("/sign-in", req.url)
    loginUrl.searchParams.set("kicked", "1")
    const response = NextResponse.redirect(loginUrl)
    // Limpa o cookie de sessão do Better Auth para forçar novo login
    response.cookies.delete("better-auth.session_token")
    response.cookies.delete("__Secure-better-auth.session_token")
    response.cookies.delete("ea-current-sid")
    response.cookies.delete("__Secure-ea-current-sid")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

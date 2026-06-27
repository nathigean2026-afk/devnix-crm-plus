import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * Middleware de sessão única.
 *
 * O Better Auth registra no banco a sessão ativa mais recente.
 * Quando o usuário faz login em outro dispositivo, `revokeOtherSessions()`
 * invalida todas as sessões anteriores. Este middleware verifica se a sessão
 * atual ainda é válida — se não for, redireciona para /sign-in?kicked=1.
 *
 * Só executa a verificação em rotas protegidas (não em /api, /sign-in, etc.)
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rotas públicas passam direto — sem verificação
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verifica se há um cookie de sessão do Better Auth
  const sessionToken =
    req.cookies.get("__Secure-better-auth.session_token")?.value ??
    req.cookies.get("better-auth.session_token")?.value

  // Sem token → deixa o Better Auth lidar com o redirect de auth
  if (!sessionToken) {
    return NextResponse.next()
  }

  // Valida a sessão diretamente no banco via Better Auth server-side
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      // Sessão revogada (outro login ocorreu e chamou revokeOtherSessions)
      const loginUrl = new URL("/sign-in", req.url)
      loginUrl.searchParams.set("kicked", "1")
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete("better-auth.session_token")
      response.cookies.delete("__Secure-better-auth.session_token")
      return response
    }
  } catch {
    // Falha silenciosa — não bloqueia o usuário em caso de erro de rede/DB
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

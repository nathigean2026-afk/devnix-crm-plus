import { NextRequest, NextResponse } from "next/server"

// Rotas que não precisam de verificação de sessão única
const PUBLIC_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/cadastro",
  "/demo",
  "/api/",
  "/os/",
  "/orc/",
  "/_next/",
  "/favicon",
  "/planos/sucesso",
  "/esqueci-senha",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ignora rotas públicas e assets
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Lê o token de sessão do cookie do Better Auth
  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value

  if (!sessionToken) {
    // Sem sessão — deixa o middleware do Better Auth/página lidar
    return NextResponse.next()
  }

  // Verifica se esta é a sessão mais recente do usuário
  // Chama a API interna para validar (evita importar DB direto no edge)
  try {
    const checkUrl = new URL("/api/auth/session-check", req.url)
    const res = await fetch(checkUrl.toString(), {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
        "x-session-token": sessionToken,
      },
      // Timeout curto para não atrasar a navegação
      signal: AbortSignal.timeout(3000),
    })

    if (res.status === 401) {
      // Sessão foi substituída — desconecta e redireciona
      const loginUrl = new URL("/sign-in", req.url)
      loginUrl.searchParams.set("kicked", "1")
      const response = NextResponse.redirect(loginUrl)
      // Apaga os cookies de sessão
      response.cookies.delete("better-auth.session_token")
      response.cookies.delete("__Secure-better-auth.session_token")
      return response
    }
  } catch {
    // Falha silenciosa — não bloqueia o usuário em caso de erro de rede
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (imagens otimizadas)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

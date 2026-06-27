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

  // Ignora rotas públicas, assets e chamadas internas do próprio middleware
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Evita loop: se já veio de uma chamada interna do middleware, passa direto
  if (req.headers.get("x-middleware-check") === "1") {
    return NextResponse.next()
  }

  // Lê o token de sessão do cookie do Better Auth
  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value

  // Sem sessão — deixa a página/middleware do Better Auth lidar com auth
  if (!sessionToken) {
    return NextResponse.next()
  }

  // Verifica se esta é a sessão mais recente do usuário
  try {
    const origin =
      process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ??
      req.nextUrl.origin

    const checkUrl = `${origin}/api/auth/session-check`
    const res = await fetch(checkUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
        "x-session-token": sessionToken,
        // Header especial para evitar que o middleware processe esta chamada recursivamente
        "x-middleware-check": "1",
      },
      signal: AbortSignal.timeout(3000),
    })

    if (res.status === 401) {
      // Sessão foi substituída por novo login — desconecta e redireciona
      const loginUrl = new URL("/sign-in", req.url)
      loginUrl.searchParams.set("kicked", "1")
      const response = NextResponse.redirect(loginUrl)
      // Apaga os cookies de sessão para forçar novo login
      response.cookies.delete("better-auth.session_token")
      response.cookies.delete("__Secure-better-auth.session_token")
      return response
    }
  } catch {
    // Falha silenciosa — não bloqueia o usuário em caso de timeout/erro de rede
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

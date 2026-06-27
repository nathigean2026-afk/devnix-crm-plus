import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware mínimo — Edge Runtime compatível.
 *
 * Não importa módulos Node.js (Drizzle/Neon/auth) pois o Edge Runtime
 * não suporta APIs nativas como node:util/types.
 *
 * A sessão única é garantida por revokeOtherSessions() no login (auth-form.tsx).
 * Quando a sessão é revogada no banco, cada Server Component protegido detecta
 * sessão nula via auth.api.getSession() e redireciona para /sign-in.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

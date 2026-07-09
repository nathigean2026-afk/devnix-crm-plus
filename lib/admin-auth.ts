import { NextRequest } from "next/server"

/**
 * Verifica se a requisicao tem sessao de admin valida.
 * Aceita cookie admin_session ou header x-admin-token como fallback
 * (necessario em ambientes de preview onde cookies podem ser bloqueados).
 */
function getAdminToken(): string {
  const t = process.env.ADMIN_SECRET
  if (!t) throw new Error("ADMIN_SECRET não configurado no ambiente.")
  return t
}

export async function verifyAdminSession(req: NextRequest): Promise<boolean> {
  try {
    const validToken = getAdminToken()
    const cookieToken = req.cookies.get("admin_session")?.value
    const headerToken = req.headers.get("x-admin-token")
    return cookieToken === validToken || headerToken === validToken
  } catch {
    return false
  }
}

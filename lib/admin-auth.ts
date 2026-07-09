import { NextRequest } from "next/server"

/**
 * Verifica se a requisicao tem sessao de admin valida.
 * Aceita cookie admin_session ou header x-admin-token como fallback
 * (necessario em ambientes de preview onde cookies podem ser bloqueados).
 */
export async function verifyAdminSession(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get("admin_session")?.value
  const headerToken = req.headers.get("x-admin-token")
  const validToken = "admin-nathigean-001"
  return cookieToken === validToken || headerToken === validToken
}

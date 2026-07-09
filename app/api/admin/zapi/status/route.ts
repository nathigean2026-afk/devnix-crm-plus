import { NextResponse } from "next/server"

// GET /api/admin/zapi/status
// Consulta o status da instância Z-API (conectado, desconectado, etc.)
export async function GET() {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) {
    return NextResponse.json(
      { error: "Credenciais Z-API não configuradas (ZAPI_INSTANCE_ID / ZAPI_TOKEN)" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/status`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(clientToken ? { "Client-Token": clientToken } : {}),
        },
        cache: "no-store",
      }
    )

    const data = await res.json()
    return NextResponse.json({ status: res.status, data })
  } catch {
    return NextResponse.json(
      { error: "Falha ao conectar com a Z-API" },
      { status: 500 }
    )
  }
}

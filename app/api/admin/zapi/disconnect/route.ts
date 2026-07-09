import { NextResponse } from "next/server"

// POST /api/admin/zapi/disconnect
// Desconecta o WhatsApp da instância Z-API (logout)
export async function POST() {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) {
    return NextResponse.json(
      { error: "Credenciais Z-API não configuradas" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/disconnect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(clientToken ? { "Client-Token": clientToken } : {}),
        },
      }
    )

    const data = await res.json()
    return NextResponse.json({ status: res.status, data })
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao desconectar" },
      { status: 500 }
    )
  }
}

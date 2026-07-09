import { NextResponse } from "next/server"

// GET /api/admin/zapi/qrcode
// Busca o QR Code base64 para conectar o WhatsApp à instância Z-API
export async function GET() {
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
      `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code/image`,
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
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao buscar QR Code" },
      { status: 500 }
    )
  }
}

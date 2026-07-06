import { NextRequest, NextResponse } from "next/server"

// POST /api/admin/zapi/test
// Envia uma mensagem de teste para o número informado
export async function POST(req: NextRequest) {
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
    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: "Número de telefone obrigatório" }, { status: 400 })
    }

    // Normaliza: remove não-dígitos, adiciona DDI 55 se necessário
    const digits = String(phone).replace(/\D/g, "")
    const normalized = digits.startsWith("55") ? digits : `55${digits}`

    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(clientToken ? { "Client-Token": clientToken } : {}),
        },
        body: JSON.stringify({
          phone: normalized,
          message:
            "*Elevanthe CRM* ✅\n\nConexão Z-API funcionando corretamente!\n\nSeu sistema está pronto para enviar notificações via WhatsApp.",
        }),
      }
    )

    const data = await res.json()
    return NextResponse.json({ status: res.status, data })
  } catch (err) {
    return NextResponse.json(
      { error: "Falha ao enviar mensagem de teste", detail: String(err) },
      { status: 500 }
    )
  }
}

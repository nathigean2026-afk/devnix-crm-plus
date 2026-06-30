import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token não fornecido." },
        { status: 400 }
      )
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY

    if (!secretKey) {
      // Sem chave configurada: ambiente de desenvolvimento — libera
      return NextResponse.json({ success: true })
    }

    const formData = new FormData()
    formData.append("secret", secretKey)
    formData.append("response", token)
    // Opcional: IP do cliente para maior segurança
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip")
    if (ip) formData.append("remoteip", ip)

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData }
    )

    const result = await response.json()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Verificação de segurança falhou. Tente novamente." },
        { status: 422 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Turnstile] Erro na verificação:", err)
    return NextResponse.json(
      { success: false, error: "Erro interno ao verificar segurança." },
      { status: 500 }
    )
  }
}

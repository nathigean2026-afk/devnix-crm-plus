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
    const isDev = process.env.NODE_ENV === "development"
    const isPreview = process.env.VERCEL_ENV !== "production"

    // Libera tokens de bypass (widget indisponível, dev, sem chave, preview)
    const isBypassToken = token === "dev-bypass-token" || token === "widget-unavailable-bypass"

    if (!secretKey || isDev || isPreview || isBypassToken) {
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

    let response: Response
    try {
      response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body: formData, signal: AbortSignal.timeout(5000) }
      )
    } catch (fetchErr) {
      // Se o Cloudflare não responder (DNS fail, timeout), fail-open e loga
      console.error("[Turnstile] API do Cloudflare indisponível:", fetchErr)
      return NextResponse.json({ success: true })
    }

    const result = await response.json()

    if (!result.success) {
      // Log detalhado dos error-codes da Cloudflare para diagnóstico
      console.error("[Turnstile] Verificação falhou:", {
        "error-codes": result["error-codes"],
        hostname: result.hostname,
        challenge_ts: result.challenge_ts,
      })
      const codes: string[] = result["error-codes"] ?? []
      // Mensagens amigáveis por código de erro
      let userMsg = "Verificação de segurança falhou. Tente novamente."
      if (codes.includes("invalid-input-secret")) {
        userMsg = "Configuração de segurança inválida. Contacte o suporte."
        console.error("[Turnstile] ERRO CRÍTICO: TURNSTILE_SECRET_KEY inválida ou não pertence a este domínio.")
      } else if (codes.includes("timeout-or-duplicate")) {
        userMsg = "O desafio de segurança expirou. Por favor, complete-o novamente."
      } else if (codes.includes("invalid-input-response")) {
        userMsg = "Token de segurança inválido. Recarregue a página e tente novamente."
      }
      return NextResponse.json(
        { success: false, error: userMsg, codes },
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

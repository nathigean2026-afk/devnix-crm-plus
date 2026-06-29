// Script de teste — envia email de confirmação de compra com o novo template
// Uso: node --env-file-if-exists=/vercel/share/.env.project scripts/test-email.mjs

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "Elevanthe CRM <no-reply@elevanthe.com>"

const dateFmt = (d) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

const BRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v))

// Dados de teste
const to = "nathigean2026@gmail.com"
const userName = "Gabriel Nathigean"
const planLabel = "Business"
const planId = "30d"
const amountCents = 3000
const purchasedAt = new Date()
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

const PLAN_FEATURES = {
  "30d": [
    "Tudo do plano Start",
    "Marca propria nos documentos (logo, CNPJ)",
    "Cor de destaque personalizada",
    "Notificacoes quando orcamento e respondido",
    "Suporte prioritario",
  ],
}

const features = PLAN_FEATURES[planId] ?? []
const amount = BRL(amountCents / 100)
const compraData = dateFmt(purchasedAt)
const expiracaoData = dateFmt(expiresAt)

const featureItems = features
  .map(
    (f) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="width:28px; vertical-align:middle;">
                <div style="width:22px; height:22px; background:#eff6ff; border-radius:50%; text-align:center; line-height:22px;">
                  <span style="font-size:11px; color:#2563eb; font-weight:900;">&#10003;</span>
                </div>
              </td>
              <td style="font-size:14px; color:#1e293b; font-weight:500; vertical-align:middle; padding-left:4px;">${f}</td>
            </tr>
          </table>
        </td>
      </tr>`,
  )
  .join("")

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Licenca ativada — Elevanthe CRM</title>
</head>
<body style="margin:0; padding:0; background:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

          <!-- LOGO -->
          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-LjNhveleTE8nzPLasW7Zn3YdJgCoKF.png"
                alt="Elevanthe CRM"
                width="220"
                style="display:block; max-width:220px; height:auto;"
              />
            </td>
          </tr>

          <!-- CARD PRINCIPAL -->
          <tr>
            <td style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(15,23,42,0.08);">

              <!-- BANNER AZUL TOPO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1e40af; padding:40px 40px 36px; text-align:center;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                      <tr>
                        <td style="width:64px; height:64px; background:rgba(255,255,255,0.18); border-radius:50%; text-align:center; vertical-align:middle;">
                          <span style="font-size:28px; line-height:1; display:block; padding-top:16px; color:#ffffff;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0 0 10px; font-size:28px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; line-height:1.15;">
                      Licenca ativada!
                    </h1>
                    <p style="margin:0; font-size:15px; color:rgba(255,255,255,0.75); line-height:1.5;">
                      Seu acesso ao plano <strong style="color:#93c5fd; font-weight:700;">${planLabel}</strong> esta liberado agora
                    </p>
                  </td>
                </tr>
              </table>

              <!-- SAUDACAO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 40px 0;">
                    <p style="margin:0 0 10px; font-size:18px; font-weight:700; color:#0f172a;">
                      Ola, ${userName}!
                    </p>
                    <p style="margin:0; font-size:14px; color:#64748b; line-height:1.75;">
                      Recebemos a confirmacao do seu pagamento via Pix e sua licenca ja esta ativa.
                      Confira os detalhes abaixo e acesse o sistema quando quiser.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- RESUMO DA COMPRA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 0;">
                    <p style="margin:0 0 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">
                      Resumo da compra
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
                      <tr style="background:#f8fafc;">
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#64748b;">Plano contratado</td>
                        <td align="right" style="padding:14px 20px; border-bottom:1px solid #e2e8f0; font-size:14px; font-weight:700; color:#0f172a;">${planLabel}</td>
                      </tr>
                      <tr style="background:#ffffff;">
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#64748b;">Valor pago</td>
                        <td align="right" style="padding:14px 20px; border-bottom:1px solid #e2e8f0; font-size:17px; font-weight:800; color:#16a34a;">${amount}</td>
                      </tr>
                      <tr style="background:#f8fafc;">
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0; font-size:13px; color:#64748b;">Data da compra</td>
                        <td align="right" style="padding:14px 20px; border-bottom:1px solid #e2e8f0; font-size:13px; font-weight:600; color:#334155;">${compraData}</td>
                      </tr>
                      <tr style="background:#ffffff;">
                        <td style="padding:14px 20px; font-size:13px; color:#64748b;">Acesso valido ate</td>
                        <td align="right" style="padding:14px 20px; font-size:14px; font-weight:800; color:#1e40af;">${expiracaoData}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- FEATURES DO PLANO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 40px 0;">
                    <p style="margin:0 0 14px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#94a3b8;">
                      O que esta incluso no seu plano
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${featureItems}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- DIVISOR -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 0;">
                    <div style="height:1px; background:#f1f5f9;"></div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 40px 40px; text-align:center;">
                    <a
                      href="https://crm.elevanthe.com/sign-in"
                      style="display:inline-block; background:#1e40af; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:16px 52px; border-radius:12px; letter-spacing:0.2px;"
                    >
                      Acessar minha conta &rarr;
                    </a>
                    <p style="margin:16px 0 0; font-size:12px; color:#94a3b8;">
                      Ou acesse em
                      <a href="https://crm.elevanthe.com" style="color:#2563eb; text-decoration:none; font-weight:600;">crm.elevanthe.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- BADGE TESTE -->
          <tr>
            <td align="center" style="padding:16px 0 0;">
              <span style="display:inline-block; background:#fef3c7; color:#92400e; font-size:11px; font-weight:600; padding:5px 14px; border-radius:20px; border:1px solid #fcd34d;">
                EMAIL DE TESTE — nao e uma compra real
              </span>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:16px 0 0;">
              <p style="margin:0 0 4px; font-size:12px; color:#94a3b8; font-weight:500;">
                Elevanthe CRM &mdash; Gestao de relacionamento que eleva resultados
              </p>
              <p style="margin:0; font-size:11px; color:#cbd5e1;">
                Este e-mail foi enviado automaticamente. Por favor, nao responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

console.log(`[test-email] Enviando para ${to}...`)

const { data, error } = await resend.emails.send({
  from: FROM_EMAIL,
  to,
  subject: "[TESTE] Sua licenca Business foi ativada — Elevanthe CRM",
  html,
})

if (error) {
  console.error("[test-email] ERRO:", error)
  process.exit(1)
}

console.log("[test-email] Enviado com sucesso! ID:", data?.id)

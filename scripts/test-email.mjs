// Script de teste — envia um email de confirmação de compra de exemplo
// Uso: node --env-file-if-exists=/vercel/share/.env.project scripts/test-email.mjs

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "Elevanthe CRM <no-reply@elevanthe.com>"

const dateFmt = (d) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

const BRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v))

// Dados de teste — simula compra do plano Business
const to = "contato@elevanthe.com"
const userName = "Gabriel Nathigean"
const planLabel = "Business"
const planId = "30d"
const amountCents = 3000
const purchasedAt = new Date()
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

const PLAN_FEATURES = {
  "7d": [
    "Clientes ilimitados",
    "Ordens de Servico ilimitadas",
    "Orcamentos com link publico",
    "Financeiro: receitas e despesas",
    "Relatorios e graficos",
    "Tickets de suporte",
    "Pagamento via Pix",
  ],
  "30d": [
    "Tudo do plano Start",
    "Marca propria nos documentos (logo, CNPJ)",
    "Cor de destaque personalizada",
    "Notificacoes quando orcamento e respondido",
    "Suporte prioritario",
  ],
  "1y": [
    "Tudo do plano Business",
    "1 funcionario auxiliar incluso",
    "Permissoes granulares por modulo",
    "360 dias de acesso completo",
    "Suporte VIP",
  ],
}

const features = PLAN_FEATURES[planId] ?? []
const amount = BRL(amountCents / 100)
const compraData = dateFmt(purchasedAt)
const expiracaoData = dateFmt(expiresAt)

const featureRows = features
  .map(
    (f) => `
      <tr>
        <td style="padding: 7px 0; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9;">
          <span style="display:inline-block; width:20px; color:#2563eb; font-weight:700;">&#10003;</span>
          ${f}
        </td>
      </tr>`,
  )
  .join("")

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <div style="max-width:560px; margin:32px auto; padding:0 16px 32px;">

    <!-- Header com logo -->
    <div style="text-align:center; padding: 32px 0 24px;">
      <img
        src="https://crm.elevanthe.com/elevanthe-logo-transparent-dark.png"
        alt="Elevanthe CRM"
        width="200"
        style="display:inline-block; max-width:200px;"
      />
    </div>

    <!-- Card principal -->
    <div style="background:#0f172a; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15);">

      <!-- Banner de sucesso -->
      <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%); padding: 28px 32px; text-align:center;">
        <div style="width:56px; height:56px; background:rgba(255,255,255,0.15); border-radius:50%; margin:0 auto 12px; line-height:56px; font-size:28px;">
          &#9989;
        </div>
        <h1 style="margin:0; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">
          Licenca ativada com sucesso!
        </h1>
        <p style="margin:8px 0 0; font-size:14px; color:rgba(255,255,255,0.75);">
          Plano <strong style="color:#ffffff;">${planLabel}</strong> &mdash; ${amount}
        </p>
      </div>

      <!-- Saudacao -->
      <div style="padding: 28px 32px 0;">
        <p style="margin:0; font-size:15px; color:#e2e8f0; line-height:1.6;">
          Ola, <strong style="color:#ffffff;">${userName}</strong>!
        </p>
        <p style="margin:10px 0 0; font-size:14px; color:#94a3b8; line-height:1.7;">
          Seu pagamento foi confirmado e seu acesso ja esta liberado.
          Aqui estao os detalhes da sua assinatura:
        </p>
      </div>

      <!-- Detalhes da compra -->
      <div style="margin: 20px 32px; background:#1e293b; border-radius:10px; padding: 18px 20px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <tr>
            <td style="padding:5px 0; color:#64748b;">Plano</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#e2e8f0;">${planLabel}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#64748b;">Valor pago</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#4ade80;">${amount}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#64748b;">Data da compra</td>
            <td style="padding:5px 0; text-align:right; color:#e2e8f0;">${compraData}</td>
          </tr>
          <tr>
            <td style="padding:5px 0; color:#64748b;">Acesso valido ate</td>
            <td style="padding:5px 0; text-align:right; font-weight:700; color:#f8fafc;">${expiracaoData}</td>
          </tr>
        </table>
      </div>

      <!-- Funcionalidades desbloqueadas -->
      <div style="padding: 4px 32px 28px;">
        <p style="margin:0 0 12px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#475569;">
          O que esta incluso no seu plano
        </p>
        <div style="background:#1e293b; border-radius:10px; padding:4px 20px;">
          <table style="width:100%; border-collapse:collapse;">
            ${featureRows}
          </table>
        </div>
      </div>

      <!-- CTA -->
      <div style="padding: 0 32px 32px; text-align:center;">
        <a
          href="https://crm.elevanthe.com/sign-in"
          style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding:14px 36px; border-radius:10px; letter-spacing:0.3px;"
        >
          Acessar minha conta agora
        </a>
        <p style="margin:16px 0 0; font-size:12px; color:#475569;">
          Acesse em <a href="https://crm.elevanthe.com" style="color:#3b82f6; text-decoration:none;">crm.elevanthe.com</a>
        </p>
      </div>
    </div>

    <!-- Badge de teste -->
    <div style="margin:12px 0 0; text-align:center;">
      <span style="display:inline-block; background:#fef3c7; color:#92400e; font-size:11px; font-weight:600; padding:4px 12px; border-radius:20px; border:1px solid #fcd34d;">
        EMAIL DE TESTE — nao e uma compra real
      </span>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:16px 0 0;">
      <p style="margin:0; font-size:11px; color:#94a3b8;">
        Elevanthe CRM &mdash; Gestao de relacionamento que eleva resultados
      </p>
      <p style="margin:4px 0 0; font-size:11px; color:#64748b;">
        Este e-mail foi enviado automaticamente. Nao responda a este endereco.
      </p>
    </div>

  </div>
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

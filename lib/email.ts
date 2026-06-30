import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = "Elevanthe CRM <no-reply@elevanthe.com>"

const BRL = (v: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v))

const dateFmt = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

type QuoteResponseEmailParams = {
  to: string
  providerName?: string | null
  clientName: string
  quoteNumber: number
  quoteTitle: string
  total: string | number
  decision: "aprovado" | "recusado"
  rejectionReason?: string | null
  respondedAt: Date
}

/**
 * Envia e-mail ao prestador quando um cliente aprova ou recusa um orçamento.
 * Falha silenciosamente (loga) para não quebrar o fluxo de resposta do cliente.
 */
export async function sendQuoteResponseEmail(params: QuoteResponseEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn("[v0] RESEND_API_KEY não configurada — e-mail não enviado.")
    return false
  }

  const {
    to,
    providerName,
    clientName,
    quoteNumber,
    quoteTitle,
    total,
    decision,
    rejectionReason,
    respondedAt,
  } = params

  const aprovado = decision === "aprovado"
  const numeroFmt = `#${String(quoteNumber).padStart(4, "0")}`
  const dataFmt = respondedAt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  const accent = aprovado ? "#16a34a" : "#dc2626"
  const statusLabel = aprovado ? "APROVADO" : "RECUSADO"
  const subject = aprovado
    ? `Orçamento ${numeroFmt} aprovado por ${clientName}`
    : `Orçamento ${numeroFmt} recusado por ${clientName}`

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 13px; letter-spacing: 1px; color: #64748b; text-transform: uppercase;">Elevanthe CRM</span>
    </div>
    <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${accent}; color: #ffffff; padding: 16px 24px; font-size: 18px; font-weight: 700;">
        Orçamento ${statusLabel}
      </div>
      <div style="padding: 24px;">
        <p style="margin: 0 0 16px; font-size: 15px;">Olá${providerName ? ` ${providerName}` : ""},</p>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5;">
          O cliente <strong>${clientName}</strong> ${aprovado ? "aprovou" : "recusou"} o seu orçamento.
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #64748b;">Número</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${numeroFmt}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Título</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${quoteTitle}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Valor</td><td style="padding: 6px 0; text-align: right; font-weight: 700; color: ${accent};">${BRL(total)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Respondido em</td><td style="padding: 6px 0; text-align: right;">${dataFmt}</td></tr>
        </table>
        ${
          !aprovado && rejectionReason
            ? `<div style="margin-top: 16px; padding: 12px 16px; background: #fef2f2; border-left: 3px solid ${accent}; border-radius: 6px;">
                 <strong style="display:block; font-size: 13px; color: ${accent}; margin-bottom: 4px;">Motivo da recusa</strong>
                 <span style="font-size: 14px; color: #334155;">${rejectionReason}</span>
               </div>`
            : ""
        }
        ${
          aprovado
            ? `<p style="margin: 20px 0 0; font-size: 14px; color: #16a34a; font-weight: 600;">✓ Uma ordem de serviço foi gerada automaticamente.</p>`
            : ""
        }
      </div>
    </div>
    <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
      Notificação automática do Elevanthe CRM
    </p>
  </div>`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error("[v0] Erro ao enviar e-mail (Resend):", error)
      return false
    }
    return true
  } catch (e) {
    console.error("[v0] Exceção ao enviar e-mail:", e)
    return false
  }
}

// ─── Email de convite de funcionário (Enterprise) ─────────────────────────────

type EmployeeInviteEmailParams = {
  to: string                  // e-mail do funcionário convidado
  companyName: string         // nome da empresa que está convidando
  inviteLink: string          // link completo para aceitar o convite
  expiresAt: Date             // data de expiração do convite
  licenseExpiresAt?: Date | null  // data de expiração da licença Enterprise do dono
}

/**
 * Envia e-mail de convite ao funcionário quando o administrador
 * o adiciona no plano Enterprise.
 */
export async function sendEmployeeInviteEmail(params: EmployeeInviteEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY não configurada — e-mail de convite não enviado.")
    return false
  }

  const { to, companyName, inviteLink, expiresAt, licenseExpiresAt } = params

  const expiracaoConvite = dateFmt(expiresAt)
  const expiracaoLicenca = licenseExpiresAt ? dateFmt(licenseExpiresAt) : null
  const subject = `Você foi convidado para colaborar em ${companyName} — Elevanthe CRM`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7; background-image:repeating-linear-gradient(0deg, transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px); padding:48px 0 56px;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

          <!-- LOGO -->
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; background:#0d1b3e; border-radius:12px; overflow:hidden;">
                <tr>
                  <td style="padding:16px 28px;">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-lP6RanA7XI9rtrXDDhiUZnvYULkoEM.png"
                      alt="Elevanthe CRM"
                      width="200"
                      height="54"
                      style="display:block; max-width:200px; height:auto; border:0;"
                    />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD PRINCIPAL -->
          <tr>
            <td style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.10);">

              <!-- BANNER -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0d1b3e 0%,#1e40af 100%); padding:40px 48px 36px; text-align:center;">
                    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 auto 18px;">
                      <tr>
                        <td style="width:64px; height:64px; background:rgba(255,255,255,0.12); border:2px solid rgba(255,255,255,0.25); border-radius:50%; text-align:center; line-height:60px; font-size:28px; color:#ffffff;">
                          &#128101;
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0 0 10px; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; line-height:1.2;">
                      Você foi convidado!
                    </h1>
                    <p style="margin:0; font-size:15px; color:rgba(255,255,255,0.72); line-height:1.6;">
                      <strong style="color:#93c5fd;">${companyName}</strong> convidou você para<br/>
                      colaborar no Elevanthe CRM.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CORPO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 48px 0;">
                    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#334155;">
                      Olá! Você foi adicionado como funcionário na empresa
                      <strong style="color:#0f172a;">${companyName}</strong> no sistema Elevanthe CRM.
                      Para começar a usar, clique no botão abaixo e aceite o convite.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- INFORMACOES IMPORTANTES -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 48px 0;">
                    <p style="margin:0 0 12px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#94a3b8;">
                      O que você precisa saber
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:14px; border:1px solid #e2e8f0; overflow:hidden;">

                      <tr>
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px; vertical-align:top; padding-top:1px;">
                                <table cellpadding="0" cellspacing="0"><tr><td style="width:24px; height:24px; background:#dbeafe; border-radius:6px; text-align:center; line-height:24px; font-size:13px;">&#128274;</td></tr></table>
                              </td>
                              <td style="padding-left:10px; vertical-align:top;">
                                <p style="margin:0 0 3px; font-size:13px; font-weight:700; color:#0f172a;">Acesso controlado pelo administrador</p>
                                <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                                  Você só tem acesso aos módulos que <strong>${companyName}</strong> liberar para você.
                                  As permissões podem ser alteradas a qualquer momento pelo administrador.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px; vertical-align:top; padding-top:1px;">
                                <table cellpadding="0" cellspacing="0"><tr><td style="width:24px; height:24px; background:#dcfce7; border-radius:6px; text-align:center; line-height:24px; font-size:13px;">&#128197;</td></tr></table>
                              </td>
                              <td style="padding-left:10px; vertical-align:top;">
                                <p style="margin:0 0 3px; font-size:13px; font-weight:700; color:#0f172a;">Validade do convite</p>
                                <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                                  Este convite expira em <strong style="color:#0f172a;">${expiracaoConvite}</strong>.
                                  Após essa data, um novo convite precisará ser enviado.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:14px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px; vertical-align:top; padding-top:1px;">
                                <table cellpadding="0" cellspacing="0"><tr><td style="width:24px; height:24px; background:#fef9c3; border-radius:6px; text-align:center; line-height:24px; font-size:13px;">&#9889;</td></tr></table>
                              </td>
                              <td style="padding-left:10px; vertical-align:top;">
                                <p style="margin:0 0 3px; font-size:13px; font-weight:700; color:#0f172a;">Duração do acesso</p>
                                <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                                  Seu acesso permanece ativo enquanto a licença Enterprise de
                                  <strong>${companyName}</strong> estiver vigente${expiracaoLicenca ? ` (até <strong style="color:#0f172a;">${expiracaoLicenca}</strong>)` : ""}.
                                  O acesso também pode ser encerrado a qualquer momento pelo administrador.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:14px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:32px; vertical-align:top; padding-top:1px;">
                                <table cellpadding="0" cellspacing="0"><tr><td style="width:24px; height:24px; background:#fee2e2; border-radius:6px; text-align:center; line-height:24px; font-size:13px;">&#128683;</td></tr></table>
                              </td>
                              <td style="padding-left:10px; vertical-align:top;">
                                <p style="margin:0 0 3px; font-size:13px; font-weight:700; color:#0f172a;">Dados da empresa</p>
                                <p style="margin:0; font-size:12px; color:#64748b; line-height:1.6;">
                                  Como funcionário, você visualiza dados da empresa mas não tem acesso
                                  às configurações do sistema, planos ou informações de pagamento.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 48px 40px; text-align:center;">
                    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 auto;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb); border-radius:12px;">
                          <a
                            href="${inviteLink}"
                            style="display:block; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:16px 52px; letter-spacing:0.3px;"
                          >
                            Aceitar convite &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0; font-size:12px; color:#94a3b8;">
                      Ou acesse diretamente:<br/>
                      <a href="${inviteLink}" style="color:#2563eb; text-decoration:none; font-weight:500; word-break:break-all;">${inviteLink}</a>
                    </p>
                    <p style="margin:12px 0 0; font-size:11px; color:#cbd5e1;">
                      Caso não reconheça esta empresa, ignore este e-mail com segurança.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:28px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 28px; background:#0d1b3e; border-radius:14px;">
                    <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:#e2e8f0;">Equipe Elevanthe CRM</p>
                    <p style="margin:0 0 10px; font-size:12px; color:#64748b; line-height:1.6;">
                      Gestão de relacionamento que eleva resultados.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding-right:12px;">
                          <a href="https://crm.elevanthe.com" style="font-size:11px; color:#3b82f6; text-decoration:none; font-weight:600;">crm.elevanthe.com</a>
                        </td>
                        <td style="color:#334155; font-size:11px; padding-right:12px;">|</td>
                        <td>
                          <a href="mailto:contato@elevanthe.com" style="font-size:11px; color:#3b82f6; text-decoration:none; font-weight:600;">contato@elevanthe.com</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0; padding-top:14px; border-top:1px solid #1e293b; font-size:10px; color:#334155; line-height:1.6;">
                      Este e-mail foi enviado para <strong style="color:#475569;">${to}</strong> porque o administrador
                      da empresa <strong style="color:#475569;">${companyName}</strong> inseriu este endereço como funcionário.
                      Se não reconhece este convite, simplesmente ignore este e-mail.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error("[email] Erro ao enviar convite de funcionario:", error)
      return false
    }
    return true
  } catch (e) {
    console.error("[email] Excecao ao enviar convite de funcionario:", e)
    return false
  }
}

// ─── Email de confirmação de compra ───────────────────────────────────────────

type PurchaseConfirmationEmailParams = {
  to: string
  userName: string
  planName: string     // ex: "Business"
  planId: string       // ex: "30d"
  amountCents: number  // ex: 3000
  durationDays: number // ex: 30
  purchasedAt: Date
  expiresAt: Date
}

const PLAN_FEATURES: Record<string, string[]> = {
  "7d": [
    "Clientes ilimitados",
    "Ordens de Serviço ilimitadas",
    "Orçamentos com link público",
    "Financeiro: receitas e despesas",
    "Relatórios e gráficos",
    "Tickets de suporte",
    "Pagamento via Pix",
  ],
  "30d": [
    "Tudo do plano Start",
    "Marca própria nos documentos (logo, CNPJ)",
    "Cor de destaque personalizada",
    "Notificações quando orçamento é respondido",
    "Suporte prioritário",
  ],
  "1y": [
    "Tudo do plano Business",
    "1 funcionário auxiliar incluso",
    "Permissões granulares por módulo",
    "360 dias de acesso completo",
    "Suporte VIP",
  ],
}

const PLAN_LABELS: Record<string, string> = {
  "7d": "Start",
  "30d": "Business",
  "1y": "Enterprise",
}

export async function sendPurchaseConfirmationEmail(
  params: PurchaseConfirmationEmailParams,
): Promise<boolean> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY nao configurada — e-mail de compra nao enviado.")
    return false
  }

  const { to, userName, planId, amountCents, purchasedAt, expiresAt } = params
  const planLabel = PLAN_LABELS[planId] ?? params.planName
  const features = PLAN_FEATURES[planId] ?? []
  const amount = BRL(amountCents / 100)
  const compraData = dateFmt(purchasedAt)
  const expiracaoData = dateFmt(expiresAt)
  const subject = `Sua licença ${planLabel} foi ativada — Elevanthe CRM`

  const featureItems = features
    .map(
      (f) => `
      <tr>
        <td style="padding:11px 0; border-bottom:1px solid #e2e8f0;">
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%;">
            <tr>
              <td style="width:30px; vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="width:24px; height:24px; background:#dbeafe; border-radius:50%; text-align:center; line-height:24px; font-size:12px; color:#1d4ed8; font-weight:900;">&#10003;</td></tr>
                </table>
              </td>
              <td style="font-size:14px; color:#1e293b; font-weight:500; vertical-align:middle; padding-left:8px;">${f}</td>
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
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- BACKGROUND COM PADRAO SUTIL -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7; background-image:repeating-linear-gradient(0deg, transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px); padding:48px 0 56px;">
    <tr>
      <td align="center" style="padding:0 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

          <!-- ===== LOGO HEADER ===== -->
          <tr>
            <td align="center" style="padding:0 0 20px;">
              <!-- Logo primeira versao: fundo #0d1b3e, elefante branco, texto branco/azul -->
              <!-- Renderizada sobre wrapper com fundo escuro para garantir visibilidade -->
              <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; background:#0d1b3e; border-radius:12px; overflow:hidden;">
                <tr>
                  <td style="padding:16px 28px;">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-lP6RanA7XI9rtrXDDhiUZnvYULkoEM.png"
                      alt="Elevanthe CRM — Gestão de Relacionamento que Eleva Resultados"
                      width="260"
                      height="70"
                      style="display:block; max-width:260px; height:auto; border:0;"
                    />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== CARD PRINCIPAL ===== -->
          <tr>
            <td style="background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.10);">

              <!-- BANNER TOPO: azul escuro com checkmark -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0d1b3e 0%,#1e40af 100%); padding:40px 48px 36px; text-align:center;">
                    <!-- Circulo de sucesso -->
                    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 auto 18px;">
                      <tr>
                        <td style="width:64px; height:64px; background:rgba(255,255,255,0.12); border:2px solid rgba(255,255,255,0.25); border-radius:50%; text-align:center; line-height:60px; font-size:30px; color:#ffffff;">
                          &#10003;
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0 0 10px; font-size:28px; font-weight:800; color:#ffffff; letter-spacing:-0.5px; line-height:1.2;">
                      Licença ativada com sucesso!
                    </h1>
                    <p style="margin:0; font-size:15px; color:rgba(255,255,255,0.72); line-height:1.6;">
                      Seu acesso ao plano <strong style="color:#93c5fd; font-weight:700;">${planLabel}</strong> já está liberado.<br/>
                      Bem-vindo ao Elevanthe CRM!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- SAUDAÇÃO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 48px 0;">
                    <p style="margin:0 0 10px; font-size:17px; font-weight:700; color:#0f172a;">
                      Olá, ${userName}!
                    </p>
                    <p style="margin:0; font-size:14px; color:#64748b; line-height:1.75;">
                      Recebemos a confirmação do seu pagamento via Pix e sua licença já está ativa.
                      Confira os detalhes abaixo e acesse o sistema quando quiser.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- RESUMO DA COMPRA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 48px 0;">
                    <p style="margin:0 0 10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#94a3b8;">
                      Resumo da compra
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border-radius:14px; border:1px solid #e2e8f0; overflow:hidden;">
                      <tr>
                        <td style="padding:15px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Plano contratado</td>
                              <td align="right" style="font-size:14px; font-weight:700; color:#0f172a;">${planLabel}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:15px 20px; border-bottom:1px solid #e2e8f0; background:#f0fdf4;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Valor pago</td>
                              <td align="right" style="font-size:17px; font-weight:800; color:#15803d;">${amount}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:15px 20px; border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Data da compra</td>
                              <td align="right" style="font-size:13px; font-weight:600; color:#334155;">${compraData}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:15px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:13px; color:#64748b;">Acesso válido até</td>
                              <td align="right" style="font-size:14px; font-weight:800; color:#1d4ed8;">${expiracaoData}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- O QUE ESTÁ INCLUSO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:24px 48px 0;">
                    <p style="margin:0 0 10px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#94a3b8;">
                      O que está incluso no seu plano
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${featureItems}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 48px 40px; text-align:center;">
                    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 auto;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb); border-radius:12px;">
                          <a
                            href="https://crm.elevanthe.com/sign-in"
                            style="display:block; color:#ffffff; text-decoration:none; font-size:15px; font-weight:700; padding:16px 52px; letter-spacing:0.3px;"
                          >
                            Acessar minha conta &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0; font-size:12px; color:#94a3b8;">
                      Acesse em <a href="https://crm.elevanthe.com" style="color:#2563eb; text-decoration:none; font-weight:600;">crm.elevanthe.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ===== ASSINATURA / FOOTER ===== -->
          <tr>
            <td style="padding:28px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:24px 28px; background:#0d1b3e; border-radius:14px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;">
                          <p style="margin:0 0 4px; font-size:13px; font-weight:700; color:#e2e8f0;">Equipe Elevanthe CRM</p>
                          <p style="margin:0 0 10px; font-size:12px; color:#64748b; line-height:1.6;">
                            Gestão de relacionamento que eleva resultados.<br/>
                            Dúvidas? Acesse nosso suporte dentro do sistema.
                          </p>
                          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                              <td style="padding-right:12px;">
                                <a href="https://crm.elevanthe.com" style="font-size:11px; color:#3b82f6; text-decoration:none; font-weight:600;">crm.elevanthe.com</a>
                              </td>
                              <td style="color:#334155; font-size:11px; padding-right:12px;">|</td>
                              <td>
                                <a href="mailto:contato@elevanthe.com" style="font-size:11px; color:#3b82f6; text-decoration:none; font-weight:600;">contato@elevanthe.com</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:16px; border-top:1px solid #1e293b; padding-top:16px;">
                      <tr>
                        <td style="padding-top:14px; font-size:10px; color:#334155; line-height:1.6;">
                          Este e-mail foi enviado automaticamente para <strong style="color:#475569;">${to}</strong>.
                          Por favor, não responda diretamente a esta mensagem.
                          Você recebeu este e-mail porque realizou uma compra no Elevanthe CRM.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    if (error) {
      console.error("[email] Erro ao enviar confirmacao de compra:", error)
      return false
    }
    return true
  } catch (e) {
    console.error("[email] Excecao ao enviar confirmacao de compra:", e)
    return false
  }
}

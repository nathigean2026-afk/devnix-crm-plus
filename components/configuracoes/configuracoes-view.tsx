"use client"

import { useState, useTransition, useRef } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { upsertBusinessProfile, redeemPromoCode } from "@/lib/actions"
import type { BusinessProfile } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sun, Moon, Monitor, Building2, Shield, Palette, Upload, X, QrCode, BadgeCheck, Bell, Tag, Lock } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LicenseInfo {
  isActive: boolean
  expiresAt: Date | null
  daysLeft: number
}

interface ConfiguracoesViewProps {
  user: { name: string; email: string; id: string }
  profile: BusinessProfile | null
  license: LicenseInfo
}

const pixTypeLabels: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave Aleatória",
}

// Retorna se o plano atual permite personalização de marca
function canCustomizeBrand(plan: string | null | undefined): boolean {
  const p = (plan ?? "starter").toLowerCase()
  return p === "business" || p === "enterprise"
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

// Bloco de bloqueio para campos restritos ao plano Start.
// Usa layout de fluxo normal (sem absolute) para nunca vazar sobre outros elementos.
function PlanGate({ locked, planRequired = "Business", featureName, featureBenefit }: {
  children: React.ReactNode
  locked: boolean
  planRequired?: string
  featureName?: string
  featureBenefit?: string
}) {
  if (!locked) return null

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-5">
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1.5">
        <Lock className="size-3.5 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          {featureName ? `${featureName} — ` : ""}Plano {planRequired}+
        </span>
      </div>
      {featureBenefit && (
        <p className="text-xs text-muted-foreground text-center max-w-[240px] leading-relaxed">
          {featureBenefit}
        </p>
      )}
      <a
        href="/planos?renovar=1"
        className="text-xs text-primary-foreground bg-primary hover:bg-primary/90 font-semibold rounded-full px-4 py-1.5 transition-colors"
      >
        Fazer upgrade
      </a>
    </div>
  )
}

function LicenseCard({
  license,
  profile,
}: {
  license: LicenseInfo
  profile: BusinessProfile | null
}) {
  const [alertEnabled, setAlertEnabled] = useState(profile?.notifAlertEnabled ?? false)
  const [quoteNotifEnabled, setQuoteNotifEnabled] = useState(profile?.notifQuoteEnabled ?? true)
  const [promoCode, setPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [savingToggle, setSavingToggle] = useState(false)

  const { expiresAt, daysLeft, isActive } = license
  const plan = (profile?.licensePlan ?? "starter").toLowerCase()
  const isStart = plan === "starter" || plan === "start"

  const expiryStr = expiresAt
    ? expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—"
  const isWarning = isActive && daysLeft <= 7
  const isExpired = !isActive

  async function handleToggle(field: "notifAlertEnabled" | "notifQuoteEnabled", value: boolean) {
    if (field === "notifAlertEnabled") setAlertEnabled(value)
    else setQuoteNotifEnabled(value)
    setSavingToggle(true)
    try {
      await upsertBusinessProfile({ [field]: value })
      toast.success("Preferencia salva.")
    } catch {
      toast.error("Erro ao salvar preferencia.")
      if (field === "notifAlertEnabled") setAlertEnabled(!value)
      else setQuoteNotifEnabled(!value)
    } finally {
      setSavingToggle(false)
    }
  }

  async function handleRedeemPromo(e: React.FormEvent) {
    e.preventDefault()
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const result = await redeemPromoCode(promoCode.trim())
      const expiry = new Date(result.newExpiry).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
      })
      toast.success(`Codigo ativado! +${result.days} dias no plano ${result.planName}. Novo vencimento: ${expiry}.`)
      setPromoCode("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar codigo.")
    } finally {
      setPromoLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-5 text-primary" />
          <CardTitle className="text-foreground text-lg">Licenca</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Informacoes sobre sua assinatura ativa.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Plano */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Plano atual</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.licensePlan ?? "Starter"}</p>
          </div>
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium",
            isActive ? "text-green-600 bg-green-500/10" : "text-red-500 bg-red-500/10"
          )}>
            {isActive ? "Ativo" : "Expirado"}
          </span>
        </div>

        {/* Validade */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Validade</p>
            <p className="text-xs text-muted-foreground">Expira em {expiryStr}</p>
          </div>
          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-semibold",
            isExpired ? "bg-red-500/10 text-red-500"
              : isWarning ? "bg-yellow-500/10 text-yellow-600"
              : "bg-blue-500/10 text-blue-600"
          )}>
            {isExpired ? "Expirada" : `${daysLeft} dias restantes`}
          </span>
        </div>

        {isWarning && !isExpired && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
              Sua licenca expira em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}.
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              Renove agora ou use um codigo promocional para nao perder o acesso.
            </p>
          </div>
        )}

        {/* Renovar */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Renovar licenca</p>
            <p className="text-xs text-muted-foreground">Adquira mais dias de acesso.</p>
          </div>
          <a
            href="/planos?renovar=1"
            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Ver planos
          </a>
        </div>

        {/* Codigo Promocional */}
        <div className="py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Codigo promocional ou de teste</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Insira um codigo fornecido para adicionar dias ao seu plano.
          </p>
          <form onSubmit={handleRedeemPromo} className="flex gap-2">
            <Input
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="CODIGO-PROMO"
              className="bg-input border-border font-mono uppercase text-sm"
              maxLength={32}
            />
            <Button
              type="submit"
              disabled={promoLoading || !promoCode.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            >
              {promoLoading ? "Ativando..." : "Ativar"}
            </Button>
          </form>
        </div>

        {/* Toggle: Alerta de vencimento — disponivel em todos os planos */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground shrink-0" />
              Alerta 7 dias antes do vencimento
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              {alertEnabled
                ? "Voce recebera uma notificacao quando faltarem 7 dias."
                : "Ative para ser avisado antes de sua licenca expirar."}
            </p>
          </div>
          <Toggle
            checked={alertEnabled}
            onChange={v => handleToggle("notifAlertEnabled", v)}
          />
        </div>

        {/* Toggle: Notificacoes de orcamento — BLOQUEADO no plano Start */}
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground shrink-0" />
              Notificacoes de resposta de orcamento
              {isStart && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 ml-1">
                  <Lock className="size-3" />
                  Business+
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              {isStart
                ? "Disponivel a partir do plano Business. Faca upgrade para ativar."
                : quoteNotifEnabled
                  ? "Voce sera notificado quando um cliente aprovar ou recusar um orcamento."
                  : "Notificacoes desativadas."}
            </p>
          </div>
          <Toggle
            checked={isStart ? false : quoteNotifEnabled}
            onChange={v => !isStart && handleToggle("notifQuoteEnabled", v)}
            disabled={isStart}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfiguracoesView({ user, profile, license }: ConfiguracoesViewProps) {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const plan = (profile?.licensePlan ?? "starter").toLowerCase()
  const isStart = plan === "starter" || plan === "start"
  const brandUnlocked = canCustomizeBrand(plan)

  const [form, setForm] = useState({
    name: profile?.name ?? "",
    document: profile?.document ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    website: profile?.website ?? "",
    pixKey: profile?.pixKey ?? "",
    pixType: profile?.pixType ?? "cpf",
    logo: profile?.logo ?? "",
  })

  const [logoPreview, setLogoPreview] = useState<string>(profile?.logo ?? "")

  function handleChange(field: keyof typeof form, value: string) {
    if (!brandUnlocked && (field === "name" || field === "document" || field === "logo")) return
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!brandUnlocked) return
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo muito grande. Maximo 2MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setLogoPreview(base64)
      setForm(f => ({ ...f, logo: base64 }))
    }
    reader.readAsDataURL(file)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        // Para o plano Start, nao salva nome, documento e logo (bloqueados)
        const payload = brandUnlocked
          ? form
          : { ...form, name: profile?.name ?? "", document: profile?.document ?? "", logo: profile?.logo ?? "" }
        await upsertBusinessProfile(payload)
        toast.success("Configuracoes salvas com sucesso!")
      } catch {
        toast.error("Erro ao salvar configuracoes.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Banner informativo para plano Start */}
      {isStart && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
          <Lock className="size-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Voce esta no plano Start
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Personalizacao de marca (logotipo, nome, CNPJ/CPF e Chave Pix) e notificacoes de orcamento estao disponiveis
              a partir do plano <strong>Business</strong>.{" "}
              <a href="/planos?renovar=1" className="underline font-medium">Fazer upgrade agora</a>
            </p>
          </div>
        </div>
      )}

      {/* Dados da Empresa */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Dados da Empresa / Negocio</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Estas informacoes aparecem nos orcamentos e ordens de servico gerados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Logo */}
          {isStart ? (
            <PlanGate
              locked={isStart}
              featureName="Logotipo"
              featureBenefit="Adicione a logo da sua empresa nos orcamentos e ordens de servico enviados aos clientes."
            />
          ) : (
            <div className="flex flex-col gap-2">
              <Label className="text-foreground text-sm font-medium">Logotipo</Label>
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt="Logo da empresa"
                      width={80}
                      height={80}
                      style={{ width: 80, height: "auto" }}
                      className="object-contain"
                    />
                  ) : (
                    <Building2 className="size-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    {logoPreview ? "Trocar logo" : "Carregar logo"}
                  </Button>
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => { setLogoPreview(""); setForm(f => ({ ...f, logo: "" })) }}
                    >
                      <X className="size-4" />
                      Remover
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Max. 2MB.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nome — bloqueado no Start */}
            <PlanGate
              locked={isStart}
              featureName="Nome da empresa"
              featureBenefit="Seu nome comercial aparecera no cabecalho dos orcamentos e ordens de servico."
            >
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="biz-name" className="text-foreground text-sm">Nome da empresa / negocio</Label>
                <Input
                  id="biz-name"
                  value={brandUnlocked ? form.name : "Elevanthe CRM"}
                  onChange={e => handleChange("name", e.target.value)}
                  placeholder="Elevanthe Solucoes Web"
                  disabled={!brandUnlocked}
                  className="bg-input border-border"
                />
              </div>
            </PlanGate>

            {/* CPF/CNPJ — bloqueado no Start */}
            <PlanGate
              locked={isStart}
              featureName="CPF / CNPJ"
              featureBenefit="Identifique sua empresa legalmente nos documentos gerados para seus clientes."
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="biz-doc" className="text-foreground text-sm">CPF / CNPJ</Label>
                <Input
                  id="biz-doc"
                  value={brandUnlocked ? form.document : ""}
                  onChange={e => handleChange("document", e.target.value)}
                  placeholder="00.000.000/0001-00"
                  disabled={!brandUnlocked}
                  className="bg-input border-border"
                />
              </div>
            </PlanGate>

            {/* Telefone — disponivel em todos os planos */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-phone" className="text-foreground text-sm">Telefone / WhatsApp</Label>
              <Input id="biz-phone" value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(11) 99999-9999" className="bg-input border-border" />
            </div>

            {/* Email comercial — disponivel em todos os planos */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-email" className="text-foreground text-sm">E-mail comercial</Label>
              <Input id="biz-email" type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="contato@empresa.com.br" className="bg-input border-border" />
            </div>

            {/* Website — disponivel em todos os planos */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-website" className="text-foreground text-sm">Website</Label>
              <Input id="biz-website" value={form.website} onChange={e => handleChange("website", e.target.value)} placeholder="https://empresa.com.br" className="bg-input border-border" />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="biz-address" className="text-foreground text-sm">Endereco</Label>
              <Input id="biz-address" value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Rua Exemplo, 123" className="bg-input border-border" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-city" className="text-foreground text-sm">Cidade</Label>
              <Input id="biz-city" value={form.city} onChange={e => handleChange("city", e.target.value)} placeholder="Sao Paulo" className="bg-input border-border" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-state" className="text-foreground text-sm">Estado</Label>
              <Input id="biz-state" value={form.state} onChange={e => handleChange("state", e.target.value.toUpperCase())} placeholder="SP" maxLength={2} className="bg-input border-border uppercase" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chave Pix — bloqueado no plano Start */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Chave Pix</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            A chave Pix e usada para gerar o QR Code nas ordens de servico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanGate
            locked={isStart}
            featureName="Chave Pix"
            featureBenefit="Gere QR Codes Pix automaticamente nas ordens de servico para seus clientes pagarem na hora."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Tipo de chave</Label>
                <Select value={form.pixType ?? "cpf"} onValueChange={v => handleChange("pixType", v)} disabled={isStart}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(pixTypeLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="pix-key" className="text-foreground text-sm">Chave Pix</Label>
                <Input
                  id="pix-key"
                  value={form.pixKey}
                  onChange={e => handleChange("pixKey", e.target.value)}
                  disabled={isStart}
                  placeholder={
                    form.pixType === "cpf" ? "000.000.000-00" :
                    form.pixType === "email" ? "contato@empresa.com" :
                    form.pixType === "telefone" ? "+55 11 99999-9999" : "Cole sua chave aqui"
                  }
                  className="bg-input border-border"
                />
              </div>
            </div>
          </PlanGate>
        </CardContent>
      </Card>

      {/* Aparencia */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Aparencia</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">Escolha o tema da interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "light", icon: Sun, label: "Claro", desc: "Interface clara e limpa" },
              { value: "dark", icon: Moon, label: "Escuro", desc: "Modo escuro para conforto visual" },
              { value: "system", icon: Monitor, label: "Sistema", desc: "Segue a preferencia do sistema" },
            ] as const).map(({ value, icon: Icon, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all text-center cursor-pointer",
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                )}
              >
                <Icon className="size-6" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seguranca */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Seguranca</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">Informacoes de acesso e seguranca.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Senha</p>
              <p className="text-xs text-muted-foreground">Proteja sua conta com uma senha forte.</p>
            </div>
            <Button variant="outline" size="sm">Alterar senha</Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">E-mail de acesso</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licenca */}
      <LicenseCard license={license} profile={profile} />

      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-40"
        >
          {isPending ? "Salvando..." : "Salvar configuracoes"}
        </Button>
      </div>
    </div>
  )
}

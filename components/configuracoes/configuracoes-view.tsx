"use client"

import { useState, useTransition, useRef } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { upsertBusinessProfile, redeemPromoCode } from "@/lib/actions"
import { authClient } from "@/lib/auth-client"
import type { BusinessProfile } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sun, Moon, Monitor, Building2, Shield, Palette, Upload, X, QrCode, BadgeCheck, Bell, Tag, Lock, FileText, MessageSquare, CheckCircle2, CalendarDays, AlignLeft, Smartphone, Eye, EyeOff, KeyRound } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  /** Quando true, oculta a seção de licença e planos (funcionários não podem gerenciar licença) */
  isEmployee?: boolean
}

const pixTypeLabels: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave Aleatória",
}

// Paleta de cores pré-definidas para os documentos
const ACCENT_COLORS = [
  { value: "#1e3a5f", label: "Azul-marinho" },
  { value: "#1d4ed8", label: "Azul" },
  { value: "#0369a1", label: "Azul-ciano" },
  { value: "#7c3aed", label: "Violeta" },
  { value: "#059669", label: "Esmeralda" },
  { value: "#16a34a", label: "Verde" },
  { value: "#d97706", label: "Âmbar" },
  { value: "#ea580c", label: "Laranja" },
  { value: "#dc2626", label: "Vermelho" },
  { value: "#1f2937", label: "Grafite" },
]

function canCustomizeBrand(plan: string | null | undefined): boolean {
  const p = (plan ?? "starter").toLowerCase()
  return p === "business" || p === "enterprise"
}

function canCustomizeColor(plan: string | null | undefined): boolean {
  // Cor de destaque disponível a partir do Business
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

function PlanGate({ locked, planRequired = "Business", featureName, featureBenefit, children }: {
  children?: React.ReactNode
  locked: boolean
  planRequired?: string
  featureName?: string
  featureBenefit?: string
}) {
  if (!locked) return <>{children}</>

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
  const [whatsappPhone, setWhatsappPhone] = useState(profile?.whatsappPhone ?? "")
  const [savingWhatsapp, setSavingWhatsapp] = useState(false)
  const [whatsappSaved, setWhatsappSaved] = useState(false)

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
      toast.success("Preferência salva.")
    } catch {
      toast.error("Erro ao salvar preferência.")
      if (field === "notifAlertEnabled") setAlertEnabled(!value)
      else setQuoteNotifEnabled(!value)
    } finally {
      setSavingToggle(false)
    }
  }

  async function handleSaveWhatsapp() {
    setSavingWhatsapp(true)
    try {
      await upsertBusinessProfile({ whatsappPhone: whatsappPhone.trim() })
      setWhatsappSaved(true)
      setTimeout(() => setWhatsappSaved(false), 3000)
    } catch {
      // silencioso
    } finally {
      setSavingWhatsapp(false)
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
      toast.success(`Código ativado! +${result.days} dias no plano ${result.planName}. Novo vencimento: ${expiry}.`)
      setPromoCode("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar código.")
    } finally {
      setPromoLoading(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="size-5 text-primary" />
          <CardTitle className="text-foreground text-lg">Licença</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Informações sobre sua assinatura ativa.
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
              Sua licença expira em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}.
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              Renove agora ou use um código promocional para não perder o acesso.
            </p>
          </div>
        )}

        {/* Renovar */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Renovar licença</p>
            <p className="text-xs text-muted-foreground">Adquira mais dias de acesso.</p>
          </div>
          <a
            href="/planos?renovar=1"
            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Ver planos
          </a>
        </div>

        {/* Código Promocional */}
        <div className="py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Código promocional ou de teste</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Insira um código fornecido para adicionar dias ao seu plano.
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

        {/* Toggle: Alerta de vencimento */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground shrink-0" />
              Alerta 7 dias antes do vencimento
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              {alertEnabled
                ? "Você receberá uma notificação quando faltarem 7 dias."
                : "Ative para ser avisado antes de sua licença expirar."}
            </p>
          </div>
          <Toggle
            checked={alertEnabled}
            onChange={v => handleToggle("notifAlertEnabled", v)}
            disabled={savingToggle}
          />
        </div>

        {/* Toggle: Notificações de orçamento */}
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground shrink-0" />
              Notificações de resposta de orçamento
              {isStart && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 ml-1">
                  <Lock className="size-3" />
                  Business+
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              {isStart
                ? "Disponível a partir do plano Business. Faça upgrade para ativar."
                : quoteNotifEnabled
                  ? "Você será notificado quando um cliente aprovar ou recusar um orçamento."
                  : "Notificações desativadas."}
            </p>
          </div>
          <Toggle
            checked={isStart ? false : quoteNotifEnabled}
            onChange={v => !isStart && handleToggle("notifQuoteEnabled", v)}
            disabled={isStart || savingToggle}
          />
        </div>

        {/* Notificações via WhatsApp */}
        <div className="pt-2 border-t border-border mt-2">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="size-4 text-green-500 shrink-0" />
            <p className="text-sm font-medium text-foreground">Receba notificações no seu WhatsApp</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Quando um cliente aprovar ou recusar um orçamento, você recebe uma mensagem instantânea no número abaixo.
          </p>
          <div className="flex gap-2 items-center">
            <Input
              value={whatsappPhone}
              onChange={e => setWhatsappPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="bg-input border-border text-sm max-w-64"
              type="tel"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSaveWhatsapp}
              disabled={savingWhatsapp}
              className="bg-green-600 hover:bg-green-700 text-white shrink-0"
            >
              {savingWhatsapp ? "Salvando..." : whatsappSaved ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  Salvo
                </span>
              ) : "Salvar"}
            </Button>
          </div>
          {whatsappPhone && (
            <p className="text-xs text-muted-foreground mt-2">
              Notificacoes serao enviadas para <span className="font-medium text-foreground">{whatsappPhone}</span>.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfiguracoesView({ user, profile, license, isEmployee = false }: ConfiguracoesViewProps) {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Dialog de alterar senha
  const [pwOpen, setPwOpen] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false })

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) {
      toast.error("As senhas novas não coincidem.")
      return
    }
    if (pwForm.next.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }
    setPwLoading(true)
    try {
      const result = await authClient.changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
        revokeOtherSessions: false,
      })
      if (result.error) {
        toast.error(result.error.message ?? "Erro ao alterar senha. Verifique sua senha atual.")
      } else {
        toast.success("Senha alterada com sucesso!")
        setPwOpen(false)
        setPwForm({ current: "", next: "", confirm: "" })
      }
    } catch {
      toast.error("Erro inesperado ao alterar senha.")
    } finally {
      setPwLoading(false)
    }
  }

  const plan = (profile?.licensePlan ?? "starter").toLowerCase()
  const isStart = plan === "starter" || plan === "start"
  const brandUnlocked = canCustomizeBrand(plan)
  const colorUnlocked = canCustomizeColor(plan)

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
    docAccentColor: profile?.docAccentColor ?? "#1d4ed8",
    quoteDefaultValidity: profile?.quoteDefaultValidity ?? 30,
    quoteWhatsappTemplate: profile?.quoteWhatsappTemplate ?? "",
    docFooter: profile?.docFooter ?? "",
  })

  const [logoPreview, setLogoPreview] = useState<string>(profile?.logo ?? "")

  function handleChange(field: keyof typeof form, value: string) {
    if (!brandUnlocked && (field === "name" || field === "document" || field === "logo")) return
    if (!colorUnlocked && field === "docAccentColor") return
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!brandUnlocked) return
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo muito grande. Máximo 2 MB.")
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
        const payload = brandUnlocked
          ? form
          : { ...form, name: profile?.name ?? "", document: profile?.document ?? "", logo: profile?.logo ?? "" }
        await upsertBusinessProfile(payload)
        toast.success("Configurações salvas com sucesso!")
      } catch {
        toast.error("Erro ao salvar configurações.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Banner para funcionários — acesso somente leitura nas configurações da empresa */}
      {isEmployee && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex items-start gap-3">
          <Lock className="size-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Acesso somente leitura
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
              Você está acessando como funcionário. Os dados da empresa e configurações avancadas
              só podem ser editados pelo administrador da conta.
            </p>
          </div>
        </div>
      )}

      {/* Banner informativo para plano Start — não exibir para funcionários */}
      {isStart && !isEmployee && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
          <Lock className="size-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Você está no plano Start
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Personalização de marca (logotipo, nome, CNPJ/CPF e Chave Pix) e notificações de orçamento estão disponíveis
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
            <CardTitle className="text-foreground text-lg">Dados da Empresa / Negócio</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Estas informações aparecem nos orçamentos e ordens de serviço gerados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Logo */}
          {isStart && !isEmployee ? (
            <PlanGate
              locked={isStart}
              featureName="Logotipo"
              featureBenefit="Adicione a logo da sua empresa nos orçamentos e ordens de serviço enviados aos clientes."
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
                {/* Funcionários não podem trocar o logo */}
                {!isEmployee && (
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
                    <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx. 2 MB.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Nome */}
            <PlanGate
              locked={isStart && !isEmployee}
              featureName="Nome da empresa"
              featureBenefit="Seu nome comercial aparecerá no cabeçalho dos orçamentos e ordens de serviço."
            >
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="biz-name" className="text-foreground text-sm">Nome da empresa / negócio</Label>
                <Input
                  id="biz-name"
                  value={brandUnlocked || isEmployee ? form.name : "Elevanthe CRM"}
                  onChange={e => handleChange("name", e.target.value)}
                  placeholder="Elevanthe Soluções Web"
                  disabled={isEmployee || !brandUnlocked}
                  className="bg-input border-border"
                />
              </div>
            </PlanGate>

            {/* CPF/CNPJ */}
            <PlanGate
              locked={isStart && !isEmployee}
              featureName="CPF / CNPJ"
              featureBenefit="Identifique sua empresa legalmente nos documentos gerados para seus clientes."
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="biz-doc" className="text-foreground text-sm">CPF / CNPJ</Label>
                <Input
                  id="biz-doc"
                  value={brandUnlocked || isEmployee ? form.document : ""}
                  onChange={e => handleChange("document", e.target.value)}
                  placeholder="00.000.000/0001-00"
                  disabled={isEmployee || !brandUnlocked}
                  className="bg-input border-border"
                />
              </div>
            </PlanGate>

            {/* Telefone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-phone" className="text-foreground text-sm">Telefone / WhatsApp</Label>
              <Input id="biz-phone" value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="(11) 99999-9999" disabled={isEmployee} className="bg-input border-border" />
            </div>

            {/* Email comercial */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-email" className="text-foreground text-sm">E-mail comercial</Label>
              <Input id="biz-email" type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} placeholder="contato@empresa.com.br" disabled={isEmployee} className="bg-input border-border" />
            </div>

            {/* Website */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-website" className="text-foreground text-sm">Website</Label>
              <Input id="biz-website" value={form.website} onChange={e => handleChange("website", e.target.value)} placeholder="https://empresa.com.br" disabled={isEmployee} className="bg-input border-border" />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="biz-address" className="text-foreground text-sm">Endereço</Label>
              <Input id="biz-address" value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="Rua Exemplo, 123" disabled={isEmployee} className="bg-input border-border" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-city" className="text-foreground text-sm">Cidade</Label>
              <Input id="biz-city" value={form.city} onChange={e => handleChange("city", e.target.value)} placeholder="São Paulo" disabled={isEmployee} className="bg-input border-border" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-state" className="text-foreground text-sm">Estado</Label>
              <Input id="biz-state" value={form.state} onChange={e => handleChange("state", e.target.value.toUpperCase())} placeholder="SP" maxLength={2} disabled={isEmployee} className="bg-input border-border uppercase" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chave Pix */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Chave Pix</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            A chave Pix é usada para gerar o QR Code nas ordens de serviço.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanGate
            locked={isStart && !isEmployee}
            featureName="Chave Pix"
            featureBenefit="Gere QR Codes Pix automaticamente nas ordens de serviço para seus clientes pagarem na hora."
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground text-sm">Tipo de chave</Label>
                <Select value={form.pixType ?? "cpf"} onValueChange={v => handleChange("pixType", v)} disabled={isStart || isEmployee}>
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
                  disabled={isStart || isEmployee}
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

      {/* Aparência */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Aparência</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Personalize o tema da interface e a cor dos documentos gerados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Tema da interface */}
          <div>
            <Label className="text-foreground text-sm font-medium mb-3 block">Tema da interface</Label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: "light", icon: Sun, label: "Claro", desc: "Interface clara e limpa" },
                { value: "dark", icon: Moon, label: "Escuro", desc: "Modo escuro para conforto visual" },
                { value: "system", icon: Monitor, label: "Sistema", desc: "Segue a preferência do sistema" },
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
          </div>

          {/* Cor de destaque dos documentos */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="size-4 text-primary" />
              <Label className="text-foreground text-sm font-medium">Cor de destaque dos documentos</Label>
              {!colorUnlocked && (
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/5 ml-1">
                  <Lock className="size-3 mr-1" />Business+
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Aplicada no cabeçalho, tabela e totais dos orçamentos e ordens de serviço públicos.
            </p>

            {/* Paleta bloqueada para Start */}
            {!colorUnlocked ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center gap-3 py-8 px-6 text-center">
                <Lock className="size-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Disponível no plano Business</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Personalize a cor de destaque dos seus documentos públicos.
                  </p>
                </div>
                <a
                  href="/planos?renovar=1"
                  className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Ver planos
                </a>
              </div>
            ) : (
              <>
                {/* Paleta de swatches */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {ACCENT_COLORS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange("docAccentColor", value)}
                      title={label}
                      className="size-8 rounded-lg border-2 transition-all active:scale-90 shrink-0"
                      style={{
                        backgroundColor: value,
                        borderColor: form.docAccentColor === value ? "#fff" : "transparent",
                        boxShadow: form.docAccentColor === value ? `0 0 0 2px ${value}` : "none",
                      }}
                      aria-label={label}
                    />
                  ))}
                  {/* Cor personalizada */}
                  <div className="relative size-8 shrink-0">
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={form.docAccentColor}
                      onChange={e => handleChange("docAccentColor", e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      aria-label="Cor personalizada"
                    />
                    <div
                      className="size-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary transition-colors cursor-pointer"
                      style={{
                        backgroundColor: ACCENT_COLORS.some(c => c.value === form.docAccentColor) ? "transparent" : form.docAccentColor,
                      }}
                      onClick={() => colorInputRef.current?.click()}
                      title="Cor personalizada"
                    >
                      {ACCENT_COLORS.some(c => c.value === form.docAccentColor) && (
                        <span className="text-[10px] font-bold">+</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview ao vivo */}
                <div
                  className="rounded-xl overflow-hidden border border-border shadow-sm"
                  aria-label="Pré-visualização do documento"
                >
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: form.docAccentColor }}>
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-md bg-white/20 flex items-center justify-center">
                        <Building2 className="size-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-white">{form.name || "Sua Empresa"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[9px] uppercase tracking-widest">Ordem de Serviço</p>
                      <p className="text-white font-black text-lg leading-tight">#0001</p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-3 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Total</span>
                    <span className="text-sm font-black" style={{ color: form.docAccentColor }}>R$ 1.500,00</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Cor selecionada: <span className="font-mono font-medium">{form.docAccentColor.toUpperCase()}</span>
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preferências de Orçamento */}
      {!isEmployee && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <CardTitle className="text-foreground text-lg">Preferências de Orçamento</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Configure padrões que serão aplicados automaticamente em novos orçamentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">

            {/* Validade padrão */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <Label className="text-foreground text-sm font-medium">Validade padrão dos orçamentos</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Número de dias que um orçamento fica válido após ser criado.
              </p>
              <Select
                value={String(form.quoteDefaultValidity)}
                onValueChange={(v) => setForm(f => ({ ...f, quoteDefaultValidity: Number(v ?? "30") }))}
              >
                <SelectTrigger className="bg-input border-border w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template de mensagem WhatsApp */}
            <div className="border-t border-border pt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-green-500" />
                <Label className="text-foreground text-sm font-medium">
                  Mensagem padrão ao enviar orçamento pelo WhatsApp
                </Label>
                {isStart && (
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/5 ml-1">
                    <Lock className="size-3 mr-1" />Business+
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Use <span className="font-mono bg-muted px-1 rounded">{"{nome}"}</span>,{" "}
                <span className="font-mono bg-muted px-1 rounded">{"{numero}"}</span> e{" "}
                <span className="font-mono bg-muted px-1 rounded">{"{link}"}</span> como variáveis.
              </p>
              {isStart ? (
                <PlanGate
                  locked
                  featureName="Mensagem personalizada"
                  featureBenefit="Personalize a mensagem enviada ao cliente quando um orçamento é compartilhado via WhatsApp."
                />
              ) : (
                <Textarea
                  value={form.quoteWhatsappTemplate}
                  onChange={e => setForm(f => ({ ...f, quoteWhatsappTemplate: e.target.value }))}
                  placeholder={`Olá {nome}! Segue seu orçamento {numero}.\nAcesse e aprove: {link}`}
                  rows={4}
                  className="bg-input border-border text-foreground text-sm resize-none"
                  maxLength={500}
                />
              )}
            </div>

            {/* Rodapé personalizado */}
            <div className="border-t border-border pt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlignLeft className="size-4 text-muted-foreground" />
                <Label className="text-foreground text-sm font-medium">
                  Rodapé personalizado nos documentos
                </Label>
                {isStart && (
                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/5 ml-1">
                    <Lock className="size-3 mr-1" />Business+
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Texto exibido no rodapé dos orçamentos e ordens de serviço enviados ao cliente.
              </p>
              {isStart ? (
                <PlanGate
                  locked
                  featureName="Rodapé personalizado"
                  featureBenefit="Adicione informações extras (formas de pagamento, garantia, validade) no rodapé dos seus documentos."
                />
              ) : (
                <Textarea
                  value={form.docFooter}
                  onChange={e => setForm(f => ({ ...f, docFooter: e.target.value }))}
                  placeholder="Ex: Pagamento em até 12x no cartão. Garantia de 90 dias em mão de obra."
                  rows={3}
                  className="bg-input border-border text-foreground text-sm resize-none"
                  maxLength={300}
                />
              )}
              {form.docFooter && !isStart && (
                <p className="text-xs text-muted-foreground">
                  {300 - form.docFooter.length} caracteres restantes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segurança */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Segurança</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">Informações de acesso e segurança.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Senha</p>
              <p className="text-xs text-muted-foreground">Proteja sua conta com uma senha forte.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
              <KeyRound className="size-3.5 mr-1.5" />
              Alterar senha
            </Button>
          </div>

          {/* Dialog alterar senha */}
          <Dialog open={pwOpen} onOpenChange={setPwOpen}>
            <DialogContent className="bg-card border-border text-foreground max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-foreground">Alterar senha</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4 mt-2">
                {/* Senha atual */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-foreground">Senha atual</Label>
                  <div className="relative">
                    <Input
                      type={pwShow.current ? "text" : "password"}
                      required
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                      className="bg-input border-border text-foreground pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setPwShow(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {pwShow.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                {/* Nova senha */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-foreground">Nova senha</Label>
                  <div className="relative">
                    <Input
                      type={pwShow.next ? "text" : "password"}
                      required
                      minLength={8}
                      value={pwForm.next}
                      onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                      className="bg-input border-border text-foreground pr-10"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setPwShow(s => ({ ...s, next: !s.next }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {pwShow.next ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                {/* Confirmar nova senha */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-foreground">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      type={pwShow.confirm ? "text" : "password"}
                      required
                      value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                      className={cn("bg-input border-border text-foreground pr-10", pwForm.confirm && pwForm.confirm !== pwForm.next ? "border-destructive" : "")}
                      placeholder="Repita a nova senha"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setPwShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {pwShow.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {pwForm.confirm && pwForm.confirm !== pwForm.next && (
                    <p className="text-xs text-destructive">As senhas não coincidem</p>
                  )}
                </div>
                <DialogFooter className="gap-2 mt-1">
                  <Button type="button" variant="outline" onClick={() => setPwOpen(false)} className="border-border text-foreground hover:bg-muted">Cancelar</Button>
                  <Button type="submit" disabled={pwLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {pwLoading ? "Salvando..." : "Alterar senha"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-foreground">E-mail de acesso</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licença */}
      {!isEmployee && <LicenseCard license={license} profile={profile} />}

      {/* Funcionários não podem salvar alterações nos dados da empresa */}
      {!isEmployee && (
        <div className="flex justify-end pb-4">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-40"
          >
            {isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      )}
    </div>
  )
}

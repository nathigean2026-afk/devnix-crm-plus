"use client"

import { useState, useTransition, useRef } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { upsertBusinessProfile } from "@/lib/actions"
import type { BusinessProfile } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sun, Moon, Monitor, Building2, Shield, Palette, Upload, X, QrCode, BadgeCheck, Bell } from "lucide-react"
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

function LicenseCard({ license }: { license: LicenseInfo }) {
  const [alertEnabled, setAlertEnabled] = useState(false)
  const { expiresAt, daysLeft, isActive } = license

  const expiryStr = expiresAt
    ? expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—"
  const isWarning = isActive && daysLeft <= 7
  const isExpired = !isActive

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
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Plano atual</p>
            <p className="text-xs text-muted-foreground">Devnix CRM Plus — {plan}</p>
          </div>
          <span className="text-xs text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full font-medium">Ativo</span>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Validade</p>
            <p className="text-xs text-muted-foreground">Expira em {expiryStr}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            isExpired
              ? "bg-red-500/10 text-red-500"
              : isWarning
              ? "bg-yellow-500/10 text-yellow-600"
              : "bg-blue-500/10 text-blue-600"
          }`}>
            {isExpired ? "Expirada" : `${daysLeft} dias restantes`}
          </span>
        </div>

        {isWarning && !isExpired && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
              Sua licenca expira em {daysLeft} {daysLeft === 1 ? "dia" : "dias"}.
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              Renove agora para não perder o acesso ao sistema.
            </p>
          </div>
        )}

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

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              Alerta 7 dias antes do vencimento
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
              {alertEnabled
                ? "Voce receberá uma notificação quando faltarem 7 dias."
                : "Ative para ser avisado antes de sua licença expirar."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={alertEnabled}
            onClick={() => setAlertEnabled(!alertEnabled)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
              alertEnabled ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform duration-200",
                alertEnabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfiguracoesView({ user, profile, license }: ConfiguracoesViewProps) {
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo muito grande. Máximo 2MB.")
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
        await upsertBusinessProfile(form)
        toast.success("Configurações salvas com sucesso!")
      } catch {
        toast.error("Erro ao salvar configurações.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

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
                <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx. 2MB.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="biz-name" className="text-foreground text-sm">Nome da empresa / negócio</Label>
              <Input
                id="biz-name"
                value={form.name}
                onChange={e => handleChange("name", e.target.value)}
                placeholder="Devnix Soluções Web"
                className="bg-input border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-doc" className="text-foreground text-sm">CPF / CNPJ</Label>
              <Input
                id="biz-doc"
                value={form.document}
                onChange={e => handleChange("document", e.target.value)}
                placeholder="00.000.000/0001-00"
                className="bg-input border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-phone" className="text-foreground text-sm">Telefone / WhatsApp</Label>
              <Input
                id="biz-phone"
                value={form.phone}
                onChange={e => handleChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
                className="bg-input border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-email" className="text-foreground text-sm">E-mail comercial</Label>
              <Input
                id="biz-email"
                type="email"
                value={form.email}
                onChange={e => handleChange("email", e.target.value)}
                placeholder="contato@empresa.com.br"
                className="bg-input border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-website" className="text-foreground text-sm">Website</Label>
              <Input
                id="biz-website"
                value={form.website}
                onChange={e => handleChange("website", e.target.value)}
                placeholder="https://empresa.com.br"
                className="bg-input border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="biz-address" className="text-foreground text-sm">Endereço</Label>
              <Input
                id="biz-address"
                value={form.address}
                onChange={e => handleChange("address", e.target.value)}
                placeholder="Rua Exemplo, 123"
                className="bg-input border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-city" className="text-foreground text-sm">Cidade</Label>
              <Input
                id="biz-city"
                value={form.city}
                onChange={e => handleChange("city", e.target.value)}
                placeholder="São Paulo"
                className="bg-input border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-state" className="text-foreground text-sm">Estado</Label>
              <Input
                id="biz-state"
                value={form.state}
                onChange={e => handleChange("state", e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength={2}
                className="bg-input border-border uppercase"
              />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-foreground text-sm">Tipo de chave</Label>
              <Select value={form.pixType} onValueChange={v => handleChange("pixType", v)}>
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
                placeholder={
                  form.pixType === "cpf" ? "000.000.000-00" :
                  form.pixType === "email" ? "contato@empresa.com" :
                  form.pixType === "telefone" ? "+55 11 99999-9999" :
                  "Cole sua chave aqui"
                }
                className="bg-input border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <CardTitle className="text-foreground text-lg">Aparência</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">Escolha o tema da interface.</CardDescription>
        </CardHeader>
        <CardContent>
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
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all text-center cursor-pointer ${
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <Icon className="size-6" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
              <p className="text-xs text-muted-foreground">Última alteração desconhecida</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Protegida</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Autenticação</p>
              <p className="text-xs text-muted-foreground">Email e senha</p>
            </div>
            <span className="text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded">Ativa</span>
          </div>
          <div className="flex items-start justify-between py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">ID da conta</p>
              <p className="text-xs text-muted-foreground font-mono break-all select-all">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licença */}
      <LicenseCard license={license} />

      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
        >
          {isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  )
}

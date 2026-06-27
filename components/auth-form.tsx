"use client"

import { LoginChatWidget } from "@/components/support/login-chat-widget"
import { authClient } from "@/lib/auth-client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, Lock, Mail, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  mode: "sign-in" | "sign-up"
  kicked?: boolean
}

const slides = [
  {
    src: "/screenshots/dashboard.png",
    label: "Dashboard",
    desc: "Visão geral do seu negócio em tempo real",
  },
  {
    src: "/screenshots/clientes.png",
    label: "Clientes",
    desc: "Gerencie sua base de clientes com facilidade",
  },
  {
    src: "/screenshots/orcamentos.png",
    label: "Orçamentos",
    desc: "Crie e envie orçamentos profissionais",
  },
  {
    src: "/screenshots/financeiro.png",
    label: "Financeiro",
    desc: "Controle receitas, despesas e saldo",
  },
  {
    src: "/screenshots/relatorios.png",
    label: "Relatórios",
    desc: "Análises e métricas do seu negócio",
  },
]

function ScreenshotCarousel() {
  const [active, setActive] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setActive((prev) => (prev + 1) % slides.length)
        setAnimating(false)
      }, 400)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  const goTo = (idx: number) => {
    if (idx === active) return
    setAnimating(true)
    setTimeout(() => {
      setActive(idx)
      setAnimating(false)
    }, 300)
  }

  const current = slides[active]

  return (
    <div className="flex flex-col gap-3">
      {/* Frame do browser */}
      <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/70 bg-[#0d0d14]">
        {/* Barra do browser */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-500/40" />
            <div className="size-2.5 rounded-full bg-yellow-500/40" />
            <div className="size-2.5 rounded-full bg-green-500/40" />
          </div>
          <div className="flex-1 mx-2 h-5 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-2">
            <span className="text-[10px] text-white/20 truncate">app.elevanthe.com.br/{current.label.toLowerCase()}</span>
          </div>
        </div>
        {/* Screenshot */}
        <div
          className={cn(
            "transition-opacity duration-300",
            animating ? "opacity-0" : "opacity-100"
          )}
        >
          <Image
            src={current.src}
            alt={`${current.label} — Elevanthe CRM`}
            width={480}
            height={300}
            className="w-full h-auto object-cover object-top"
            priority
          />
        </div>
      </div>

      {/* Caption + dots */}
      <div className="flex items-center justify-between px-1">
        <div
          className={cn(
            "transition-all duration-300",
            animating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          )}
        >
          <p className="text-xs font-semibold text-white/60">{current.label}</p>
          <p className="text-[11px] text-white/25">{current.desc}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === active
                  ? "w-4 h-1.5 bg-primary"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Ver ${slides[i].label}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function AuthForm({ mode, kicked }: AuthFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  const isSignIn = mode === "sign-in"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!isSignIn) {
        const { error } = await authClient.signUp.email({
          name: form.name,
          email: form.email,
          password: form.password,
        })
        if (error) throw new Error(error.message)
        toast.success("Conta criada! Escolha seu plano para continuar.")
        router.push("/planos")
        router.refresh()
        return
      } else {
        const { error } = await authClient.signIn.email({
          email: form.email,
          password: form.password,
          rememberMe: true,
        })
        if (error) throw new Error(error.message)
        toast.success("Bem-vindo de volta!")
        await authClient.revokeOtherSessions().catch(() => {})
      }
      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a10] flex">
      {/* ─── Painel esquerdo — branding (desktop only) ─── */}
      <aside className="hidden lg:flex lg:w-[520px] xl:w-[560px] flex-col justify-between bg-[#07070d] border-r border-white/[0.05] px-10 py-8 relative overflow-hidden flex-shrink-0">

        {/* Marca d'agua do elefante neon — watermark sutil no fundo */}
        <div className="absolute -bottom-16 -right-16 opacity-[0.04] pointer-events-none select-none">
          <Image
            src="/elevanthe-logo-neon.png"
            alt=""
            width={420}
            height={420}
            className="object-contain"
          />
        </div>

        {/* Glow azul radial */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-[400px] rounded-full bg-blue-600/8 blur-[100px] pointer-events-none" />

        {/* Logo horizontal completa */}
        <div className="relative z-10">
          <Image
            src="/elevanthe-logo-dark.png"
            alt="Elevanthe CRM — Gestão de relacionamento que eleva resultados"
            width={280}
            height={70}
            className="object-contain h-12 w-auto"
          />
        </div>

        {/* Conteudo central */}
        <div className="relative z-10 flex flex-col gap-8">
          {/* Headline */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold text-primary/80 tracking-wide">Plataforma completa de gestão</span>
            </div>
            <h2 className="text-2xl xl:text-3xl font-black text-white leading-[1.2] tracking-tight text-balance">
              Gerencie seu negócio com clareza e velocidade
            </h2>
            <p className="text-sm text-white/35 leading-relaxed">
              Do primeiro contato ao pagamento — tudo em um só lugar. Sem planilhas, sem confusão.
            </p>
          </div>

          {/* Carrossel de screenshots */}
          <ScreenshotCarousel />
        </div>

        {/* Rodape */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[11px] text-white/15">&copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.</p>
          <p className="text-[11px] text-white/15">Pix · Cartão · Boleto</p>
        </div>
      </aside>

      {/* ─── Painel direito — formulário ─── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          {/* Logo mobile — usa a logo horizontal também */}
          <div className="lg:hidden">
            <Image
              src="/elevanthe-logo-dark.png"
              alt="Elevanthe CRM"
              width={160}
              height={40}
              className="object-contain h-8 w-auto"
            />
          </div>
          <div className="hidden lg:block" />

          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="text-xs text-white/40 hover:text-white/70 transition-colors border border-white/[0.08] hover:border-white/20 rounded-lg px-3 py-1.5"
          >
            {isSignIn ? "Criar conta grátis" : "Já tenho conta"}
          </Link>
        </div>

        {/* Form centralizado */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[380px]">

            {/* Header do form */}
            <div className="mb-8">
              <h1 className="text-[1.75rem] font-black text-white tracking-tight leading-tight">
                {isSignIn ? "Entrar na conta" : "Criar conta grátis"}
              </h1>
              <p className="text-sm text-white/35 mt-2 leading-relaxed">
                {isSignIn
                  ? "Acesse seu CRM e continue de onde parou."
                  : "Comece grátis, sem cartão. Escolha o plano depois."}
              </p>
            </div>

            {/* Banner sessao encerrada */}
            {kicked && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3.5">
                <Lock className="size-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Sessão encerrada</p>
                  <p className="text-xs text-amber-400/70 mt-0.5 leading-relaxed">
                    Sua conta foi acessada em outro dispositivo. Por segurança, esta sessão foi encerrada.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-white/60">
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:border-primary/40 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-white/60">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="pl-10 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:border-primary/40 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-white/60">
                    Senha
                  </Label>
                  {isSignIn && (
                    <Link href="/esqueci-senha" className="text-xs text-primary/70 hover:text-primary transition-colors">
                      Esqueci a senha
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/25" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignIn ? "Sua senha" : "Mínimo 8 caracteres"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    className="pl-10 pr-11 h-11 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-primary/60 focus-visible:border-primary/40 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full h-11 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-2",
                  "bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-lg shadow-primary/25"
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Aguarde...
                  </span>
                ) : (
                  <>
                    {isSignIn ? "Entrar" : "Criar conta"}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/30">
              {isSignIn ? (
                <>
                  Não tem conta?{" "}
                  <Link href="/sign-up" className="text-primary/80 hover:text-primary transition-colors font-semibold">
                    Criar conta grátis
                  </Link>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <Link href="/sign-in" className="text-primary/80 hover:text-primary transition-colors font-semibold">
                    Entrar
                  </Link>
                </>
              )}
            </p>

            <div className="mt-5 text-center">
              <Link
                href="/demo"
                className="text-xs text-white/20 hover:text-white/40 transition-colors inline-flex items-center gap-1.5"
              >
                Ver demonstração sem cadastro
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <LoginChatWidget />
    </div>
  )
}

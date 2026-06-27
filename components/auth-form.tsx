"use client"

import { LoginChatWidget } from "@/components/support/login-chat-widget"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, CheckCircle2, BarChart2, Users, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  mode: "sign-in" | "sign-up"
  kicked?: boolean
}

const features = [
  { icon: Users, text: "Clientes e ordens de serviço ilimitados" },
  { icon: FileText, text: "Orçamentos profissionais em segundos" },
  { icon: BarChart2, text: "Controle financeiro e relatórios" },
  { icon: CheckCircle2, text: "Dashboard em tempo real" },
]

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
        // Revoga todas as outras sessões ativas — garante sessão única por usuário
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
    <div className="min-h-screen bg-[#0c0c12] flex">
      {/* ─── Painel esquerdo — branding (desktop only) ─── */}
      <aside className="hidden lg:flex lg:w-[460px] xl:w-[500px] flex-col justify-between bg-[#08080e] border-r border-white/[0.05] p-10 relative overflow-hidden flex-shrink-0">
        {/* Glow de fundo */}
        <div className="absolute -top-40 -left-20 size-[500px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 size-[300px] rounded-full bg-blue-600/5 blur-[80px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Image src="/elevanthe-icon.png" alt="Elevanthe CRM" width={22} height={22} className="object-contain" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Elevanthe CRM</span>
        </div>

        {/* Conteudo central */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary/80">Plataforma completa de gestão</span>
            </div>
            <h2 className="text-3xl xl:text-[2.4rem] font-black text-white leading-[1.15] tracking-tight text-balance">
              Gerencie seu negócio com clareza e velocidade
            </h2>
            <p className="text-sm text-white/35 leading-relaxed">
              Do primeiro contato ao pagamento — tudo em um só lugar. Sem planilhas, sem confusão.
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3.5">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <div className="size-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
                  <Icon className="size-3.5 text-primary/70" />
                </div>
                <span className="text-sm text-white/45">{text}</span>
              </li>
            ))}
          </ul>

          {/* Screenshot do dashboard */}
          <div className="rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/60">
            <Image
              src="/crm-screenshot-dashboard.png"
              alt="Dashboard do Elevanthe CRM"
              width={480}
              height={280}
              className="w-full h-auto object-cover opacity-80"
            />
          </div>
        </div>

        {/* Rodape */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-xs text-white/15">
            &copy; {new Date().getFullYear()} Elevanthe
          </p>
          <p className="text-xs text-white/15">Pix · Cartão · Boleto</p>
        </div>
      </aside>

      {/* ─── Painel direito — formulario ─── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="size-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Image src="/elevanthe-icon.png" alt="Elevanthe CRM" width={16} height={16} className="object-contain" />
            </div>
            <span className="font-bold text-sm text-white">Elevanthe CRM</span>
          </div>
          <div className="hidden lg:block" />

          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5"
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

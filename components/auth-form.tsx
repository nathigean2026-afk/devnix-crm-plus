"use client"

import { LoginChatWidget } from "@/components/support/login-chat-widget"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
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
}

const features = [
  "Clientes e ordens de servico ilimitados",
  "Orcamentos profissionais em segundos",
  "Controle financeiro completo",
  "Relatorios e dashboard em tempo real",
]

export function AuthForm({ mode }: AuthFormProps) {
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
    <div className="min-h-screen bg-background flex">
      {/* Painel esquerdo — visual/marketing (desktop only) */}
      <aside className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-[#0a0a0f] border-r border-white/[0.06] p-10 relative overflow-hidden flex-shrink-0">
        {/* Noise texture sutil */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")"
        }} />
        {/* Glow radial */}
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-primary/8 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/elevanthe-logo.png"
            alt="Elevanthe CRM"
            width={200}
            height={56}
            className="object-contain brightness-0 invert"
          />
        </div>

        {/* Conteudo central */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              Gestão de relacionamento que eleva resultados
            </p>
            <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight text-balance">
              Eleve seus resultados com inteligência
            </h2>
            <p className="text-sm text-white/40 leading-relaxed">
              Tudo que você precisa para gerenciar clientes, projetos e financeiro em uma única plataforma.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <div className="size-5 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <div className="size-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-sm text-white/50">{f}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-xs text-white/25">
              Pagamento seguro via Mercado Pago · Pix, cartao e boleto
            </p>
          </div>
        </div>

        {/* Rodape */}
        <p className="relative z-10 text-xs text-white/20">
          &copy; {new Date().getFullYear()} Elevanthe. Todos os direitos reservados.
        </p>
      </aside>

      {/* Painel direito — formulario */}
      <div className="flex-1 flex flex-col">
        {/* Top bar com theme toggle */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo mobile */}
          <div className="flex items-center lg:hidden">
            <Image
              src="/elevanthe-logo.png"
              alt="Elevanthe CRM"
              width={140}
              height={40}
              className="object-contain dark:brightness-0 dark:invert"
            />
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={isSignIn ? "/sign-up" : "/sign-in"}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignIn ? "Criar conta" : "Ja tenho conta"}
            </Link>
          </div>
        </div>

        {/* Form centralizado */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[360px]">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {isSignIn ? "Entrar na conta" : "Criar conta gratis"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {isSignIn
                  ? "Digite suas credenciais para acessar o CRM."
                  : "Crie sua conta e escolha um plano para comecar."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-10 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-10 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Senha
                  </Label>
                  {isSignIn && (
                    <Link href="/esqueci-senha" className="text-xs text-primary hover:underline">
                      Esqueci a senha
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignIn ? "Sua senha" : "Minimo 8 caracteres"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    className="pl-9 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-10 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  "w-full h-10 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-2",
                  "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed",
                  "shadow-md shadow-primary/20"
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

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isSignIn ? (
                <>
                  Nao tem conta?{" "}
                  <Link href="/sign-up" className="text-primary hover:underline font-medium">
                    Criar conta gratis
                  </Link>
                </>
              ) : (
                <>
                  Ja tem conta?{" "}
                  <Link href="/sign-in" className="text-primary hover:underline font-medium">
                    Entrar
                  </Link>
                </>
              )}
            </p>

            {/* Demo link */}
            <div className="mt-4 text-center">
              <Link
                href="/demo"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                Ver demonstracao do sistema
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

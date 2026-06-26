"use client"

import { LoginChatWidget } from "@/components/support/login-chat-widget"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"

interface AuthFormProps {
  mode: "sign-in" | "sign-up"
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === "sign-up") {
        const { error } = await authClient.signUp.email({
          name: form.name,
          email: form.email,
          password: form.password,
        })
        if (error) throw new Error(error.message)
        toast.success("Conta criada com sucesso! Escolha seu plano para continuar.")
        router.push("/planos")
        router.refresh()
        return
      } else {
        const { error } = await authClient.signIn.email({
          email: form.email,
          password: form.password,
          rememberMe,
        })
        if (error) throw new Error(error.message)
        toast.success("Login realizado com sucesso!")
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
            alt="Devnix"
            width={56}
            height={56}
            style={{ width: 56, height: "auto" }}
            className="object-contain"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Devnix CRM Plus</h1>
            <p className="text-sm text-muted-foreground mt-1">Soluções Web Inteligentes</p>
          </div>
        </div>

        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground text-xl">
              {mode === "sign-in" ? "Entrar na conta" : "Criar conta"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {mode === "sign-in"
                ? "Digite suas credenciais para acessar o CRM"
                : "Preencha os dados para criar sua conta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "sign-up" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-foreground text-sm">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-foreground text-sm">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground text-sm">Senha</Label>
                  {mode === "sign-in" && (
                    <a
                      href="/esqueci-senha"
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === "sign-in" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Continuar conectado por 30 dias
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-1"
              >
                {loading
                  ? "Aguarde..."
                  : mode === "sign-in"
                  ? "Entrar"
                  : "Criar conta"}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "sign-in" ? (
                <>
                  Não tem conta?{" "}
                  <a href="/sign-up" className="text-primary hover:underline font-medium">
                    Criar conta
                  </a>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <a href="/sign-in" className="text-primary hover:underline font-medium">
                    Entrar
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} Devnix. Todos os direitos reservados.
        </p>
      </div>

      {/* Widget flutuante de chat de suporte */}
      <LoginChatWidget />
    </div>
  )
}

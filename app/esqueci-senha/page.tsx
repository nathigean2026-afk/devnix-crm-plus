"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simula envio — integrar com Better Auth resetPassword quando configurar e-mail
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
            alt="Devnix"
            width={56}
            height={56}
            className="object-contain"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Devnix CRM Plus</h1>
            <p className="text-sm text-muted-foreground mt-1">Soluções Web Inteligentes</p>
          </div>
        </div>

        <Card className="bg-card border-border shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground text-xl">Recuperar senha</CardTitle>
            <CardDescription className="text-muted-foreground">
              {sent
                ? "Verifique sua caixa de entrada."
                : "Informe seu e-mail e enviaremos um link para redefinir sua senha."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="size-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Se o e-mail <span className="text-foreground font-medium">{email}</span> estiver
                  cadastrado, você receberá as instruções em breve.
                </p>
                <Link
                  href="/sign-in"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-foreground text-sm">
                    E-mail cadastrado
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>

                <Link
                  href="/sign-in"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar para o login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} Devnix. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

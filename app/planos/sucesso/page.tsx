import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getUserLicense } from "@/lib/actions"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, ArrowRight, Clock } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pagamento Confirmado | Devnix CRM Plus",
}

export default async function SucessoPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  // Busca a licenca atualizada
  const license = await getUserLicense()

  const expiryStr = license.expiresAt
    ? license.expiresAt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20reduzida-B2qAbWz2qQ52LWM7e7hYbiRRWNXHqD.png"
            alt="Devnix CRM Plus"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>

        {/* Icone de sucesso */}
        <div className="flex justify-center mb-5">
          <div className="size-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="size-10 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento confirmado!</h1>
        <p className="text-muted-foreground text-sm mb-6 text-pretty">
          Sua licenca foi ativada com sucesso. Bem-vindo ao Devnix CRM Plus,{" "}
          <span className="font-medium text-foreground">{session.user.name}</span>.
        </p>

        {/* Card de licenca */}
        <div className="bg-card border border-border rounded-xl p-5 mb-7 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Licenca ativa</p>
              <p className="text-sm font-semibold text-foreground">Devnix CRM Plus</p>
            </div>
            <div className="ml-auto">
              <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded-full font-medium">
                Ativa
              </span>
            </div>
          </div>

          {expiryStr && (
            <div className="flex items-center justify-between text-sm border-t border-border pt-3 mt-1">
              <span className="text-muted-foreground">Validade</span>
              <span className="font-medium text-foreground">{expiryStr}</span>
            </div>
          )}
          {license.daysLeft > 0 && (
            <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground">Dias restantes</span>
              <span className="font-semibold text-primary">{license.daysLeft} dias</span>
            </div>
          )}
        </div>

        {/* Botao CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-semibold py-3 px-5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
        >
          Acessar o Dashboard
          <ArrowRight className="size-4" />
        </Link>

        <p className="mt-4 text-xs text-muted-foreground">
          Voce tambem recebera uma confirmacao por email.
        </p>
      </div>
    </div>
  )
}

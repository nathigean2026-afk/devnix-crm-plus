"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { acceptEmployeeInvite } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { UserCheck, Loader2, Users } from "lucide-react"

interface AcceptInviteClientProps {
  token: string
  userName: string
}

export function AcceptInviteClient({ token, userName }: AcceptInviteClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleAccept() {
    setLoading(true)
    try {
      await acceptEmployeeInvite(token)
      setDone(true)
      toast.success("Convite aceito com sucesso! Bem-vindo.")
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao aceitar convite.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-6 text-center shadow-sm">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
          {done ? (
            <UserCheck className="size-8 text-primary" />
          ) : (
            <Users className="size-8 text-primary" />
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground">
            {done ? "Tudo certo!" : "Voce foi convidado"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {done
              ? "Convite aceito. Redirecionando para o dashboard..."
              : `Ola, ${userName}. Voce recebeu um convite para colaborar no Elevanthe CRM como funcionario.`}
          </p>
        </div>

        {!done && (
          <div className="w-full flex flex-col gap-3">
            <Button
              onClick={handleAccept}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Aceitando...
                </>
              ) : (
                "Aceitar convite"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              disabled={loading}
              className="w-full text-muted-foreground"
            >
              Recusar e ir para o dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

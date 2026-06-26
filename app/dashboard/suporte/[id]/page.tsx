import { getSupportTicket } from "@/lib/actions"
import { TicketChat } from "@/components/support/ticket-chat"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, AlertCircle, Clock, PauseCircle, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const STATUS_CFG: Record<string, { label: string; icon: any; cls: string }> = {
  aberto:       { label: "Aberto",       icon: AlertCircle,  cls: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  em_andamento: { label: "Em andamento", icon: Clock,        cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  pausado:      { label: "Pausado",      icon: PauseCircle,  cls: "bg-muted text-muted-foreground border-border" },
  resolvido:    { label: "Resolvido",    icon: CheckCircle2, cls: "bg-green-500/15 text-green-600 border-green-500/30" },
  fechado:      { label: "Fechado",      icon: XCircle,      cls: "bg-destructive/15 text-destructive border-destructive/30" },
}

const CATEGORY_LABELS: Record<string, string> = {
  duvida: "Dúvida", bug: "Bug / Erro", financeiro: "Financeiro",
  conta: "Conta", sugestao: "Sugestão", outro: "Outro",
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  let data
  try {
    data = await getSupportTicket(id)
  } catch {
    notFound()
  }

  const { ticket, messages } = data
  const s = STATUS_CFG[ticket.status] ?? STATUS_CFG.aberto
  const StatusIcon = s.icon

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header do ticket */}
      <div className="p-4 border-b border-border bg-card shrink-0">
        <Link
          href="/dashboard/suporte"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit"
        >
          <ChevronLeft className="size-4" />Voltar ao Suporte
        </Link>
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground leading-snug break-words">{ticket.subject}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <span className={cn("inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1 font-medium", s.cls)}>
                <StatusIcon className="size-3" />
                {s.label}
              </span>
              <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[ticket.category]}</span>
              <span className="text-xs text-muted-foreground">
                Aberto em {new Date(ticket.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat com scroll */}
      <div className="flex-1 overflow-hidden">
        <TicketChat
          ticketId={ticket.id}
          initialMessages={messages}
          status={ticket.status}
          userName={session?.user?.name ?? "Você"}
        />
      </div>
    </div>
  )
}

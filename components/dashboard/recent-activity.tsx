import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Client, Quote } from "@/lib/db/schema"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

interface RecentActivityProps {
  stats: {
    recentClients: Client[]
    recentQuotes: Quote[]
  }
}

const quoteStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  enviado: { label: "Enviado", variant: "default" },
  aprovado: { label: "Aprovado", variant: "default" },
  recusado: { label: "Recusado", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

export function RecentActivity({ stats }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Clients */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-foreground text-base font-semibold">Clientes Recentes</CardTitle>
          <Link href="/dashboard/clientes" className="text-xs text-primary hover:underline">
            Ver todos
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentClients.length === 0 ? (
            <p className="text-muted-foreground text-sm px-6 pb-5">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clientes`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{client.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{client.company ?? client.email ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge
                      variant={client.status === "ativo" ? "default" : "secondary"}
                      className={client.status === "ativo" ? "bg-green-500/15 text-green-400 border-green-500/20" : ""}
                    >
                      {client.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(client.createdAt), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Quotes */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-foreground text-base font-semibold">Orçamentos Recentes</CardTitle>
          <Link href="/dashboard/orcamentos" className="text-xs text-primary hover:underline">
            Ver todos
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentQuotes.length === 0 ? (
            <p className="text-muted-foreground text-sm px-6 pb-5">Nenhum orçamento criado ainda.</p>
          ) : (
            <div className="divide-y divide-border">
              {stats.recentQuotes.map((quote) => {
                const statusConfig = quoteStatusConfig[quote.status] ?? quoteStatusConfig.rascunho
                return (
                  <Link
                    key={quote.id}
                    href={`/dashboard/orcamentos`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        #{String(quote.number).padStart(4, "0")} — {quote.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(quote.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(quote.total)}</span>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

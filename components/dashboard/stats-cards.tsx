import { Card, CardContent } from "@/components/ui/card"
import { Users, FileText, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalClients: number
    activeClients: number
    totalQuotes: number
    pendingQuotes: number
    approvedQuotes: number
    revenue: number
    pendingRevenue: number
    expenses: number
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

const cardData = (stats: StatsCardsProps["stats"]) => [
  {
    title: "Clientes Ativos",
    value: stats.activeClients.toString(),
    sub: `${stats.totalClients} no total`,
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    title: "Orçamentos Enviados",
    value: stats.pendingQuotes.toString(),
    sub: `${stats.totalQuotes} no total`,
    icon: FileText,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    title: "Orçamentos Aprovados",
    value: stats.approvedQuotes.toString(),
    sub: "Aguardando execução",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    title: "Receita Realizada",
    value: formatCurrency(stats.revenue),
    sub: `${formatCurrency(stats.pendingRevenue)} a receber`,
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Despesas",
    value: formatCurrency(stats.expenses),
    sub: "Total pago",
    icon: TrendingUp,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    title: "Saldo",
    value: formatCurrency(stats.revenue - stats.expenses),
    sub: "Receita − Despesas",
    icon: Clock,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = cardData(stats)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardContent className="p-5 flex items-start gap-4">
            <div className={`rounded-lg p-2.5 ${card.bg} shrink-0`}>
              <card.icon className={`size-5 ${card.color}`} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{card.title}</p>
              <p className="text-xl font-bold text-foreground leading-none">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

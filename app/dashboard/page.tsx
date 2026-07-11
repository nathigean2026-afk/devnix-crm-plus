import { getDashboardStats, getRevenueGoal } from "@/lib/actions"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { DashboardChart } from "@/components/dashboard/dashboard-chart"
import { RevenueGoalCard } from "@/components/dashboard/revenue-goal-card"
import { BirthdayClientsCard } from "@/components/dashboard/birthday-clients-card"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  let stats
  let goalCents: number | null = null
  try {
    ;[stats, goalCents] = await Promise.all([getDashboardStats(), getRevenueGoal()])
  } catch (err: unknown) {
    // Sessão não encontrada — o layout já lida com o redirect, mas se por
    // alguma condição de corrida no carregamento inicial a sessão não estiver
    // pronta, redireciona de volta ao sign-in.
    if (err instanceof Error && err.message === "Não autorizado") {
      redirect("/sign-in")
    }
    throw err
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      <StatsCards stats={stats} />

      {/* Linha com meta de faturamento + aniversariantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueGoalCard currentRevenue={stats.revenue ?? 0} initialGoalCents={goalCents} />
        <BirthdayClientsCard />
      </div>

      <DashboardChart data={stats.monthlyChart} />
      <RecentActivity stats={stats} />
    </div>
  )
}

import { getDashboardStats } from "@/lib/actions"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral do seu negócio
        </p>
      </div>

      <StatsCards stats={stats} />
      <RecentActivity stats={stats} />
    </div>
  )
}

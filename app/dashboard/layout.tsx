import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard/breadcrumb"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar user={{ name: session.user.name, email: session.user.email }} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-card/50 px-4 md:px-6">
          {/* Espaço para o botão hamburger no mobile */}
          <div className="w-10 md:hidden shrink-0" />
          <DashboardBreadcrumb />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

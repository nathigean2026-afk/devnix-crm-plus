import { auth } from "@/lib/auth"
import { headers, cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardBreadcrumb } from "@/components/dashboard/breadcrumb"
import { QuoteNotificationsProvider } from "@/components/dashboard/quote-notifications-provider"
import { LicenseWatcher } from "@/components/dashboard/license-watcher"
import { PushSubscriptionManager } from "@/components/push-subscription-manager"
import { db } from "@/lib/db"
import { user, employeePermissions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const reqHeaders = await headers()
  const cookieStore = await cookies()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session?.user) {
    // Se havia um cookie de sessão mas ela não existe mais no banco,
    // o usuário foi kickado por outro login — redireciona para a página de aviso
    const hadSession =
      cookieStore.get("better-auth.session_token") ||
      cookieStore.get("__Secure-better-auth.session_token")
    redirect(hadSession ? "/sessao-encerrada" : "/sign-in")
  }

  const now = new Date()

  // Verifica se o usuário é um funcionário vinculado a um prestador
  const [empPerms] = await db
    .select()
    .from(employeePermissions)
    .where(eq(employeePermissions.employeeId, session.user.id))
    .limit(1)

  let licenseExpiresAt: Date | null = null

  if (empPerms) {
    // Funcionário: usa a licença do prestador (dono)
    const [owner] = await db
      .select({ accessExpiresAt: user.accessExpiresAt })
      .from(user)
      .where(eq(user.id, empPerms.ownerId))
      .limit(1)

    const isOwnerLicenseActive = owner?.accessExpiresAt ? owner.accessExpiresAt > now : false
    if (!isOwnerLicenseActive) redirect("/planos")
    licenseExpiresAt = owner?.accessExpiresAt ?? null
  } else {
    // Prestador: verifica sua própria licença
    const [u] = await db
      .select({ accessExpiresAt: user.accessExpiresAt })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const isLicenseActive = u?.accessExpiresAt ? u.accessExpiresAt > now : false
    if (!isLicenseActive) redirect("/planos")
    licenseExpiresAt = u?.accessExpiresAt ?? null
  }

  // Monta o objeto de permissões para a sidebar (null = prestador, sem restrições)
  const sidebarPermissions = empPerms
    ? {
        canClients: empPerms.canClients,
        canServices: empPerms.canServices,
        canQuotes: empPerms.canQuotes,
        canOrders: empPerms.canOrders,
        canFinanceiro: empPerms.canFinanceiro,
        canRelatorios: empPerms.canRelatorios,
      }
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar user={{ name: session.user.name, email: session.user.email }} permissions={sidebarPermissions} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-card/50 px-4 md:px-6">
          {/* Espaço para o botão hamburger no mobile */}
          <div className="w-10 md:hidden shrink-0" />
          <DashboardBreadcrumb />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <QuoteNotificationsProvider />
          <PushSubscriptionManager />
          {licenseExpiresAt && (
            <LicenseWatcher expiresAt={licenseExpiresAt.toISOString()} />
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

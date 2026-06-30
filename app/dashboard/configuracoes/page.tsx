import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ConfiguracoesView } from "@/components/configuracoes/configuracoes-view"
import { EmployeeManager } from "@/components/configuracoes/employee-manager"
import { getBusinessProfile, getUserLicense, getEmployeeData, getEffectiveUserId } from "@/lib/actions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configuracoes",
}

export default async function ConfiguracoesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  // Detecta se é funcionário vinculado
  let isEmployee = false
  try {
    const result = await getEffectiveUserId()
    isEmployee = result.isEmployee
  } catch {
    // Segue como prestador
  }

  const [profile, license, employeeData] = await Promise.all([
    getBusinessProfile(),
    getUserLicense(),
    // Funcionários não gerenciam funcionários — não precisamos carregar esses dados
    isEmployee ? Promise.resolve(null) : getEmployeeData(),
  ])

  const plan = (profile?.licensePlan ?? "starter").toLowerCase()
  const isEnterprise = plan === "enterprise"

  return (
    <div className="flex flex-col gap-6">
      <ConfiguracoesView user={session.user} profile={profile} license={license} isEmployee={isEmployee} />
      {/* Funcionários não gerenciam outros funcionários */}
      {!isEmployee && (
        <div className="max-w-3xl">
          <EmployeeManager data={employeeData!} isEnterprise={isEnterprise} />
        </div>
      )}
    </div>
  )
}

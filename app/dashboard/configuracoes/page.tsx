import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ConfiguracoesView } from "@/components/configuracoes/configuracoes-view"
import { EmployeeManager } from "@/components/configuracoes/employee-manager"
import { getBusinessProfile, getUserLicense, getEmployeeData } from "@/lib/actions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configuracoes",
}

export default async function ConfiguracoesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const [profile, license, employeeData] = await Promise.all([
    getBusinessProfile(),
    getUserLicense(),
    getEmployeeData(),
  ])

  const plan = (profile?.licensePlan ?? "starter").toLowerCase()
  const isEnterprise = plan === "enterprise"

  return (
    <div className="flex flex-col gap-6">
      <ConfiguracoesView user={session.user} profile={profile} license={license} />
      <div className="max-w-3xl">
        <EmployeeManager data={employeeData} isEnterprise={isEnterprise} />
      </div>
    </div>
  )
}

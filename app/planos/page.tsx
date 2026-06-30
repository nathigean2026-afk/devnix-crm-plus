import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { PlanosView } from "@/components/planos/planos-view"
import { getUserLicense, getEffectiveUserId } from "@/lib/actions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Escolha seu Plano | Elevanthe CRM",
  description: "Ative sua licenca para acessar todas as funcionalidades do Elevanthe CRM.",
}

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ renovar?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  // Funcionários vinculados não podem comprar/ativar licença
  try {
    const { isEmployee } = await getEffectiveUserId()
    if (isEmployee) redirect("/dashboard")
  } catch {
    // Segue normalmente se falhar
  }

  const params = await searchParams
  const isRenovar = params.renovar === "1"

  let license = { isActive: false, expiresAt: null as Date | null, daysLeft: 0 }
  try {
    license = await getUserLicense()
  } catch {
    // Se getUserLicense falhar (ex.: sessão inconsistente), segue sem redirecionar
  }
  // Se ja tem licenca ativa e nao e renovacao, vai pro dashboard
  if (license.isActive && !isRenovar) redirect("/dashboard")

  return <PlanosView user={{ name: session.user.name, email: session.user.email }} isRenovar={isRenovar} />
}

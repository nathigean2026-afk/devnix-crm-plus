import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { PlanosView } from "@/components/planos/planos-view"
import { getUserLicense } from "@/lib/actions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Escolha seu Plano | Devnix CRM Plus",
  description: "Ative sua licenca para acessar todas as funcionalidades do Devnix CRM Plus.",
}

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ renovar?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const params = await searchParams
  const isRenovar = params.renovar === "1"

  const license = await getUserLicense()
  // Se ja tem licenca ativa e nao e renovacao, vai pro dashboard
  if (license.isActive && !isRenovar) redirect("/dashboard")

  return <PlanosView user={{ name: session.user.name, email: session.user.email }} isRenovar={isRenovar} />
}

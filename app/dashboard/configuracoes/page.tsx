import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ConfiguracoesView } from "@/components/configuracoes/configuracoes-view"
import { getBusinessProfile, getUserLicense } from "@/lib/actions"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configurações",
}

export default async function ConfiguracoesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const [profile, license] = await Promise.all([
    getBusinessProfile(),
    getUserLicense(),
  ])

  return <ConfiguracoesView user={session.user} profile={profile} license={license} />
}

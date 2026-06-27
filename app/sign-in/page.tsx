import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Entrar" }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ kicked?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")
  const params = await searchParams
  // kicked=1 é legado — agora usamos /sessao-encerrada, mas mantemos compatibilidade
  return <AuthForm mode="sign-in" kicked={params.kicked === "1"} />
}

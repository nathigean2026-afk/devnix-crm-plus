import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Entrar" }

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")
  return <AuthForm mode="sign-in" />
}

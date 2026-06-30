import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Entrar",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ kicked?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")
  const params = await searchParams
  return (
    <>
      {/* Preload da imagem LCP — apenas em desktop onde o carrossel é visível */}
      <link
        rel="preload"
        as="image"
        href="/_next/image?url=%2Fscreenshots%2Fdashboard.png&w=960&q=75"
        media="(min-width: 1024px)"
      />
      {/* kicked=1 é legado — mantemos compatibilidade */}
      <AuthForm mode="sign-in" kicked={params.kicked === "1"} />
    </>
  )
}

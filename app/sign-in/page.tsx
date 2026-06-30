import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Entrar",
  // Preload da imagem LCP (dashboard.png) injetado no <head> desta rota.
  // O Next.js transforma cada entrada de "other" em <meta> — mas para <link>
  // usamos o campo icons ou openGraph. A forma correta no App Router é via
  // um componente <link> no próprio JSX da page (abaixo).
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
      {/*
        Preload da imagem LCP do carrossel. Injetado no <head> via hoisting
        do Next.js App Router — funciona mesmo dentro de Server Components.
        Apenas para desktop (min-width: 1024px) onde o carrossel é visível.
      */}
      <link
        rel="preload"
        as="image"
        href="/_next/image?url=%2Fscreenshots%2Fdashboard.png&w=960&q=75"
        // @ts-expect-error — fetchpriority é atributo HTML válido mas não tipado no React
        fetchpriority="high"
        media="(min-width: 1024px)"
      />
      {/* kicked=1 é legado — agora usamos /sessao-encerrada, mas mantemos compatibilidade */}
      <AuthForm mode="sign-in" kicked={params.kicked === "1"} />
    </>
  )
}

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AcceptInviteClient } from "./accept-invite-client"

export default async function AceitarConvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) redirect("/dashboard")

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect(`/sign-in?callbackUrl=/aceitar-convite?token=${token}`)

  return <AcceptInviteClient token={token} userName={session.user.name} />
}

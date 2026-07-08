import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { sendPasswordResetEmail } from "@/lib/email"

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL ?? "http://localhost:3000"
}

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined,
  process.env.V0_RUNTIME_URL,
  "http://localhost:3000",
  // Domínio de produção personalizado
  "https://crm.elevanthe.com",
  "https://devnix-crm-plus.vercel.app",
  // Suporta wildcard nativo do Better Auth para o preview iframe da v0
  "https://*.vusercontent.net",
  "https://*.vercel.app",
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: getBaseURL(),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, resetLink: url })
    },
  },
  advanced: {
    defaultCookieAttributes: {
      // SameSite=None + Secure apenas no domínio de produção real.
      // Em qualquer outro ambiente (dev, preview Vercel, iframe v0) usa Lax
      // para não bloquear cookies em contexto de terceiros.
      sameSite: process.env.BETTER_AUTH_URL === "https://crm.elevanthe.com" ? "none" : "lax",
      secure: process.env.BETTER_AUTH_URL === "https://crm.elevanthe.com",
    },
  },
})

import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { sendPasswordResetEmail } from "@/lib/email"

const PRODUCTION_DOMAIN = "crm.elevanthe.com"

const getBaseURL = () => {
  // Prioridade: BETTER_AUTH_URL explícito e correto (não localhost)
  const explicit = process.env.BETTER_AUTH_URL
  if (explicit && !explicit.includes("localhost") && !explicit.includes("127.0.0.1")) {
    return explicit
  }
  // Domínio de produção customizado tem prioridade sobre VERCEL_URL
  if (process.env.VERCEL_ENV === "production") {
    return `https://${PRODUCTION_DOMAIN}`
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL ?? "http://localhost:3000"
}

// Detecta se está em produção real para configurar cookies corretamente
const isProductionDomain = () => {
  const base = getBaseURL()
  return base.includes(PRODUCTION_DOMAIN)
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
      sameSite: isProductionDomain() ? "none" : "lax",
      secure: isProductionDomain(),
    },
  },
})

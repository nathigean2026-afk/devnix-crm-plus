import { betterAuth } from "better-auth"
import { Pool } from "pg"
import { sendPasswordResetEmail } from "@/lib/email"

const PRODUCTION_DOMAIN = "crm.elevanthe.com"

const getBaseURL = () => {
  // 1. Domínio de produção customizado tem prioridade máxima
  if (process.env.VERCEL_ENV === "production") {
    return `https://${PRODUCTION_DOMAIN}`
  }
  // 2. VERCEL_URL (branches/previews do Vercel)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  // 3. URL de runtime do v0 (ex: vm-xxxx.vusercontent.net)
  if (process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL
  // 4. BETTER_AUTH_URL explícito apenas se não for localhost
  const explicit = process.env.BETTER_AUTH_URL
  if (explicit && !explicit.includes("localhost") && !explicit.includes("127.0.0.1")) {
    return explicit
  }
  // 5. Desenvolvimento local
  return "http://localhost:3000"
}

// Cookies seguros em qualquer ambiente HTTPS (produção, preview Vercel, v0)
const isHttps = () => getBaseURL().startsWith("https")

const trustedOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined,
  process.env.V0_RUNTIME_URL,
  // BETTER_AUTH_URL apenas se não for localhost
  process.env.BETTER_AUTH_URL &&
  !process.env.BETTER_AUTH_URL.includes("localhost") &&
  !process.env.BETTER_AUTH_URL.includes("127.0.0.1")
    ? process.env.BETTER_AUTH_URL
    : undefined,
  "http://localhost:3000",
  // Domínio de produção personalizado
  "https://crm.elevanthe.com",
  "https://devnix-crm-plus.vercel.app",
  // Wildcard para preview iframe da v0 e branches do Vercel
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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  advanced: {
    defaultCookieAttributes: {
      // SameSite=None + Secure em qualquer HTTPS (produção, preview Vercel e v0).
      // Em HTTP (localhost dev) usa Lax — browsers rejeitam None sem Secure.
      sameSite: isHttps() ? "none" : "lax",
      secure: isHttps(),
    },
    // Quando o site fica atrás do Cloudflare, o IP da conexão TCP é do proxy.
    // O IP real do visitante está em CF-Connecting-IP (injetado pelo Cloudflare).
    // A ordem importa: o Better Auth usa o primeiro header com IP válido.
    ipAddress: {
      ipAddressHeaders: [
        "cf-connecting-ip",   // IP real do visitante (Cloudflare)
        "x-real-ip",          // Outros proxies reversos
        "x-forwarded-for",    // Fallback padrão
      ],
    },
  },
})

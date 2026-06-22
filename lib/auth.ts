import { betterAuth } from "better-auth"
import { Pool } from "pg"

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL ?? "http://localhost:3000"
}

// Captura dinamicamente o host da v0 preview a partir do V0_RUNTIME_URL
const v0RuntimeHost = process.env.V0_RUNTIME_URL
  ? new URL(process.env.V0_RUNTIME_URL).origin
  : undefined

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined,
  process.env.V0_RUNTIME_URL,
  v0RuntimeHost,
  "http://localhost:3000",
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: getBaseURL(),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  ...(process.env.NODE_ENV === "development" && {
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  }),
})

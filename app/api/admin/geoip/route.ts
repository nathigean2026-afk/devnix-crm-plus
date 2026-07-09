import { NextRequest, NextResponse } from "next/server"

// Cache simples em memória para evitar chamadas repetidas ao ip-api
const geoCache = new Map<string, { city: string; region: string; isp: string; country: string; lat: number; lon: number; ts: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 min

const ADMIN_TOKEN = process.env.ADMIN_SECRET ?? "admin-nathigean-001"

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-token")
  if (auth !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { ips } = await req.json() as { ips: string[] }
  if (!Array.isArray(ips) || ips.length === 0) {
    return NextResponse.json({})
  }

  const result: Record<string, { city: string; region: string; isp: string; country: string }> = {}
  const now = Date.now()

  // Separa IPs já em cache dos que precisam de consulta
  const toFetch: string[] = []
  for (const ip of ips) {
    const clean = ip.replace(/^::ffff:/, "")
    if (!clean || clean === "—" || clean === "::1" || clean === "127.0.0.1" || clean.startsWith("192.168") || clean.startsWith("10.") || clean.startsWith("fc00:") || clean.startsWith("fe80:")) {
      result[ip] = { city: "Localhost", region: "", isp: "Rede local", country: "" }
      continue
    }
    const cached = geoCache.get(clean)
    if (cached && now - cached.ts < CACHE_TTL) {
      result[ip] = { city: cached.city, region: cached.region, isp: cached.isp, country: cached.country }
    } else {
      toFetch.push(clean)
    }
  }

  // Consulta IPs individualmente via ipwho.is (HTTPS gratuito, sem autenticação)
  if (toFetch.length > 0) {
    await Promise.allSettled(
      toFetch.slice(0, 20).map(async (ip) => {
        try {
          const res = await fetch(`https://ipwho.is/${ip}`, {
            signal: AbortSignal.timeout(5000),
          })
          if (!res.ok) return
          const item = await res.json() as any
          if (!item.success) return
          const geo = {
            city: item.city ?? "",
            region: item.region ?? "",
            isp: item.connection?.isp ?? item.connection?.org ?? "",
            country: item.country ?? "",
            lat: item.latitude ?? 0,
            lon: item.longitude ?? 0,
            ts: now,
          }
          geoCache.set(ip, geo)
          const origIp = ips.find(i => i.replace(/^::ffff:/, "") === ip) ?? ip
          result[origIp] = { city: geo.city, region: geo.region, isp: geo.isp, country: geo.country }
        } catch {
          // IP não resolvido — silencia
        }
      })
    )
  }

  return NextResponse.json(result)
}

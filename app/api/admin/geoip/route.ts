import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Cache simples em memória para evitar chamadas repetidas ao ip-api
const geoCache = new Map<string, { city: string; region: string; isp: string; country: string; lat: number; lon: number; ts: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 min

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session?.value || session.value !== "admin-nathigean-001") {
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
    if (!clean || clean === "—" || clean === "127.0.0.1" || clean.startsWith("192.168") || clean.startsWith("10.")) {
      result[ip] = { city: "Local", region: "", isp: "Localhost", country: "" }
      continue
    }
    const cached = geoCache.get(clean)
    if (cached && now - cached.ts < CACHE_TTL) {
      result[ip] = { city: cached.city, region: cached.region, isp: cached.isp, country: cached.country }
    } else {
      toFetch.push(clean)
    }
  }

  // ip-api.com suporta batch de até 100 IPs
  if (toFetch.length > 0) {
    try {
      const res = await fetch("http://ip-api.com/batch?fields=status,query,city,regionName,isp,country", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFetch.slice(0, 100).map(ip => ({ query: ip }))),
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = await res.json() as any[]
        for (const item of data) {
          if (item.status === "success") {
            const geo = { city: item.city ?? "", region: item.regionName ?? "", isp: item.isp ?? "", country: item.country ?? "", lat: 0, lon: 0, ts: now }
            geoCache.set(item.query, geo)
            // mapeia de volta ao IP original (pode ter ::ffff: prefix)
            const origIp = ips.find(i => i.replace(/^::ffff:/, "") === item.query) ?? item.query
            result[origIp] = { city: item.city ?? "", region: item.regionName ?? "", isp: item.isp ?? "", country: item.country ?? "" }
          }
        }
      }
    } catch {
      // ip-api indisponível — retorna sem geo
    }
  }

  return NextResponse.json(result)
}

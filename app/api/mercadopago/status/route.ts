import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("id")
  if (!paymentId) {
    return NextResponse.json({ error: "ID ausente" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      next: { revalidate: 0 },
    })

    const data = await res.json()
    return NextResponse.json({ status: data.status ?? "unknown" })
  } catch (err) {
    console.error("[v0] MP Status erro:", err)
    return NextResponse.json({ error: "Erro ao consultar status" }, { status: 500 })
  }
}

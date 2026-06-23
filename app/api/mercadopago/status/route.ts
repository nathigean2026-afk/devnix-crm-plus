import { NextRequest, NextResponse } from "next/server"
import MercadoPagoConfig, { Payment } from "mercadopago"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("id")
  if (!paymentId) {
    return NextResponse.json({ error: "ID ausente" }, { status: 400 })
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    })

    const paymentClient = new Payment(client)
    const payment = await paymentClient.get({ id: paymentId })

    return NextResponse.json({ status: payment.status })
  } catch (err) {
    console.error("[MP Status]", err)
    return NextResponse.json({ error: "Erro ao consultar status" }, { status: 500 })
  }
}

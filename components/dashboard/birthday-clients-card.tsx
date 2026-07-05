"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBirthdayClients } from "@/lib/actions"
import type { Client } from "@/lib/db/schema"
import { Cake, MessageCircle, Loader2, PartyPopper } from "lucide-react"

function formatDay(birthdate: string): string {
  const d = new Date(birthdate)
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function isToday(birthdate: string): boolean {
  const d = new Date(birthdate)
  const now = new Date()
  return d.getUTCDate() === now.getDate() && (d.getUTCMonth() + 1) === (now.getMonth() + 1)
}

function sendBirthdayWhatsApp(client: Client) {
  const firstName = client.name.split(" ")[0]
  const msg = `Feliz aniversário, ${firstName}! 🎉 Desejamos um dia incrível e muito sucesso. Obrigado por confiar em nossos serviços!`
  const phone = client.phone?.replace(/\D/g, "") ?? ""
  const url = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`
  window.open(url, "_blank")
}

export function BirthdayClientsCard() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBirthdayClients()
      setClients(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const months = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ]
  const currentMonthName = months[new Date().getMonth()]

  const todayBirthdays = clients.filter(c => c.birthdate && isToday(c.birthdate))
  const restBirthdays = clients.filter(c => !c.birthdate || !isToday(c.birthdate))

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground text-sm font-semibold flex items-center gap-2">
          <div className="size-7 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Cake className="size-3.5 text-pink-400" />
          </div>
          Aniversariantes de {currentMonthName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <Cake className="size-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              Nenhum aniversariante em {currentMonthName}.
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              Cadastre datas de nascimento nos clientes para ver aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Aniversariantes de hoje */}
            {todayBirthdays.map(client => (
              <div
                key={client.id}
                className="flex items-center gap-2.5 rounded-lg border border-pink-500/30 bg-pink-500/5 px-3 py-2"
              >
                <div className="size-8 rounded-full bg-pink-500/15 text-pink-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {client.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                    <PartyPopper className="size-3 text-pink-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-pink-400 font-medium">Hoje!</p>
                </div>
                {client.phone && (
                  <Button
                    size="sm"
                    onClick={() => sendBirthdayWhatsApp(client)}
                    className="h-7 px-2.5 bg-green-600 hover:bg-green-700 text-white shrink-0 gap-1 text-xs"
                  >
                    <MessageCircle className="size-3" />
                    Parabenizar
                  </Button>
                )}
              </div>
            ))}

            {/* Outros aniversariantes do mês */}
            {restBirthdays.map(client => (
              <div
                key={client.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/10 px-3 py-2"
              >
                <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {client.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {client.birthdate ? formatDay(client.birthdate) : ""}
                  </p>
                </div>
                {client.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendBirthdayWhatsApp(client)}
                    className="h-7 px-2.5 border-border text-foreground hover:bg-muted shrink-0 gap-1 text-xs"
                  >
                    <MessageCircle className="size-3 text-green-500" />
                    Parabéns
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

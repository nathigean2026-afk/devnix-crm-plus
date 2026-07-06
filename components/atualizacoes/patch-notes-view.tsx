"use client"

import type { PatchNote } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Megaphone, Wrench, Zap, AlertTriangle, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PatchNotesViewProps {
  notes: PatchNote[]
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  feature:  { label: "Nova funcionalidade", icon: Zap,           color: "bg-blue-500/15 text-blue-400 border-blue-500/25",   dot: "bg-blue-400" },
  fix:      { label: "Correção",            icon: Wrench,        color: "bg-green-500/15 text-green-400 border-green-500/25", dot: "bg-green-400" },
  update:   { label: "Melhoria",            icon: RefreshCw,     color: "bg-amber-500/15 text-amber-400 border-amber-500/25", dot: "bg-amber-400" },
  breaking: { label: "Mudança importante",  icon: AlertTriangle, color: "bg-red-500/15 text-red-400 border-red-500/25",       dot: "bg-red-400" },
  news:     { label: "Novidade",            icon: Megaphone,     color: "bg-purple-500/15 text-purple-400 border-purple-500/25", dot: "bg-purple-400" },
}

function renderBody(body: string) {
  // Renderiza linhas que começam com "- " como bullet points e negrito com **texto**
  return body.split("\n").map((line, i) => {
    const isBullet = line.trimStart().startsWith("- ")
    const content = isBullet ? line.trimStart().slice(2) : line

    // Processa **negrito**
    const parts = content.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-foreground">{part}</strong> : <span key={j}>{part}</span>
    )

    if (isBullet) {
      return (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
          <span className="mt-2 size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
          <span>{rendered}</span>
        </li>
      )
    }
    if (!line.trim()) return <div key={i} className="h-2" />
    return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{rendered}</p>
  })
}

export function PatchNotesView({ notes }: PatchNotesViewProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Atualizações da Plataforma</h1>
          <p className="text-muted-foreground text-sm mt-1">Novidades, melhorias e correções do Elevanthe CRM</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Megaphone className="size-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Nenhuma atualização publicada ainda.</p>
        </div>
      </div>
    )
  }

  // Agrupa por mês/ano
  const groups: Record<string, PatchNote[]> = {}
  for (const note of notes) {
    const key = format(new Date(note.createdAt), "MMMM 'de' yyyy", { locale: ptBR })
    if (!groups[key]) groups[key] = []
    groups[key].push(note)
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Atualizações da Plataforma</h1>
        <p className="text-muted-foreground text-sm">Novidades, melhorias e correções do Elevanthe CRM</p>
      </div>

      {/* Timeline */}
      {Object.entries(groups).map(([month, groupNotes]) => (
        <div key={month} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 capitalize">{month}</p>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex flex-col gap-4">
            {groupNotes.map((note) => {
              const cfg = typeConfig[note.type] ?? typeConfig.update
              const TypeIcon = cfg.icon
              const hasBullets = note.body.split("\n").some(l => l.trimStart().startsWith("- "))
              const bodyLines = renderBody(note.body)

              return (
                <Card key={note.id} className="bg-card border-border relative overflow-hidden">
                  {/* Barra lateral colorida */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.dot}`} />

                  <CardContent className="p-5 pl-6">
                    {/* Topo: tipo + versão + data */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={`${cfg.color} flex items-center gap-1.5 text-xs`}>
                        <TypeIcon className="size-3" />
                        {cfg.label}
                      </Badge>
                      <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        v{note.version}
                      </span>
                      <span className="text-xs text-muted-foreground/60 ml-auto">
                        {format(new Date(note.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Título */}
                    <h2 className="text-base font-semibold text-foreground mb-2">{note.title}</h2>

                    {/* Corpo */}
                    {hasBullets ? (
                      <ul className="flex flex-col gap-1.5">
                        {bodyLines}
                      </ul>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {bodyLines}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

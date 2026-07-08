"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

interface PatchNote {
  id: string
  version: string
  title: string
  content: string
  type: "feature" | "fix" | "improvement" | "breaking"
  publishedAt: string
}

interface Props {
  darkMode: boolean
  patchNotesList: PatchNote[]
  setPatchNotesList: (v: PatchNote[]) => void
  patchNotesLoaded: boolean
}

const TYPE_LABELS: Record<PatchNote["type"], { label: string; color: string }> = {
  feature:     { label: "Novidade",    color: "bg-emerald-500/15 text-emerald-400" },
  fix:         { label: "Correcao",    color: "bg-red-500/15 text-red-400" },
  improvement: { label: "Melhoria",    color: "bg-blue-500/15 text-blue-400" },
  breaking:    { label: "Atencao",     color: "bg-amber-500/15 text-amber-400" },
}

export function AdminAtualizacoesTab({ darkMode, patchNotesList, setPatchNotesList, patchNotesLoaded }: Props) {
  const [form, setForm] = useState<Partial<PatchNote>>({ type: "feature" })
  const [editing, setEditing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const inputCls = cn(
    "w-full text-sm rounded-lg px-3 py-2 border outline-none transition-colors",
    darkMode
      ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
      : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-primary/50"
  )

  async function handleSave() {
    if (!form.version || !form.title || !form.content) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/patch-notes", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editing ? { ...form, id: editing } : form),
      })
      if (res.ok) {
        const updated: PatchNote[] = await res.json()
        setPatchNotesList(updated)
        setForm({ type: "feature" })
        setEditing(null)
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/patch-notes?id=${id}`, { method: "DELETE", credentials: "include" })
    if (res.ok) {
      const updated: PatchNote[] = await res.json()
      setPatchNotesList(updated)
    }
  }

  function startEdit(note: PatchNote) {
    setForm(note)
    setEditing(note.id)
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>
            Atualizacoes do Sistema
          </h2>
          <p className={cn("text-xs mt-0.5", darkMode ? "text-white/30" : "text-slate-400")}>
            Patch notes visiveis para os usuarios
          </p>
        </div>
        <button
          onClick={() => { setForm({ type: "feature" }); setEditing(null); setOpen(true) }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-3.5" />
          Nova nota
        </button>
      </div>

      {/* Form */}
      {open && (
        <div className={cn("rounded-xl border p-5", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
          <h3 className={cn("text-sm font-semibold mb-4", darkMode ? "text-white/80" : "text-slate-700")}>
            {editing ? "Editar nota" : "Nova nota de atualizacao"}
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>Versao *</label>
              <input className={inputCls} placeholder="ex: 1.4.2" value={form.version ?? ""} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
            </div>
            <div>
              <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>Tipo</label>
              <select className={inputCls} value={form.type ?? "feature"} onChange={e => setForm(f => ({ ...f, type: e.target.value as PatchNote["type"] }))}>
                <option value="feature">Novidade</option>
                <option value="fix">Correcao</option>
                <option value="improvement">Melhoria</option>
                <option value="breaking">Atencao</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>Titulo *</label>
            <input className={inputCls} placeholder="Titulo da atualizacao..." value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="mb-4">
            <label className={cn("text-xs font-medium mb-1.5 block", darkMode ? "text-white/50" : "text-slate-500")}>Descricao *</label>
            <textarea rows={4} className={cn(inputCls, "resize-none")} placeholder="Descreva as mudancas..." value={form.content ?? ""} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? "Salvando..." : editing ? "Salvar alteracoes" : "Publicar nota"}
            </button>
            <button onClick={() => { setOpen(false); setForm({ type: "feature" }); setEditing(null) }} className={cn("text-sm px-4 py-2 rounded-lg border transition-colors", darkMode ? "border-white/10 text-white/50 hover:text-white" : "border-slate-200 text-slate-500 hover:text-slate-700")}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {!patchNotesLoaded ? (
        <div className={cn("rounded-xl border p-8 text-center", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
          <p className={cn("text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Carregando...</p>
        </div>
      ) : patchNotesList.length === 0 ? (
        <div className={cn("rounded-xl border p-8 text-center", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
          <Megaphone className={cn("size-8 mx-auto mb-3", darkMode ? "text-white/20" : "text-slate-300")} />
          <p className={cn("text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhuma nota publicada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patchNotesList.map(note => {
            const badge = TYPE_LABELS[note.type]
            return (
              <div key={note.id} className={cn("rounded-xl border p-4", darkMode ? "border-white/8 bg-white/3" : "border-slate-200 bg-white")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-xs font-mono font-semibold px-2 py-0.5 rounded", darkMode ? "bg-white/8 text-white/60" : "bg-slate-100 text-slate-500")}>
                      v{note.version}
                    </span>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", badge.color)}>{badge.label}</span>
                    <span className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-slate-800")}>{note.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(note)} className={cn("p-1.5 rounded-lg hover:bg-white/5 transition-colors", darkMode ? "text-white/30 hover:text-white/70" : "text-slate-400 hover:text-slate-600")}>
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => handleDelete(note.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className={cn("text-xs mt-2 leading-relaxed", darkMode ? "text-white/40" : "text-slate-500")}>{note.content}</p>
                <p className={cn("text-[10px] mt-2", darkMode ? "text-white/20" : "text-slate-300")}>{note.publishedAt}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

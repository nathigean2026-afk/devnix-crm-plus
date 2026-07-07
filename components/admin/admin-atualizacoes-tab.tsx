"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PatchNote } from "@/lib/db/schema"
import { adminCreatePatchNote, adminUpdatePatchNote, adminDeletePatchNote, adminGetPatchNotes } from "@/lib/actions"

interface Props {
  darkMode: boolean
  patchNotesList: PatchNote[]
  setPatchNotesList: (list: PatchNote[]) => void
  patchNotesLoaded: boolean
}

export function AdminAtualizacoesTab({ darkMode, patchNotesList, setPatchNotesList, patchNotesLoaded }: Props) {
  const [patchForm, setPatchForm] = useState({ version: "", title: "", body: "", type: "feature", published: true })
  const [patchFormOpen, setPatchFormOpen] = useState(false)
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null)
  const [patchSaving, setPatchSaving] = useState(false)

  const inputCls = cn("rounded-lg px-3 py-2 text-sm focus:outline-none border", darkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-800")

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={cn("text-sm font-semibold uppercase tracking-wider", darkMode ? "text-white/70" : "text-slate-500")}>
          Notas de Atualização
        </h2>
        <button
          onClick={() => { setPatchForm({ version: "", title: "", body: "", type: "feature", published: true }); setEditingPatchId(null); setPatchFormOpen(true) }}
          className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="size-4" /> Nova atualização
        </button>
      </div>

      {/* Formulário de criação/edição */}
      {patchFormOpen && (
        <div className={cn("rounded-xl border p-5 space-y-4", darkMode ? "bg-white/4 border-white/10" : "bg-white border-slate-200 shadow-sm")}>
          <p className={cn("text-sm font-semibold", darkMode ? "text-white" : "text-slate-800")}>
            {editingPatchId ? "Editar Atualização" : "Nova Atualização"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className={cn("text-xs", darkMode ? "text-white/50" : "text-slate-500")}>Versão</label>
              <input value={patchForm.version} onChange={e => setPatchForm(f => ({ ...f, version: e.target.value }))} placeholder="ex: 1.4.2" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={cn("text-xs", darkMode ? "text-white/50" : "text-slate-500")}>Título</label>
              <input value={patchForm.title} onChange={e => setPatchForm(f => ({ ...f, title: e.target.value }))} placeholder="Título da atualização" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className={cn("text-xs", darkMode ? "text-white/50" : "text-slate-500")}>Tipo</label>
              <select value={patchForm.type} onChange={e => setPatchForm(f => ({ ...f, type: e.target.value }))}
                className={cn("rounded-lg px-3 py-2 text-sm focus:outline-none border w-full appearance-none",
                  darkMode ? "bg-[#1a1a2e] border-white/10 text-white [&>option]:bg-[#1a1a2e] [&>option]:text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                )}
              >
                <option value="feature">Nova funcionalidade</option>
                <option value="fix">Correção</option>
                <option value="update">Melhoria</option>
                <option value="breaking">Mudança importante</option>
                <option value="news">Novidade</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={cn("text-xs", darkMode ? "text-white/50" : "text-slate-500")}>Status</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input type="checkbox" checked={patchForm.published} onChange={e => setPatchForm(f => ({ ...f, published: e.target.checked }))} className="size-4 accent-primary" />
                <span className={cn("text-sm", darkMode ? "text-white/70" : "text-slate-600")}>Publicada (visível aos usuários)</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={cn("text-xs", darkMode ? "text-white/50" : "text-slate-500")}>
              Conteúdo — use <code className="font-mono">- item</code> para lista e <code className="font-mono">**negrito**</code>
            </label>
            <textarea value={patchForm.body} onChange={e => setPatchForm(f => ({ ...f, body: e.target.value }))} rows={6}
              placeholder={"- Corrigido problema no cálculo\n- Adicionado suporte a múltiplos clientes\n**Nota:** requer atualização da página"}
              className={cn("rounded-lg px-3 py-2 text-sm resize-y focus:outline-none w-full border font-mono", darkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 text-slate-800")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setPatchFormOpen(false); setEditingPatchId(null) }}
              className={cn("text-sm px-4 py-2 border rounded-lg transition-colors", darkMode ? "text-white/50 border-white/10 hover:text-white/80" : "text-slate-500 border-slate-200")}
            >Cancelar</button>
            <button
              disabled={patchSaving || !patchForm.title.trim() || !patchForm.version.trim() || !patchForm.body.trim()}
              onClick={async () => {
                if (!patchForm.title.trim() || !patchForm.version.trim() || !patchForm.body.trim()) return
                setPatchSaving(true)
                try {
                  if (editingPatchId) {
                    await adminUpdatePatchNote(editingPatchId, patchForm)
                    setPatchNotesList(patchNotesList.map(n => n.id === editingPatchId ? { ...n, ...patchForm, updatedAt: new Date() } : n))
                  } else {
                    const res = await adminCreatePatchNote(patchForm)
                    if (res.ok) { const updated = await adminGetPatchNotes(); setPatchNotesList(updated) }
                  }
                  setPatchFormOpen(false); setEditingPatchId(null)
                  setPatchForm({ version: "", title: "", body: "", type: "feature", published: true })
                } finally { setPatchSaving(false) }
              }}
              className="text-sm bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg disabled:opacity-60 transition-colors"
            >{patchSaving ? "Salvando..." : editingPatchId ? "Salvar alterações" : "Publicar"}</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {!patchNotesLoaded ? (
        <p className={cn("text-sm text-center py-8", darkMode ? "text-white/30" : "text-slate-400")}>Carregando...</p>
      ) : patchNotesList.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Megaphone className={cn("size-8", darkMode ? "text-white/20" : "text-slate-300")} />
          <p className={cn("text-sm", darkMode ? "text-white/30" : "text-slate-400")}>Nenhuma atualização publicada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patchNotesList.map(note => (
            <div key={note.id} className={cn("rounded-xl border p-4 flex items-start justify-between gap-4", darkMode ? "bg-white/4 border-white/8" : "bg-white border-slate-200 shadow-sm")}>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-xs font-mono px-2 py-0.5 rounded border", darkMode ? "bg-white/5 border-white/10 text-white/60" : "bg-slate-100 border-slate-200 text-slate-500")}>v{note.version}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full",
                    note.type === "feature" ? "bg-blue-500/20 text-blue-400" :
                    note.type === "fix" ? "bg-green-500/20 text-green-400" :
                    note.type === "breaking" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                  )}>
                    {note.type === "feature" ? "Nova func." : note.type === "fix" ? "Correção" : note.type === "breaking" ? "Importante" : note.type === "news" ? "Novidade" : "Melhoria"}
                  </span>
                  {!note.published && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", darkMode ? "bg-white/5 text-white/30" : "bg-slate-100 text-slate-400")}>Rascunho</span>
                  )}
                </div>
                <p className={cn("font-semibold text-sm", darkMode ? "text-white" : "text-slate-800")}>{note.title}</p>
                <p className={cn("text-xs line-clamp-2", darkMode ? "text-white/40" : "text-slate-400")}>{note.body}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setPatchForm({ version: note.version, title: note.title, body: note.body, type: note.type, published: note.published }); setEditingPatchId(note.id); setPatchFormOpen(true) }}
                  className={cn("p-1.5 rounded-lg transition-colors", darkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100")}
                ><Pencil className="size-3.5" /></button>
                <button
                  onClick={async () => {
                    if (!confirm("Excluir esta atualização?")) return
                    await adminDeletePatchNote(note.id)
                    setPatchNotesList(patchNotesList.filter(n => n.id !== note.id))
                  }}
                  className={cn("p-1.5 rounded-lg transition-colors", darkMode ? "text-red-400/60 hover:text-red-400 hover:bg-red-500/10" : "text-red-400 hover:text-red-500 hover:bg-red-50")}
                ><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

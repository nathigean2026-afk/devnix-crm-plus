import { getPatchNotes } from "@/lib/actions"
import { PatchNotesView } from "@/components/atualizacoes/patch-notes-view"

export const dynamic = "force-dynamic"

export default async function AtualizacoesPage() {
  const notes = await getPatchNotes()
  return <PatchNotesView notes={notes} />
}

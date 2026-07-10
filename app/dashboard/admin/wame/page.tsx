"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, Loader2, Copy } from "lucide-react"
import { toast } from "sonner"

export default function WameConfigPage() {
  const [key, setKey] = useState("")
  const [server, setServer] = useState("https://us.api-wa.me")
  const [status, setStatus] = useState<null | { ok: boolean; keyLength: number; keyPreview: string; testResult: { ok: boolean; status?: number; body?: string } }>(null)
  const [testing, setTesting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/wame-config")
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleTest() {
    if (!key.trim()) { toast.error("Cole a chave do Wame primeiro"); return }
    setTesting(true)
    try {
      const res = await fetch("/api/admin/wame-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), server }),
      })
      const data = await res.json()
      toast[data.testResult?.ok ? "success" : "error"](data.instruction)
      if (data.testResult?.ok) {
        // Recarrega status
        const s = await fetch("/api/admin/wame-config").then(r => r.json())
        setStatus(s)
      }
    } finally {
      setTesting(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto py-12 px-4 font-sans">
      <h1 className="text-xl font-semibold text-foreground mb-1">Diagnóstico Wame API</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Cole a chave completa da sua instância Wame abaixo para testar e confirmar a integração.
      </p>

      {/* Status atual */}
      {!loading && status && (
        <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 mb-6 text-sm ${
          status.testResult?.ok
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {status.testResult?.ok
            ? <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            : <XCircle className="size-4 shrink-0 mt-0.5" />}
          <div>
            <p className="font-medium">
              {status.testResult?.ok ? "Instância conectada e funcionando" : "Instância não encontrada ou chave inválida"}
            </p>
            <p className="text-xs mt-0.5 opacity-75">
              Chave atual: <span className="font-mono">{status.keyPreview}</span> ({status.keyLength} chars)
            </p>
            {status.testResult?.body && (
              <p className="text-xs mt-1 font-mono opacity-60 break-all">{status.testResult.body}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="wame-key" className="text-sm font-medium mb-1.5 block">
            Chave da instância (Key)
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Encontre no painel Wame: <strong>portal.api-wa.me</strong> → Dashboard → campo <strong>Key</strong> → clique no ícone de copiar
          </p>
          <Input
            id="wame-key"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Cole aqui a chave completa da instância"
            className="font-mono text-xs"
          />
        </div>

        <div>
          <Label htmlFor="wame-server" className="text-sm font-medium mb-1.5 block">
            Servidor
          </Label>
          <Input
            id="wame-server"
            value={server}
            onChange={e => setServer(e.target.value)}
            placeholder="https://us.api-wa.me"
            className="font-mono text-xs"
          />
        </div>

        <Button onClick={handleTest} disabled={testing} className="w-full">
          {testing ? <><Loader2 className="size-4 mr-2 animate-spin" />Testando...</> : "Testar conexão"}
        </Button>

        {key && (
          <div className="rounded-md bg-muted/50 border border-border p-3 text-xs">
            <p className="font-medium text-foreground mb-1">Após confirmar que funciona:</p>
            <p className="text-muted-foreground mb-2">Adicione nas <strong>Vars</strong> do projeto (engrenagem superior direita):</p>
            <div className="flex items-center gap-2 bg-background border border-border rounded px-2 py-1.5 font-mono">
              <span className="flex-1 break-all">WAME_API_KEY={key}</span>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(`WAME_API_KEY=${key}`); toast.success("Copiado!") }}
              >
                <Copy className="size-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Paperclip, ExternalLink, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ChatMsg = { role: "user" | "bot"; text: string }

const BOT_RESPONSES: Record<string, string> = {
  default:
    "Olá! Sou o suporte do Elevanthe CRM. Posso te ajudar com dúvidas gerais aqui. Para abrir um ticket oficial com histórico e anexos, acesse a área de Suporte dentro do painel após o login.",
  plano:
    "Temos 3 planos disponíveis. Após fazer login, acesse Configurações > Licença para ver os planos e usar códigos promocionais.",
  senha:
    'Para redefinir sua senha, clique em "Esqueci minha senha" na tela de login ou entre em contato pelo e-mail suporte@devnixcrm.com.',
  login:
    "Se estiver com problemas para entrar, verifique seu e-mail e senha. Se o problema persistir, abra um ticket de suporte após acessar o sistema.",
  ticket:
    "Para abrir um ticket de suporte detalhado com anexos e acompanhamento, faça login e acesse o menu Suporte no painel.",
  preco:
    "Nossos planos começam com período de teste gratuito via código promocional. Fale com nosso time para saber mais.",
}

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes("plano") || lower.includes("assinatura") || lower.includes("licença"))
    return BOT_RESPONSES.plano
  if (lower.includes("senha") || lower.includes("esqueci") || lower.includes("redefinir"))
    return BOT_RESPONSES.senha
  if (lower.includes("login") || lower.includes("entrar") || lower.includes("acessar"))
    return BOT_RESPONSES.login
  if (lower.includes("ticket") || lower.includes("suporte") || lower.includes("ajuda"))
    return BOT_RESPONSES.ticket
  if (lower.includes("preço") || lower.includes("valor") || lower.includes("custa"))
    return BOT_RESPONSES.preco
  return BOT_RESPONSES.default
}

export function LoginChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: "Olá! Como posso te ajudar? Tire dúvidas aqui ou faça login para abrir um ticket oficial.",
    },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, open])

  function send() {
    const text = input.trim()
    if (!text) return
    setInput("")
    setMsgs((prev) => [...prev, { role: "user", text }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((prev) => [...prev, { role: "bot", text: getBotReply(text) }])
    }, 900)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Painel do chat */}
      {open && (
        <div className="w-80 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <MessageCircle className="size-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground leading-none">Suporte Elevanthe</p>
                <p className="text-xs text-primary-foreground/70 mt-0.5">Resposta rápida</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              <ChevronDown className="size-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72 bg-background/60">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 flex gap-1 items-center">
                  <span className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Link para suporte completo */}
          <div className="px-3 py-1.5 bg-muted/40 border-t border-border">
            <a
              href="/sign-in"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="size-3" />
              Faça login para abrir um ticket oficial
            </a>
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 p-3 border-t border-border bg-card">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Digite sua mensagem..."
              className="resize-none min-h-[36px] max-h-24 text-sm bg-input border-border"
              rows={1}
            />
            <Button size="icon" onClick={send} disabled={!input.trim()} className="shrink-0">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "size-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          open && "rotate-0 scale-95",
        )}
        aria-label="Abrir chat de suporte"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  )
}

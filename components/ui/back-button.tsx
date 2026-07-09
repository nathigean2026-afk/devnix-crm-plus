"use client"

import { ArrowLeft, X } from "lucide-react"

/**
 * Botão de voltar seguro para PWA.
 *
 * Lógica:
 * - Se o app está rodando em modo standalone (PWA instalada) OU não tem histórico
 *   de navegação anterior, exibe "Fechar" e chama window.close().
 * - Caso contrário, exibe "Voltar" e chama history.back().
 *
 * Isso evita fechar o app inteiro quando o usuário está no modo PWA.
 */
export function BackButton({ className }: { className?: string }) {
  function handle() {
    const isStandalone =
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches

    if (isStandalone || window.history.length <= 1) {
      window.close()
    } else {
      window.history.back()
    }
  }

  const isStandalone =
    typeof window !== "undefined" &&
    window.matchMedia("(display-mode: standalone)").matches
  const hasHistory = typeof window !== "undefined" && window.history.length > 1

  const label = isStandalone || !hasHistory ? "Fechar" : "Voltar"
  const Icon  = isStandalone || !hasHistory ? X : ArrowLeft

  return (
    <button
      onClick={handle}
      className={
        className ??
        "inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      }
      aria-label={label}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}

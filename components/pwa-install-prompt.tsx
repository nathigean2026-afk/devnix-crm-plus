"use client"

import { useEffect, useState } from "react"
import { Download, X, Smartphone } from "lucide-react"
import Image from "next/image"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Registra o Service Worker no cliente (sem script inline no <head> para evitar hydration mismatch)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .catch((err) => console.warn("[PWA] SW registration failed:", err))
      })
    }
  }, [])

  useEffect(() => {
    // Não mostrar se já está instalado como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return
    // Não mostrar se já foi dispensado nesta sessão
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return

    // Detecta iOS (Safari não emite beforeinstallprompt)
    const ua = navigator.userAgent
    const isIosDevice = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isInStandaloneMode = ("standalone" in navigator) && (navigator as unknown as { standalone: boolean }).standalone

    if (isIosDevice && !isInStandaloneMode) {
      setIsIos(true)
      // Mostra instrução iOS após 3s
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }

    // Android / Chrome / outros: aguarda o evento nativo
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 2000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem("pwa-prompt-dismissed", "1")
  }

  if (!show || dismissed) return null

  return (
    <div
      role="dialog"
      aria-label="Instalar Elevanthe CRM"
      className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-sm"
    >
      <div className="rounded-2xl border border-white/10 bg-[#0d1526] shadow-2xl shadow-black/60 backdrop-blur-xl p-4">
        <div className="flex items-start gap-3">
          {/* Ícone do app */}
          <div className="shrink-0 rounded-xl overflow-hidden w-12 h-12 bg-white/5 flex items-center justify-center">
            <Image
              src="/pwa-icon-192.png"
              alt="Elevanthe CRM"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">
              Instalar Elevanthe CRM
            </p>
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
              {isIos
                ? 'Toque em "Compartilhar" e depois "Adicionar à Tela de Início"'
                : "Adicione à tela inicial para acesso rápido, offline e sem o navegador."}
            </p>
          </div>

          {/* Fechar */}
          <button
            onClick={handleDismiss}
            aria-label="Fechar"
            className="shrink-0 p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Botões de ação */}
        {!isIos && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/60 border border-white/10 hover:border-white/20 transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Download className="size-3.5" />
              Instalar
            </button>
          </div>
        )}

        {/* Instrução iOS visual */}
        {isIos && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/[0.07]">
            <Smartphone className="size-4 text-blue-400 shrink-0" />
            <p className="text-[11px] text-white/50 leading-tight">
              Safari <span className="text-white/70 font-medium">→</span> Compartilhar{" "}
              <span className="text-white/70 font-medium">→</span> Adicionar à Tela de Início
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

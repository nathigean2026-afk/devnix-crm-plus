"use client"

import { useEffect, useState } from "react"
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
  const [visible, setVisible] = useState(false)

  // Registra o Service Worker
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
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return

    const ua = navigator.userAgent
    const isIosDevice = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isInStandaloneMode = ("standalone" in navigator) && (navigator as unknown as { standalone: boolean }).standalone

    if (isIosDevice && !isInStandaloneMode) {
      setIsIos(true)
      const t = setTimeout(() => {
        setShow(true)
        setTimeout(() => setVisible(true), 50)
      }, 3000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => {
        setShow(true)
        setTimeout(() => setVisible(true), 50)
      }, 2000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setVisible(false)
      setTimeout(() => setShow(false), 350)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setShow(false)
      setDismissed(true)
    }, 350)
    sessionStorage.setItem("pwa-prompt-dismissed", "1")
  }

  if (!show || dismissed) return null

  return (
    <div
      role="dialog"
      aria-label="Instalar Elevanthe CRM"
      className="fixed bottom-0 left-0 right-0 z-[9999] px-3 pb-4"
      style={{
        transform: visible ? "translateY(0)" : "translateY(110%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease",
      }}
    >
      {/* Card principal */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #111827 0%, #0d1526 60%, #0a1020 100%)",
          border: "1px solid rgba(124, 58, 237, 0.25)",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Brilho decorativo roxo no topo */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }}
        />
        {/* Brilho ciano sutil no canto */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)" }}
        />

        <div className="relative p-4">
          {/* Linha superior: badge + fechar */}
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase"
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "#a78bfa",
              }}
            >
              <svg className="size-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Disponível como app
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Fechar"
              className="p-1.5 rounded-full transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Conteúdo: ícone + texto */}
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className="shrink-0 rounded-2xl overflow-hidden"
              style={{
                width: 56,
                height: 56,
                boxShadow: "0 4px 20px rgba(124,58,237,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              <Image
                src="/pwa-icon-192.png"
                alt="Elevanthe CRM"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-white leading-tight tracking-tight">
                Elevanthe CRM
              </p>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                {isIos
                  ? "Instale direto do Safari para acesso rápido e offline"
                  : "Acesso instantâneo, offline e sem abrir o navegador"}
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />

          {/* Botões Android */}
          {!isIos && (
            <div className="flex gap-2.5">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-2xl text-sm font-medium transition-colors"
                style={{
                  color: "rgba(255,255,255,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Agora não
              </button>
              <button
                onClick={handleInstall}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #6d28d9 50%, #5b21b6 100%)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                Instalar app
              </button>
            </div>
          )}

          {/* Instrução iOS */}
          {isIos && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
              <div>
                <p className="text-xs font-medium text-white/80">Como instalar no iPhone</p>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Compartilhar{" "}
                  <span className="text-white/60 font-semibold">→</span>{" "}
                  Adicionar à Tela de Início
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

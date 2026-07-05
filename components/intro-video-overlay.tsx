"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

interface IntroVideoOverlayProps {
  onEnd?: () => void
}

export function IntroVideoOverlay({ onEnd }: IntroVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    // Pré-carrega /demo para que o redirect seja instantâneo ao pular
    router.prefetch("/demo")
  }, [router])

  useEffect(() => {
    if (!mounted) return
    const video = videoRef.current
    if (!video) return

    document.body.style.overflow = "hidden"

    video.play().catch(() => {
      video.muted = true
      video.play()
    })

    function handleEnd() {
      if (doneRef.current) return
      doneRef.current = true
      document.body.style.overflow = ""
      if (onEnd) onEnd()
      else router.push("/demo")
    }

    video.addEventListener("ended", handleEnd)
    return () => {
      video.removeEventListener("ended", handleEnd)
      document.body.style.overflow = ""
    }
  }, [mounted, onEnd, router])

  function handleSkip() {
    if (doneRef.current) return
    doneRef.current = true
    // Para o vídeo e libera recursos imediatamente
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ""
    }
    document.body.style.overflow = ""
    if (onEnd) onEnd()
    else router.push("/demo")
  }

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "#000",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        animation: "introFadeIn 0.3s ease",
      }}
    >
      <style>{`
        @keyframes introFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <video
        ref={videoRef}
        src="/intro-elevanthe.mp4"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        playsInline
        preload="auto"
      />

      {/* Botão pular — canto inferior direito */}
      <button
        onClick={handleSkip}
        style={{
          position: "absolute",
          bottom: "2rem",
          right: "1.5rem",
          color: "rgba(255,255,255,0.5)",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "9999px",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          backdropFilter: "blur(8px)",
          transition: "color 0.2s, background 0.2s",
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.95)"
          e.currentTarget.style.background = "rgba(0,0,0,0.6)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.5)"
          e.currentTarget.style.background = "rgba(0,0,0,0.4)"
        }}
      >
        Pular intro
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </button>
    </div>,
    document.body
  )
}

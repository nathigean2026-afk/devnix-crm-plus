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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const video = videoRef.current
    if (!video) return

    // Trava scroll do body enquanto o intro toca
    document.body.style.overflow = "hidden"

    // Tenta dar play com som; se o browser bloquear, toca mudo
    video.play().catch(() => {
      video.muted = true
      video.play()
    })

    function handleEnd() {
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
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          transition: "color 0.2s",
          zIndex: 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
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

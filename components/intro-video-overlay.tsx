"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface IntroVideoOverlayProps {
  onEnd?: () => void
}

export function IntroVideoOverlay({ onEnd }: IntroVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Tenta dar play com som; se o browser bloquear, toca sem som
    video.play().catch(() => {
      video.muted = true
      video.play()
    })

    function handleEnd() {
      if (onEnd) {
        onEnd()
      } else {
        router.push("/demo")
      }
    }

    video.addEventListener("ended", handleEnd)
    return () => video.removeEventListener("ended", handleEnd)
  }, [onEnd, router])

  function handleSkip() {
    if (onEnd) {
      onEnd()
    } else {
      router.push("/demo")
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ animation: "fadeIn 0.3s ease" }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <video
        ref={videoRef}
        src="/intro-elevanthe.mp4"
        className="w-full h-full object-cover"
        playsInline
        preload="auto"
        // sem controls, sem loop
      />

      {/* Botão pular — canto inferior direito */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 text-white/50 hover:text-white/90 text-sm transition-colors flex items-center gap-1.5 select-none"
      >
        Pular intro
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      </button>
    </div>
  )
}

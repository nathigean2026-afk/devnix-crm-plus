"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const slides = [
  { src: "/screenshots/dashboard.png",  label: "Dashboard",  desc: "Visão geral do seu negócio em tempo real" },
  { src: "/screenshots/clientes.png",   label: "Clientes",   desc: "Gerencie sua base de clientes com facilidade" },
  { src: "/screenshots/orcamentos.png", label: "Orçamentos", desc: "Crie e envie orçamentos profissionais" },
  { src: "/screenshots/financeiro.png", label: "Financeiro", desc: "Controle receitas, despesas e saldo" },
  { src: "/screenshots/relatorios.png", label: "Relatórios", desc: "Análises e métricas do seu negócio" },
]

export function ScreenshotCarousel() {
  const [active, setActive] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setActive((prev) => (prev + 1) % slides.length)
        setAnimating(false)
      }, 400)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  const goTo = (idx: number) => {
    if (idx === active) return
    setAnimating(true)
    setTimeout(() => { setActive(idx); setAnimating(false) }, 300)
  }

  const current = slides[active]

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/70 bg-[#0d0d14]">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-red-500/40" />
            <div className="size-2.5 rounded-full bg-yellow-500/40" />
            <div className="size-2.5 rounded-full bg-green-500/40" />
          </div>
          <div className="flex-1 mx-2 h-5 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-2">
            <span className="text-[10px] text-white/20 truncate">
              app.elevanthe.com.br/{current.label.toLowerCase()}
            </span>
          </div>
        </div>
        <div className={cn("transition-opacity duration-300", animating ? "opacity-0" : "opacity-100")}>
          {slides.map((slide, i) => (
            <Image
              key={slide.src}
              src={slide.src}
              alt={`${slide.label} — Elevanthe CRM`}
              width={520}
              height={325}
              className={cn("w-full h-auto object-cover object-top", i === active ? "block" : "hidden")}
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              sizes="(max-width: 1023px) 1px, (max-width: 1280px) 460px, 520px"
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className={cn("transition-all duration-300", animating ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0")}>
          <p className="text-xs font-semibold text-white/60">{current.label}</p>
          <p className="text-[11px] text-white/25">{current.desc}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === active ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Ver ${slides[i].label}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

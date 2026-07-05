"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, UsersRound, Wrench, FileText, DollarSign,
  ArrowRight, Check, ChevronLeft, ChevronRight, Zap, Sun, Moon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PLANOS_URL = "https://crm.elevanthe.com/planos/publico"
const SIGNUP_URL = "/sign-up"
const SIGNIN_URL = "/sign-in"

const modules = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "dashboard",
    tag: "Visão geral",
    title: "Tudo que importa, em uma tela",
    desc: "Acompanhe em tempo real os números mais importantes do seu negócio. Receita, clientes ativos, orçamentos e ordens de serviço resumidos num painel limpo.",
    features: [
      "Métricas financeiras em tempo real",
      "Gráfico de receita vs despesa",
      "Clientes e orçamentos recentes",
      "Acesso rápido a todos os módulos",
    ],
    screenshot: "/demo-dashboard.png",
    stat: { value: "100%", label: "visibilidade do negócio" },
  },
  {
    id: "clientes",
    icon: UsersRound,
    label: "Clientes",
    path: "dashboard/clientes",
    tag: "Gestão de clientes",
    title: "Sua base organizada e acessível",
    desc: "Cadastre e organize todos os seus clientes com informações completas. Busca rápida, filtros por status e histórico de interações.",
    features: [
      "Busca e filtros avançados",
      "Cadastro completo com contatos",
      "Status ativo / inativo",
      "Histórico de serviços por cliente",
    ],
    screenshot: "/demo-clientes.png",
    stat: { value: "∞", label: "clientes cadastrados" },
  },
  {
    id: "orcamentos",
    icon: FileText,
    label: "Orçamentos",
    path: "dashboard/orcamentos",
    tag: "Propostas comerciais",
    title: "Orçamentos profissionais em minutos",
    desc: "Gere orçamentos detalhados com itens, quantidades e valores. Controle o status de cada proposta e saiba quais foram aprovadas.",
    features: [
      "Criação rápida de propostas",
      "Itens e valores detalhados",
      "Status de aprovação",
      "Histórico completo",
    ],
    screenshot: "/demo-orcamentos.png",
    stat: { value: "3min", label: "para criar um orçamento" },
  },
  {
    id: "os",
    icon: Wrench,
    label: "Ordens de Serviço",
    path: "dashboard/ordens-servico",
    tag: "Controle operacional",
    title: "Controle total das suas OS",
    desc: "Crie, acompanhe e finalize ordens de serviço com status visual. Filtre por pendente, em andamento ou concluída e nunca perca uma OS.",
    features: [
      "Status colorido por situação",
      "Filtros rápidos por etapa",
      "Vínculo com clientes",
      "Data e valor de cada OS",
    ],
    screenshot: "/demo-os.png",
    stat: { value: "0", label: "OS esquecidas" },
  },
  {
    id: "financeiro",
    icon: DollarSign,
    label: "Financeiro",
    path: "dashboard/financeiro",
    tag: "Controle financeiro",
    title: "Saiba exatamente onde está o dinheiro",
    desc: "Registre receitas e despesas, acompanhe o saldo e visualize a evolução mensal com gráficos comparativos claros e intuitivos.",
    features: [
      "Resumo de receitas e despesas",
      "Saldo atualizado em tempo real",
      "Categorias de lançamento",
      "Gráfico de evolução mensal",
    ],
    screenshot: "/demo-financeiro.png",
    stat: { value: "R$", label: "sob controle total" },
  },
]

const socialProof = [
  { name: "Carlos M.", role: "Técnico de informática", text: "Antes eu usava planilha. Agora tenho tudo organizado e meu cliente recebe orçamento profissional na hora." },
  { name: "Ana R.", role: "Agência web", text: "O financeiro me deu clareza total de onde estava o dinheiro. Indispensável para crescer." },
  { name: "Pedro S.", role: "Freelancer", text: "O tour interativo me convenceu em 5 minutos. Comecei pelo plano Start e renovei no mesmo dia." },
]

function ThemeToggleButton({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "size-8 rounded-full flex items-center justify-center transition-all duration-200 border",
        isDark
          ? "border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10"
          : "border-black/10 bg-black/5 text-black/40 hover:text-black/70 hover:bg-black/8"
      )}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
    >
      {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  )
}

function PlanModal({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const bg = isDark ? "#111111" : "#ffffff"
  const fg = isDark ? "#f2f2f2" : "#0a0a0a"
  const fgMuted = isDark ? "rgba(242,242,242,0.45)" : "rgba(10,10,10,0.45)"
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-6 border"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
            >
              <Zap className="size-4" style={{ color: fg }} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: fg }}>Escolher um plano</p>
              <p className="text-xs leading-tight" style={{ color: fgMuted }}>Ativação rápida via Pix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-md flex items-center justify-center transition-colors"
            style={{ color: fgMuted }}
          >
            <ArrowRight className="size-4 rotate-180" />
          </button>
        </div>

        <p className="text-sm leading-relaxed mb-5" style={{ color: fgMuted }}>
          Para assinar um plano você precisa ter uma conta no Elevanthe CRM.
          Crie sua conta gratuitamente e, após o login, escolha o plano desejado.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            href={SIGNUP_URL}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold hover:opacity-85 transition-opacity"
            style={{ backgroundColor: fg, color: isDark ? "#0a0a0a" : "#f2f2f2" }}
          >
            Criar conta e escolher plano
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={SIGNIN_URL}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full border text-sm font-medium hover:opacity-70 transition-all"
            style={{ borderColor: border, color: fgMuted }}
          >
            Já tenho conta — fazer login
          </Link>
          <a
            href={PLANOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-xs mt-1 hover:underline transition-colors"
            style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
          >
            Ver planos e preços primeiro
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DemoPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(0)
  const [showPlanModal, setShowPlanModal] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = !mounted || resolvedTheme === "dark"
  const mod = modules[active]

  const bg = isDark ? "#080808" : "#f8f8f8"
  const fg = isDark ? "#f2f2f2" : "#0a0a0a"
  const fgMuted = isDark ? "rgba(242,242,242,0.45)" : "rgba(10,10,10,0.45)"
  const cardBg = isDark ? "#111111" : "#ffffff"
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
  const cardDark = isDark ? "#f2f2f2" : "#0a0a0a"
  const cardDarkFg = isDark ? "#0a0a0a" : "#f2f2f2"

  const prev = () => setActive((a) => (a === 0 ? modules.length - 1 : a - 1))
  const next = () => setActive((a) => (a === modules.length - 1 ? 0 : a + 1))

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: fg }}>
      {/* Grid pattern — light: linhas cinza / dark: linhas escuras */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
            : "linear-gradient(rgba(0,0,0,0.065) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.065) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} isDark={isDark} />}

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? "rgba(8,8,8,0.88)" : "rgba(248,248,248,0.88)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
        }}
      >
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/elevanthe-icon.png" alt="Elevanthe CRM" width={26} height={26} className="object-contain" />
            <span
              className="font-black text-sm tracking-tight"
              style={{ color: fg, fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
            >
              Elevanthe CRM
            </span>
            <span
              className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                borderColor: cardBorder,
                color: fgMuted,
              }}
            >
              Demo
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            {mounted && (
              <ThemeToggleButton
                isDark={isDark}
                onToggle={() => setTheme(isDark ? "light" : "dark")}
              />
            )}
            <Link
              href={SIGNIN_URL}
              className="hidden sm:flex text-xs font-medium px-3 py-1.5 transition-colors"
              style={{ color: fgMuted }}
            >
              Entrar
            </Link>
            <Link
              href="/planos/publico"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold tracking-wide uppercase hover:opacity-85 transition-opacity"
              style={{ backgroundColor: cardDark, color: cardDarkFg }}
            >
              Ver planos
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-20 pb-12 px-5 text-center overflow-hidden">
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            color: fgMuted,
          }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tour interativo — sistema real ao vivo
        </motion.div>

        <motion.h1
          className="font-black leading-[1.02] tracking-tighter text-balance mb-5"
          style={{
            fontSize: "clamp(2.8rem,7vw,5.5rem)",
            color: fg,
            fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
          }}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Explore o CRM sem<br className="hidden sm:block" /> criar conta.
        </motion.h1>

        <motion.p
          className="text-sm md:text-base max-w-md mx-auto leading-relaxed mb-8"
          style={{ color: fgMuted }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
        >
          Navegue pelos módulos abaixo e veja capturas reais do sistema funcionando.
        </motion.p>

        {/* Stats */}
        <motion.div
          className="flex items-center justify-center gap-8 md:gap-12 flex-wrap mb-2"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
        >
          {[
            { v: "R$ 7", l: "para começar" },
            { v: "5 min", l: "para configurar" },
            { v: "100%", l: "web, sem instalar" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p
                className="text-2xl font-black tracking-tight"
                style={{
                  color: fg,
                  fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                }}
              >
                {s.v}
              </p>
              <p className="text-[11px]" style={{ color: fgMuted }}>{s.l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── PLAYER DE VÍDEO ── */}
      <section className="relative z-10 px-5 pb-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="rounded-2xl overflow-hidden border shadow-2xl"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              {/* Chrome do player */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  borderColor: cardBorder,
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-400/40" />
                    <span className="size-2.5 rounded-full bg-yellow-400/40" />
                    <span className="size-2.5 rounded-full bg-green-400/40" />
                  </div>
                  <span
                    className="text-[11px] font-semibold ml-2"
                    style={{ color: fgMuted }}
                  >
                    Apresentação completa da plataforma
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: cardBorder,
                    color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)",
                  }}
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ao vivo
                </div>
              </div>

              {/* Área do vídeo — placeholder centralizado, substituir src quando vídeo estiver pronto */}
              <div
                className="relative w-full flex items-center justify-center"
                style={{ aspectRatio: "16/9", backgroundColor: isDark ? "#0a0a0a" : "#e8e8e8" }}
              >
                <div
                  className="flex flex-col items-center justify-center gap-4"
                  style={{ color: fgMuted }}
                >
                  <div
                    className="size-16 rounded-2xl flex items-center justify-center border"
                    style={{
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                      borderColor: cardBorder,
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <polygon points="5 3 19 12 5 21 5 3" fill={isDark ? "rgba(242,242,242,0.4)" : "rgba(10,10,10,0.3)"} />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold" style={{ color: isDark ? "rgba(242,242,242,0.5)" : "rgba(10,10,10,0.45)" }}>
                      Vídeo em breve
                    </p>
                    <p className="text-xs mt-1" style={{ color: isDark ? "rgba(242,242,242,0.25)" : "rgba(10,10,10,0.25)" }}>
                      Tour completo da plataforma — em produção
                    </p>
                  </div>
                </div>
                {/* Quando tiver o vídeo, descomente abaixo e remova o placeholder acima:
                <video className="absolute inset-0 w-full h-full object-cover" controls playsInline preload="metadata">
                  <source src="/demo-video.mp4" type="video/mp4" />
                </video>
                */}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TOUR INTERATIVO ── */}
      <section className="relative z-10 px-5 pt-20 pb-24">
        <div className="max-w-6xl mx-auto">

          {/* Tabs dos módulos — acima do conteúdo */}
          <motion.div
            className="flex flex-wrap gap-2 justify-center mb-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
          >
            {modules.map((m, i) => {
              const MIcon = m.icon
              const isA = active === i
              return (
                <button
                  key={m.id}
                  onClick={() => setActive(i)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-200"
                  style={{
                    backgroundColor: isA ? cardDark : "transparent",
                    color: isA ? cardDarkFg : fgMuted,
                    border: `1px solid ${isA ? cardDark : cardBorder}`,
                  }}
                >
                  <MIcon className="size-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              )
            })}
          </motion.div>

          {/* Layout info + screenshot */}
          <div className="grid lg:grid-cols-5 gap-10 items-start">

            {/* INFO */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`info-${active}`}
                  initial={{ opacity: 0, x: -16, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 16, filter: "blur(4px)" }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5"
                >
                  {/* Icone + tag */}
                  <div className="flex items-center gap-3">
                    <div
                      className="size-11 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderColor: cardBorder }}
                    >
                      <mod.icon className="size-5" style={{ color: fgMuted }} />
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
                    >
                      {mod.tag}
                    </span>
                  </div>

                  <div>
                    <h2
                      className="text-2xl font-black leading-tight tracking-tighter"
                      style={{
                        color: fg,
                        fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                      }}
                    >
                      {mod.title}
                    </h2>
                    <p className="text-sm mt-2.5 leading-relaxed" style={{ color: fgMuted }}>
                      {mod.desc}
                    </p>
                  </div>

                  {/* Stat destaque */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl border"
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderColor: cardBorder }}
                  >
                    <div
                      className="text-2xl font-black tracking-tight"
                      style={{
                        color: fg,
                        fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
                      }}
                    >
                      {mod.stat.value}
                    </div>
                    <div className="text-xs" style={{ color: fgMuted }}>{mod.stat.label}</div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {mod.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <div
                          className="mt-0.5 size-4 rounded-full border flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: cardBorder,
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          }}
                        >
                          <Check className="size-2.5" style={{ color: fg }} />
                        </div>
                        <span className="text-sm" style={{ color: fgMuted }}>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTAs */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPlanModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase hover:opacity-85 transition-opacity"
                      style={{ backgroundColor: cardDark, color: cardDarkFg }}
                    >
                      <Zap className="size-3" />
                      Assinar agora
                    </button>
                    <Link
                      href={SIGNUP_URL}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-[11px] font-bold tracking-wide uppercase hover:opacity-70 transition-all"
                      style={{ borderColor: cardBorder, color: fgMuted }}
                    >
                      Criar conta
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* SCREENSHOT */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`ss-${active}`}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.99 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    className="rounded-2xl overflow-hidden border shadow-2xl"
                    style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  >
                    {/* Chrome do browser */}
                    <div
                      className="flex items-center gap-2 px-4 py-3 border-b"
                      style={{
                        backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                        borderColor: cardBorder,
                      }}
                    >
                      <div className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-red-400/40" />
                        <span className="size-2.5 rounded-full bg-yellow-400/40" />
                        <span className="size-2.5 rounded-full bg-green-400/40" />
                      </div>
                      <div className="flex-1 mx-3">
                        <div
                          className="h-6 max-w-xs mx-auto rounded-md flex items-center justify-center px-3 border"
                          style={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                            borderColor: cardBorder,
                          }}
                        >
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: isDark ? "rgba(242,242,242,0.2)" : "rgba(10,10,10,0.25)" }}
                          >
                            crm.elevanthe.com/{mod.path}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative aspect-[16/10]" style={{ backgroundColor: isDark ? "#0a0a0a" : "#f0f0f0" }}>
                      <Image
                        src={mod.screenshot}
                        alt={mod.title}
                        fill
                        className="object-cover object-top"
                        priority
                      />
                    </div>
                  </div>

                  {/* Navegação */}
                  <div className="mt-4 flex items-center justify-between px-1">
                    <button
                      onClick={prev}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                      style={{ color: fgMuted }}
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <div className="flex gap-1.5 items-center">
                      {modules.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActive(i)}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: active === i ? "20px" : "6px",
                            height: "6px",
                            background: active === i ? fg : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"),
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={next}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                      style={{ color: fgMuted }}
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section
        className="relative z-10 px-5 py-20 border-t"
        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)" }}
      >
        <div className="max-w-4xl mx-auto">
          <p
            className="text-center text-[11px] font-bold uppercase tracking-widest mb-10"
            style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
          >
            O que dizem os usuários
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {socialProof.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border p-5 space-y-3"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <p className="text-sm leading-relaxed" style={{ color: fgMuted }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-bold" style={{ color: fg }}>{t.name}</p>
                  <p className="text-xs" style={{ color: fgMuted }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        className="relative z-10 py-24 px-5 border-t"
        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: isDark ? "rgba(242,242,242,0.3)" : "rgba(10,10,10,0.3)" }}
            >
              Comece hoje mesmo
            </p>
            <h2
              className="font-black tracking-tighter leading-tight text-balance mb-5"
              style={{
                fontSize: "clamp(2rem,5vw,3.5rem)",
                color: fg,
                fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
              }}
            >
              Pronto para organizar<br className="hidden sm:block" /> seu negócio?
            </h2>
            <p
              className="text-sm leading-relaxed mb-8 max-w-sm mx-auto"
              style={{ color: fgMuted }}
            >
              Comece por R$&nbsp;7 e tenha acesso completo por 7 dias. Sem compromisso, sem mensalidade automática.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/planos/publico"
                className="flex items-center gap-2 px-7 py-3.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:opacity-85 transition-opacity"
                style={{ backgroundColor: cardDark, color: cardDarkFg }}
              >
                Ver planos e preços
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={SIGNUP_URL}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full border text-[11px] font-bold tracking-widest uppercase hover:opacity-70 transition-all"
                style={{ borderColor: cardBorder, color: fgMuted }}
              >
                Criar conta grátis
              </Link>
            </div>
            <p
              className="mt-5 text-xs"
              style={{ color: isDark ? "rgba(242,242,242,0.25)" : "rgba(10,10,10,0.3)" }}
            >
              Pagamento via Pix · Ativação instantânea
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

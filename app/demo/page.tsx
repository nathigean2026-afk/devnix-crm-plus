"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, UsersRound, Wrench, FileText, DollarSign,
  ArrowRight, Check, ChevronLeft, ChevronRight, Zap, Sun, Moon,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PLANOS_URL = "/planos/publico"
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
      "Meta de receita com barra de progresso",
      "Aniversariantes do dia com envio de parabéns",
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
    desc: "Cadastre e organize todos os seus clientes com informações completas. Busca rápida, filtros por status e histórico completo de orçamentos, OS e transações.",
    features: [
      "Cadastro completo com CPF/CNPJ e endereço",
      "Data de nascimento para parabéns automáticos",
      "Histórico de orçamentos, OS e transações",
      "Status ativo/inativo e filtros avançados",
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
    desc: "Gere orçamentos com itens, descontos, preço à vista e parcelado. O cliente aprova ou recusa pelo link público — sem precisar de cadastro.",
    features: [
      "Link público para aprovação pelo cliente",
      "Desconto em valor ou percentual",
      "Preço à vista e parcelado no cartão",
      "Notas internas visíveis só para sua equipe",
      "Pagamento via Pix com QR Code integrado",
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
    desc: "Crie, acompanhe e finalize ordens de serviço com status visual. Link público da OS e do recibo para compartilhar com o cliente sem login.",
    features: [
      "Status colorido: aberto, em andamento, concluído",
      "Link público da OS e do recibo",
      "Compartilhamento por WhatsApp, e-mail ou link",
      "PDF e impressão da OS e do recibo",
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
    desc: "Registre receitas e despesas, acompanhe o saldo e visualize a evolução mensal. Marque lançamentos como pagos com um clique.",
    features: [
      "Receitas e despesas por categoria",
      "Marcar como pago com um clique",
      "Saldo pendente atualizado em tempo real",
      "Gráfico de evolução mensal",
    ],
    screenshot: "/demo-financeiro.png",
    stat: { value: "R$", label: "sob controle total" },
  },
  {
    id: "relatorios",
    icon: BarChart3,
    label: "Relatórios",
    path: "dashboard/relatorios",
    tag: "Análise de desempenho",
    title: "Decisões baseadas em dados reais",
    desc: "Relatórios completos de faturamento, conversão de orçamentos, top clientes e serviços mais executados. Filtros por período e impressão completa.",
    features: [
      "Taxa de conversão de orçamentos",
      "Top clientes por receita gerada",
      "Serviços mais executados",
      "Orçamentos recusados com motivo",
    ],
    screenshot: "/demo-relatorios.png",
    stat: { value: "360°", label: "visão do desempenho" },
  },
]

const socialProof = [
  { name: "Carlos M.", role: "Técnico de informática", text: "Antes eu usava planilha. Agora tenho tudo organizado e meu cliente recebe orçamento profissional na hora." },
  { name: "Ana R.", role: "Agência web", text: "O financeiro me deu clareza total de onde estava o dinheiro. Indispensável para crescer." },
  { name: "Pedro S.", role: "Freelancer", text: "O tour interativo me convenceu em 5 minutos. Comecei pelo plano Start e renovei no mesmo dia." },
]

// Botão de tema — renderizado apenas no cliente para evitar hydration mismatch
function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="size-8" />
  const isDark = resolvedTheme === "dark"
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
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

// Modal de planos — cliente-only, sem hydration issue
function PlanModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-6 border bg-white dark:bg-[#111111] border-black/[0.08] dark:border-white/[0.08]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/[0.06]">
              <Zap className="size-4 text-[#0a0a0a] dark:text-[#f2f2f2]" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-[#0a0a0a] dark:text-[#f2f2f2]">Escolher um plano</p>
              <p className="text-xs leading-tight text-black/45 dark:text-white/40">Ativação rápida via Pix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-md flex items-center justify-center transition-colors text-black/40 dark:text-white/40"
          >
            <ArrowRight className="size-4 rotate-180" />
          </button>
        </div>

        <p className="text-sm leading-relaxed mb-5 text-black/45 dark:text-white/40">
          Para assinar um plano você precisa ter uma conta no Elevanthe CRM.
          Crie sua conta gratuitamente e, após o login, escolha o plano desejado.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            href={SIGNUP_URL}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold hover:opacity-85 transition-opacity bg-[#0a0a0a] text-[#f2f2f2] dark:bg-[#f2f2f2] dark:text-[#0a0a0a]"
          >
            Criar conta e escolher plano
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={SIGNIN_URL}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full border text-sm font-medium hover:opacity-70 transition-all border-black/[0.08] dark:border-white/[0.08] text-black/45 dark:text-white/40"
          >
            Já tenho conta — fazer login
          </Link>
          <a
            href={PLANOS_URL}
            className="text-center text-xs mt-1 hover:underline transition-colors text-black/30 dark:text-white/30"
          >
            Ver planos e preços primeiro
          </a>
        </div>
      </div>
    </div>
  )
}

export default function DemoPage() {
  const { setTheme } = useTheme()
  const [active, setActive] = useState(0)
  const [showPlanModal, setShowPlanModal] = useState(false)

  const mod = modules[active]
  const prev = () => setActive((a) => (a === 0 ? modules.length - 1 : a - 1))
  const next = () => setActive((a) => (a === modules.length - 1 ? 0 : a + 1))

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#080808] text-[#0a0a0a] dark:text-[#f2f2f2]">

      {/* Grid pattern — CSS puro, sem isDark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0 hidden dark:block"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} />}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl bg-[#f8f8f8]/88 dark:bg-[#080808]/88 border-black/[0.07] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/elevanthe-icon.png" alt="Elevanthe CRM" width={26} height={26} className="object-contain" />
            <span className="font-black text-sm tracking-tight text-[#0a0a0a] dark:text-[#f2f2f2]">
              Elevanthe CRM
            </span>
            <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full border bg-black/5 dark:bg-white/[0.06] border-black/[0.08] dark:border-white/[0.08] text-black/45 dark:text-white/40">
              Demo
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <ThemeToggleButton />
            <Link
              href={SIGNIN_URL}
              className="hidden sm:flex text-xs font-medium px-3 py-1.5 transition-colors text-black/45 dark:text-white/40"
            >
              Entrar
            </Link>
            <Link
              href={PLANOS_URL}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold tracking-wide uppercase hover:opacity-85 transition-opacity bg-[#0a0a0a] text-[#f2f2f2] dark:bg-[#f2f2f2] dark:text-[#0a0a0a]"
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
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-6 border-black/10 dark:border-white/10 text-black/45 dark:text-white/40"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tour interativo — sistema real ao vivo
        </motion.div>

        <motion.h1
          className="font-black leading-[1.02] tracking-tighter text-balance mb-5 text-[#0a0a0a] dark:text-[#f2f2f2]"
          style={{
            fontSize: "clamp(2.8rem,7vw,5.5rem)",
            fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
          }}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Explore o CRM sem<br className="hidden sm:block" /> criar conta.
        </motion.h1>

        <motion.p
          className="text-sm md:text-base max-w-md mx-auto leading-relaxed mb-8 text-black/45 dark:text-white/40"
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
                className="text-2xl font-black tracking-tight text-[#0a0a0a] dark:text-[#f2f2f2]"
                style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
              >
                {s.v}
              </p>
              <p className="text-[11px] text-black/45 dark:text-white/40">{s.l}</p>
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
            <div className="rounded-2xl overflow-hidden border shadow-2xl bg-white dark:bg-[#111111] border-black/[0.08] dark:border-white/[0.08]">
              {/* Chrome do player */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-400/40" />
                    <span className="size-2.5 rounded-full bg-yellow-400/40" />
                    <span className="size-2.5 rounded-full bg-green-400/40" />
                  </div>
                  <span className="text-[11px] font-semibold ml-2 text-black/45 dark:text-white/40">
                    Apresentação completa da plataforma
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border border-black/[0.08] dark:border-white/[0.08] text-black/30 dark:text-white/30">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ao vivo
                </div>
              </div>

              {/* Área do vídeo — placeholder, substituir src quando o vídeo estiver pronto */}
              <div className="relative w-full flex items-center justify-center aspect-video bg-[#e8e8e8] dark:bg-[#0a0a0a]">
                <div className="flex flex-col items-center justify-center gap-4 text-black/40 dark:text-white/35">
                  <div className="size-16 rounded-2xl flex items-center justify-center border bg-black/5 dark:bg-white/5 border-black/[0.08] dark:border-white/[0.08]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <polygon points="5 3 19 12 5 21 5 3" className="fill-black/30 dark:fill-white/40" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-black/50 dark:text-white/45">Vídeo em breve</p>
                    <p className="text-xs mt-1 text-black/25 dark:text-white/25">Tour completo da plataforma — em produção</p>
                  </div>
                </div>
                {/* Quando o vídeo estiver pronto, descomente:
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

          {/* Tabs dos módulos */}
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
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-wide uppercase transition-all duration-200 border",
                    isA
                      ? "bg-[#0a0a0a] text-[#f2f2f2] border-[#0a0a0a] dark:bg-[#f2f2f2] dark:text-[#0a0a0a] dark:border-[#f2f2f2]"
                      : "bg-transparent text-black/45 dark:text-white/40 border-black/[0.08] dark:border-white/[0.08]"
                  )}
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
                    <div className="size-11 rounded-xl flex items-center justify-center border bg-black/[0.04] dark:bg-white/5 border-black/[0.08] dark:border-white/[0.08]">
                      <mod.icon className="size-5 text-black/45 dark:text-white/40" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">
                      {mod.tag}
                    </span>
                  </div>

                  <div>
                    <h2
                      className="text-2xl font-black leading-tight tracking-tighter text-[#0a0a0a] dark:text-[#f2f2f2]"
                      style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
                    >
                      {mod.title}
                    </h2>
                    <p className="text-sm mt-2.5 leading-relaxed text-black/45 dark:text-white/40">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Stat destaque */}
                  <div className="flex items-center gap-3 p-4 rounded-xl border bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08]">
                    <div
                      className="text-2xl font-black tracking-tight text-[#0a0a0a] dark:text-[#f2f2f2]"
                      style={{ fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)" }}
                    >
                      {mod.stat.value}
                    </div>
                    <div className="text-xs text-black/45 dark:text-white/40">{mod.stat.label}</div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {mod.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <div className="mt-0.5 size-4 rounded-full border flex items-center justify-center flex-shrink-0 bg-black/[0.04] dark:bg-white/5 border-black/[0.08] dark:border-white/[0.08]">
                          <Check className="size-2.5 text-[#0a0a0a] dark:text-[#f2f2f2]" />
                        </div>
                        <span className="text-sm text-black/45 dark:text-white/40">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTAs */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPlanModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wide uppercase hover:opacity-85 transition-opacity bg-[#0a0a0a] text-[#f2f2f2] dark:bg-[#f2f2f2] dark:text-[#0a0a0a]"
                    >
                      <Zap className="size-3" />
                      Assinar agora
                    </button>
                    <Link
                      href={SIGNUP_URL}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-[11px] font-bold tracking-wide uppercase hover:opacity-70 transition-all border-black/[0.08] dark:border-white/[0.08] text-black/45 dark:text-white/40"
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
                  <div className="rounded-2xl overflow-hidden border shadow-2xl bg-white dark:bg-[#111111] border-black/[0.08] dark:border-white/[0.08]">
                    {/* Chrome do browser */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.08] dark:border-white/[0.08]">
                      <div className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-red-400/40" />
                        <span className="size-2.5 rounded-full bg-yellow-400/40" />
                        <span className="size-2.5 rounded-full bg-green-400/40" />
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="h-6 max-w-xs mx-auto rounded-md flex items-center justify-center px-3 border bg-black/[0.03] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.08]">
                          <span className="text-[10px] font-mono text-black/20 dark:text-white/20">
                            crm.elevanthe.com/{mod.path}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative aspect-[16/10] bg-[#f0f0f0] dark:bg-[#0a0a0a]">
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
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors text-black/45 dark:text-white/40"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <div className="flex gap-1.5 items-center">
                      {modules.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActive(i)}
                          className={cn(
                            "rounded-full transition-all duration-300 h-[6px]",
                            active === i
                              ? "w-5 bg-[#0a0a0a] dark:bg-[#f2f2f2]"
                              : "w-[6px] bg-black/15 dark:bg-white/15"
                          )}
                        />
                      ))}
                    </div>
                    <button
                      onClick={next}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors text-black/45 dark:text-white/40"
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
      <section className="relative z-10 px-5 py-20 border-t border-black/[0.07] dark:border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest mb-10 text-black/30 dark:text-white/30">
            O que dizem os usuários
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {socialProof.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border p-5 space-y-3 bg-white dark:bg-[#111111] border-black/[0.08] dark:border-white/[0.08]"
              >
                <p className="text-sm leading-relaxed text-black/45 dark:text-white/40">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-bold text-[#0a0a0a] dark:text-[#f2f2f2]">{t.name}</p>
                  <p className="text-xs text-black/45 dark:text-white/40">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative z-10 py-24 px-5 border-t border-black/[0.07] dark:border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4 text-black/30 dark:text-white/30">
              Comece hoje mesmo
            </p>
            <h2
              className="font-black tracking-tighter leading-tight text-balance mb-5 text-[#0a0a0a] dark:text-[#f2f2f2]"
              style={{
                fontSize: "clamp(2rem,5vw,3.5rem)",
                fontFamily: "var(--font-inter, var(--font-geist-sans), sans-serif)",
              }}
            >
              Pronto para organizar<br className="hidden sm:block" /> seu negócio?
            </h2>
            <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto text-black/45 dark:text-white/40">
              Comece por R$&nbsp;7 e tenha acesso completo por 7 dias. Sem compromisso, sem mensalidade automática.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={PLANOS_URL}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:opacity-85 transition-opacity bg-[#0a0a0a] text-[#f2f2f2] dark:bg-[#f2f2f2] dark:text-[#0a0a0a]"
              >
                Ver planos e preços
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={SIGNUP_URL}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full border text-[11px] font-bold tracking-widest uppercase hover:opacity-70 transition-all border-black/[0.08] dark:border-white/[0.08] text-black/45 dark:text-white/40"
              >
                Criar conta grátis
              </Link>
            </div>
            <p className="mt-5 text-xs text-black/25 dark:text-white/25">
              Pagamento via Pix · Ativação instantânea
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Users, Wrench, FileText, DollarSign,
  ArrowRight, Check, ChevronLeft, ChevronRight,
} from "lucide-react"

const PLANOS_URL = "/planos"
const SIGNUP_URL = "/sign-up"

const modules = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "dashboard",
    title: "Visao geral completa",
    subtitle: "Tudo que importa em uma tela",
    desc: "Acompanhe em tempo real os numeros mais importantes do seu negocio. Receita, clientes ativos, orcamentos e ordens de servico resumidos em um painel limpo e intuitivo.",
    features: [
      "Cards de metricas em tempo real",
      "Grafico de receita x despesa",
      "Clientes e orcamentos recentes",
      "Acesso rapido a todos os modulos",
    ],
    screenshot: "/demo-dashboard.png",
  },
  {
    id: "clientes",
    icon: Users,
    label: "Clientes",
    path: "dashboard/clientes",
    title: "Gestao de clientes",
    subtitle: "Sua base organizada e acessivel",
    desc: "Cadastre e organize todos os seus clientes com informacoes completas. Busca rapida, filtros por status e historico de interacoes para nunca perder um contato.",
    features: [
      "Busca e filtros avancados",
      "Cadastro completo com contatos",
      "Status ativo/inativo",
      "Historico de servicos por cliente",
    ],
    screenshot: "/demo-clientes.png",
  },
  {
    id: "orcamentos",
    icon: FileText,
    label: "Orcamentos",
    path: "dashboard/orcamentos",
    title: "Orcamentos profissionais",
    subtitle: "Crie e envie em minutos",
    desc: "Gere orcamentos detalhados com itens, quantidades e valores. Controle o status de cada proposta e saiba quais foram aprovadas, enviadas ou rejeitadas.",
    features: [
      "Criacao rapida de propostas",
      "Itens e valores detalhados",
      "Status de aprovacao",
      "Historico completo",
    ],
    screenshot: "/demo-orcamentos.png",
  },
  {
    id: "os",
    icon: Wrench,
    label: "Ordens de Servico",
    path: "dashboard/ordens-servico",
    title: "Ordens de Servico",
    subtitle: "Controle total do que esta em aberto",
    desc: "Crie, acompanhe e finalize ordens de servico com status visual. Filtre por pendente, em andamento ou concluida e nunca perca uma OS esquecida.",
    features: [
      "Status colorido (pendente/andamento/concluida)",
      "Filtros rapidos por situacao",
      "Vinculo com clientes",
      "Data e valor de cada OS",
    ],
    screenshot: "/demo-os.png",
  },
  {
    id: "financeiro",
    icon: DollarSign,
    label: "Financeiro",
    path: "dashboard/financeiro",
    title: "Controle financeiro",
    subtitle: "Saiba exatamente onde esta o dinheiro",
    desc: "Registre receitas e despesas, acompanhe o saldo e visualize a evolucao mensal do seu negocio com graficos comparativos claros e intuitivos.",
    features: [
      "Resumo de receitas e despesas",
      "Saldo atualizado em tempo real",
      "Categorias de lancamento",
      "Grafico de evolucao mensal",
    ],
    screenshot: "/demo-financeiro.png",
  },
]

export default function DemoPage() {
  const [active, setActive] = useState(0)

  const prev = () => setActive((a) => (a === 0 ? modules.length - 1 : a - 1))
  const next = () => setActive((a) => (a === modules.length - 1 ? 0 : a + 1))

  const mod = modules[active]
  const Icon = mod.icon

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: "var(--border)", background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="https://v0-devnix.vercel.app/crm-plus" className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg flex items-center justify-center border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <LayoutDashboard className="size-3.5" style={{ color: "var(--muted-foreground)" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Devnix CRM Plus</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full border" style={{ color: "var(--muted-foreground)", borderColor: "var(--border)", background: "var(--secondary)" }}>Tour interativo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={SIGNUP_URL}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase transition-colors"
              style={{ color: "var(--muted-foreground)" }}>
              Criar conta
            </Link>
            <Link href={PLANOS_URL}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-200 hover:opacity-80"
              style={{ background: "var(--foreground)", color: "var(--background)" }}>
              Ver planos
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-16 pb-12 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.03), transparent)" }} />
        <motion.div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-5"
          style={{ borderColor: "var(--border)", background: "var(--secondary)", color: "var(--muted-foreground)" }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
          Demonstracao real — sistema ao vivo
        </motion.div>
        <motion.h1 className="text-[clamp(36px,7vw,72px)] font-black leading-none mb-4 tracking-tight"
          style={{ color: "var(--foreground)" }}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
          Explore o CRM
        </motion.h1>
        <motion.p className="text-sm max-w-lg mx-auto leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
          Navegue pelos modulos abaixo e veja o sistema real funcionando.
          Prints capturados diretamente da plataforma.
        </motion.p>
      </section>

      {/* ── TOUR INTERATIVO ── */}
      <section className="px-5 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Tabs */}
          <motion.div className="flex flex-wrap gap-2 justify-center mb-10"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            {modules.map((m, i) => {
              const MIcon = m.icon
              const isActive = active === i
              return (
                <button key={m.id} onClick={() => setActive(i)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-200"
                  style={isActive
                    ? { background: "var(--foreground)", color: "var(--background)" }
                    : { border: "1px solid var(--border)", color: "var(--muted-foreground)", background: "var(--secondary)" }}>
                  <MIcon className="size-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              )
            })}
          </motion.div>

          {/* Layout: info + screenshot */}
          <div className="grid lg:grid-cols-5 gap-8 items-start">

            {/* INFO — esquerda */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div key={active}
                  initial={{ opacity: 0, x: -20, filter: "blur(6px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 20, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-5">
                  <div className="size-12 rounded-2xl border flex items-center justify-center"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <Icon className="size-5" style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--muted-foreground)" }}>
                      {mod.subtitle}
                    </p>
                    <h2 className="text-2xl font-black leading-tight" style={{ color: "var(--foreground)" }}>
                      {mod.title}
                    </h2>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {mod.desc}
                  </p>
                  <ul className="space-y-3">
                    {mod.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <div className="mt-0.5 size-4 rounded-full border flex items-center justify-center flex-shrink-0"
                          style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                          <Check className="size-2.5" style={{ color: "var(--foreground)" }} />
                        </div>
                        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 flex gap-2">
                    <Link href={PLANOS_URL}
                      className="flex items-center gap-2 px-5 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-200 hover:opacity-80"
                      style={{ background: "var(--foreground)", color: "var(--background)" }}>
                      Assinar agora
                      <ArrowRight className="size-3" />
                    </Link>
                    <Link href={SIGNUP_URL}
                      className="flex items-center gap-2 px-5 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase border transition-all duration-200 hover:opacity-70"
                      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                      Criar conta
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* SCREENSHOT — direita */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div key={active}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                  <div className="rounded-2xl overflow-hidden border shadow-2xl"
                    style={{ borderColor: "var(--border)", background: "var(--card)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                      <div className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-red-500/50" />
                        <span className="size-2.5 rounded-full bg-yellow-500/50" />
                        <span className="size-2.5 rounded-full bg-green-500/50" />
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="h-6 max-w-sm mx-auto rounded-md flex items-center justify-center px-3 border" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
                          <span className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                            v0-crm-devnix.vercel.app/{mod.path}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Screenshot */}
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={mod.screenshot}
                        alt={mod.title}
                        fill
                        className="object-cover object-top"
                        priority
                      />
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="mt-4 flex items-center justify-between px-1">
                    <button onClick={prev}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:opacity-60"
                      style={{ color: "var(--muted-foreground)" }}>
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <div className="flex gap-1.5">
                      {modules.map((_, i) => (
                        <button key={i} onClick={() => setActive(i)}
                          className="rounded-full transition-all duration-200"
                          style={{
                            width: active === i ? "20px" : "6px",
                            height: "6px",
                            background: active === i ? "var(--foreground)" : "var(--border)",
                          }} />
                      ))}
                    </div>
                    <button onClick={next}
                      className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:opacity-60"
                      style={{ color: "var(--muted-foreground)" }}>
                      <span className="hidden sm:inline">Proximo</span>
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 px-5 border-t mt-0" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 className="text-[clamp(28px,5vw,52px)] font-black leading-tight mb-4"
            style={{ color: "var(--foreground)" }}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }} viewport={{ once: true }}>
            Pronto para comecar?
          </motion.h2>
          <motion.p className="text-sm leading-relaxed mb-8 max-w-md mx-auto"
            style={{ color: "var(--muted-foreground)" }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }} viewport={{ once: true }}>
            Comece agora por R$ 7 e tenha acesso completo por 7 dias.
            Sem compromisso, sem mensalidade automatica.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }} viewport={{ once: true }}>
            <Link href={PLANOS_URL}
              className="flex items-center gap-2 px-7 py-4 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all duration-200 hover:opacity-80"
              style={{ background: "var(--foreground)", color: "var(--background)" }}>
              Ver planos e precos
              <ArrowRight className="size-3.5" />
            </Link>
            <Link href={SIGNUP_URL}
              className="flex items-center gap-2 px-7 py-4 rounded-full text-[11px] font-bold tracking-widest uppercase border transition-all duration-200 hover:opacity-70"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              Criar conta gratis
            </Link>
          </motion.div>
          <p className="mt-6 text-xs" style={{ color: "var(--muted-foreground)" }}>
            Pagamento seguro via Cartao ou Pix · Ativacao instantanea
          </p>
        </div>
      </section>
    </div>
  )
}

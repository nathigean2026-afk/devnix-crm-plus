"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Users, Wrench, FileText, DollarSign,
  ArrowRight, Check, ChevronLeft, ChevronRight, Zap,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const PLANOS_URL = "/planos"
const SIGNUP_URL = "/sign-up"
const SIGNIN_URL = "/sign-in"

const modules = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "dashboard",
    tag: "Visao geral",
    title: "Tudo que importa, em uma tela",
    desc: "Acompanhe em tempo real os numeros mais importantes do seu negocio. Receita, clientes ativos, orcamentos e ordens de servico resumidos num painel limpo.",
    features: [
      "Metricas financeiras em tempo real",
      "Grafico de receita vs despesa",
      "Clientes e orcamentos recentes",
      "Acesso rapido a todos os modulos",
    ],
    screenshot: "/demo-dashboard.png",
    stat: { value: "100%", label: "visibilidade do negocio" },
  },
  {
    id: "clientes",
    icon: Users,
    label: "Clientes",
    path: "dashboard/clientes",
    tag: "Gestao de clientes",
    title: "Sua base organizada e acessivel",
    desc: "Cadastre e organize todos os seus clientes com informacoes completas. Busca rapida, filtros por status e historico de interacoes.",
    features: [
      "Busca e filtros avancados",
      "Cadastro completo com contatos",
      "Status ativo / inativo",
      "Historico de servicos por cliente",
    ],
    screenshot: "/demo-clientes.png",
    stat: { value: "∞", label: "clientes cadastrados" },
  },
  {
    id: "orcamentos",
    icon: FileText,
    label: "Orcamentos",
    path: "dashboard/orcamentos",
    tag: "Propostas comerciais",
    title: "Orcamentos profissionais em minutos",
    desc: "Gere orcamentos detalhados com itens, quantidades e valores. Controle o status de cada proposta e saiba quais foram aprovadas.",
    features: [
      "Criacao rapida de propostas",
      "Itens e valores detalhados",
      "Status de aprovacao",
      "Historico completo",
    ],
    screenshot: "/demo-orcamentos.png",
    stat: { value: "3min", label: "para criar um orcamento" },
  },
  {
    id: "os",
    icon: Wrench,
    label: "Ordens de Servico",
    path: "dashboard/ordens-servico",
    tag: "Controle operacional",
    title: "Controle total das suas OS",
    desc: "Crie, acompanhe e finalize ordens de servico com status visual. Filtre por pendente, em andamento ou concluida e nunca perca uma OS.",
    features: [
      "Status colorido por situacao",
      "Filtros rapidos por etapa",
      "Vinculo com clientes",
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
    title: "Saiba exatamente onde esta o dinheiro",
    desc: "Registre receitas e despesas, acompanhe o saldo e visualize a evolucao mensal com graficos comparativos claros e intuitivos.",
    features: [
      "Resumo de receitas e despesas",
      "Saldo atualizado em tempo real",
      "Categorias de lancamento",
      "Grafico de evolucao mensal",
    ],
    screenshot: "/demo-financeiro.png",
    stat: { value: "R$", label: "sob controle total" },
  },
]

const socialProof = [
  { name: "Carlos M.", role: "Tecnico de informatica", text: "Antes eu usava planilha. Agora tenho tudo organizado e meu cliente recebe orcamento profissional na hora." },
  { name: "Ana R.", role: "Agencia web", text: "O financeiro me deu clareza total de onde estava o dinheiro. Indispensavel para crescer." },
  { name: "Pedro S.", role: "Freelancer", text: "O tour interativo me convenceu em 5 minutos. Comecei pelo plano Start e renovei no mesmo dia." },
]

export default function DemoPage() {
  const [active, setActive] = useState(0)
  const mod = modules[active]

  const prev = () => setActive((a) => (a === 0 ? modules.length - 1 : a - 1))
  const next = () => setActive((a) => (a === modules.length - 1 ? 0 : a + 1))

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/elevanthe-logo.png"
              alt="Elevanthe CRM"
              width={140}
              height={40}
              className="object-contain dark:brightness-0 dark:invert"
            />
            <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Demo
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href={SIGNIN_URL}
              className="hidden sm:flex text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Entrar
            </Link>
            <Link
              href={PLANOS_URL}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-[11px] font-bold tracking-wide uppercase hover:opacity-85 transition-opacity"
            >
              Ver planos
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-16 pb-10 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, color-mix(in srgb, var(--primary) 6%, transparent), transparent)" }} />
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-xs font-semibold text-muted-foreground mb-5"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tour interativo — sistema real ao vivo
        </motion.div>

        <motion.h1
          className="text-[clamp(32px,6vw,64px)] font-black leading-[1.02] tracking-tight text-foreground mb-4 text-balance"
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Explore o CRM sem<br className="hidden sm:block" /> criar conta
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
        >
          Navegue pelos modulos abaixo e veja capturas reais do sistema funcionando.
        </motion.p>

        {/* Stats linha */}
        <motion.div
          className="flex items-center justify-center gap-6 md:gap-10 flex-wrap mb-4"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
        >
          {[
            { v: "R$ 7", l: "para comecar" },
            { v: "5 min", l: "para configurar" },
            { v: "100%", l: "web, sem instalar" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-xl font-black text-foreground">{s.v}</p>
              <p className="text-[11px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* TOUR INTERATIVO */}
      <section className="px-5 pb-20">
        <div className="max-w-6xl mx-auto">

          {/* Tabs dos modulos */}
          <motion.div
            className="flex flex-wrap gap-1.5 justify-center mb-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
          >
            {modules.map((m, i) => {
              const MIcon = m.icon
              const isA = active === i
              return (
                <button
                  key={m.id}
                  onClick={() => setActive(i)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition-all duration-200",
                    isA
                      ? "bg-foreground text-background shadow-sm"
                      : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <MIcon className="size-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              )
            })}
          </motion.div>

          {/* Layout info + screenshot */}
          <div className="grid lg:grid-cols-5 gap-8 items-start">

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
                    <div className="size-11 rounded-xl bg-muted border border-border flex items-center justify-center">
                      <mod.icon className="size-5 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {mod.tag}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight">
                      {mod.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Stat destaque */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/30">
                    <div className="text-2xl font-black text-primary">{mod.stat.value}</div>
                    <div className="text-xs text-muted-foreground">{mod.stat.label}</div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5">
                    {mod.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <div className="mt-0.5 size-4 rounded-full border border-border bg-muted flex items-center justify-center flex-shrink-0">
                          <Check className="size-2.5 text-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTAs */}
                  <div className="pt-2 flex gap-2">
                    <Link
                      href={PLANOS_URL}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-[11px] font-bold tracking-wide uppercase hover:opacity-85 transition-opacity"
                    >
                      <Zap className="size-3" />
                      Assinar agora
                    </Link>
                    <Link
                      href={SIGNUP_URL}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-muted-foreground text-[11px] font-bold tracking-wide uppercase hover:text-foreground hover:bg-muted/50 transition-all"
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
                  <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-2xl">
                    {/* Chrome do browser */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                      <div className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-red-400/50" />
                        <span className="size-2.5 rounded-full bg-yellow-400/50" />
                        <span className="size-2.5 rounded-full bg-green-400/50" />
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="h-6 max-w-xs mx-auto rounded-md flex items-center justify-center px-3 border border-border bg-muted/50">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            crm-devnix.vercel.app/{mod.path}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image
                        src={mod.screenshot}
                        alt={mod.title}
                        fill
                        className="object-cover object-top"
                        priority
                      />
                    </div>
                  </div>

                  {/* Navegacao */}
                  <div className="mt-4 flex items-center justify-between px-1">
                    <button
                      onClick={prev}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
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
                            background: active === i ? "var(--foreground)" : "var(--border)",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={next}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
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

      {/* SOCIAL PROOF */}
      <section className="px-5 py-16 border-t border-border bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
            O que dizem os usuarios
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {socialProof.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-5 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Comece hoje mesmo
            </p>
            <h2 className="text-[clamp(28px,4vw,48px)] font-black tracking-tight text-foreground leading-tight mb-4 text-balance">
              Pronto para organizar seu negocio?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
              Comece por R$&nbsp;7 e tenha acesso completo por 7 dias. Sem compromisso, sem mensalidade automatica.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={PLANOS_URL}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-foreground text-background text-[11px] font-bold tracking-widest uppercase hover:opacity-85 transition-opacity shadow-lg"
              >
                Ver planos e precos
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={SIGNUP_URL}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border text-muted-foreground text-[11px] font-bold tracking-widest uppercase hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Criar conta gratis
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Pagamento via Pix ou cartao · Ativacao instantanea
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

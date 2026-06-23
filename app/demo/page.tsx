"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Users, Wrench, FileText, DollarSign, BarChart3,
  ArrowRight, Check, Sparkles, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const modules = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    title: "Visao geral do negocio",
    desc: "Metricas em tempo real: receita, clientes ativos, OS em aberto e graficos de evolucao mensal.",
    screenshot: "/demo-dashboard.png",
    features: ["Cards de metricas", "Graficos interativos", "Atividade recente"],
  },
  {
    id: "clientes",
    icon: Users,
    label: "Clientes",
    title: "Gestao completa de clientes",
    desc: "Cadastre, edite e organize todos os seus clientes com busca rapida e filtros por status.",
    screenshot: "/demo-clientes.png",
    features: ["Busca e filtros", "Cadastro rapido", "Historico de interacoes"],
  },
  {
    id: "os",
    icon: Wrench,
    label: "Ordens de Servico",
    title: "Controle de OS em aberto",
    desc: "Crie e acompanhe ordens de servico com status em tempo real. Filtre por pendente, em andamento ou concluida.",
    screenshot: "/demo-os.png",
    features: ["Status visual", "Filtros rapidos", "Link direto com clientes"],
  },
  {
    id: "financeiro",
    icon: DollarSign,
    label: "Financeiro",
    title: "Receitas, despesas e saldo",
    desc: "Acompanhe seu fluxo de caixa com graficos comparativos e historico de transacoes.",
    screenshot: "/demo-financeiro.png",
    features: ["Resumo de saldo", "Graficos mensais", "Categorias de lancamento"],
  },
]

export default function DemoPage() {
  const [activeModule, setActiveModule] = useState(0)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="size-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">Devnix CRM Plus</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">— Demonstracao</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/sign-up">
              Criar conta gratis
              <ArrowRight className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            Tour Interativo
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Veja como funciona
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explore cada modulo do CRM e veja como ele simplifica a gestao do seu negocio.
            Clique nas abas para navegar entre as funcionalidades.
          </motion.p>
        </div>
      </section>

      {/* Interactive Tour */}
      <section className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Module Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-2 mb-8 justify-center">
            {modules.map((mod, i) => {
              const Icon = mod.icon
              return (
                <button key={mod.id} onClick={() => setActiveModule(i)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={activeModule === i
                    ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                    : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{mod.label}</span>
                </button>
              )
            })}
          </motion.div>

          {/* Content Display */}
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left: Info */}
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
              className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div key={activeModule}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}>
                  <div className="flex items-center gap-3 mb-4">
                    {(() => {
                      const Icon = modules[activeModule].icon
                      return (
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="size-6 text-primary" />
                        </div>
                      )
                    })()}
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{modules[activeModule].title}</h2>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {modules[activeModule].desc}
                  </p>
                  <ul className="space-y-3">
                    {modules[activeModule].features.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <div className="mt-0.5 size-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Check className="size-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Right: Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
              className="lg:col-span-3">
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-500/60" />
                    <span className="size-2.5 rounded-full bg-yellow-500/60" />
                    <span className="size-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="h-6 max-w-xs mx-auto rounded-md bg-muted flex items-center justify-center px-3">
                      <span className="text-[10px] text-muted-foreground font-mono">v0-crm-devnix.vercel.app/{modules[activeModule].id}</span>
                    </div>
                  </div>
                </div>
                {/* Screenshot area */}
                <div className="relative aspect-[16/10] w-full bg-background">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeModule} className="absolute inset-0"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.35 }}>
                      <Image
                        src={modules[activeModule].screenshot}
                        alt={modules[activeModule].title}
                        fill
                        className="object-cover object-top"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              {/* Navigation hint */}
              <div className="mt-4 flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">
                  {activeModule + 1} de {modules.length}
                </p>
                <div className="flex gap-1.5">
                  {modules.map((_, i) => (
                    <button key={i} onClick={() => setActiveModule(i)}
                      className="size-1.5 rounded-full transition-all duration-200"
                      style={{ background: activeModule === i ? "var(--foreground)" : "var(--border)" }} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Pronto para organizar seu negocio?
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            Crie sua conta gratis agora e comece a usar todas as funcionalidades do Devnix CRM Plus em menos de 2 minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Criar conta gratis
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/planos">
                Ver planos e precos
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

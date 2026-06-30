import { ShieldOff } from "lucide-react"
import Link from "next/link"

interface AccessDeniedProps {
  module?: string
  message?: string
}

export function AccessDenied({ module, message }: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div
        className="size-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}
      >
        <ShieldOff className="size-8" style={{ color: "var(--muted-foreground)" }} />
      </div>

      <h1
        className="text-2xl font-black tracking-tight mb-2"
        style={{ color: "var(--foreground)" }}
      >
        Acesso restrito
      </h1>

      <p
        className="text-sm max-w-sm leading-relaxed mb-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        {message ?? (
          <>
            Você não tem permissão para acessar
            {module ? <> o módulo <strong style={{ color: "var(--foreground)" }}>{module}</strong></> : " esta área"}.
          </>
        )}
      </p>

      <p
        className="text-xs mb-8"
        style={{ color: "var(--muted-foreground)" }}
      >
        Peça ao administrador da empresa para liberar o acesso.
      </p>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
      >
        Voltar ao início
      </Link>
    </div>
  )
}

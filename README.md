# Elevanthe CRM

**SaaS de gestão para prestadores de serviço e pequenas empresas brasileiras.**

> Desenvolvido com [v0.app](https://v0.app) · Deployed no Vercel · Banco Neon (PostgreSQL)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 + shadcn/ui |
| Banco de dados | Neon (PostgreSQL serverless) |
| ORM | Drizzle ORM |
| Autenticação | Better Auth |
| Pagamentos | Mercado Pago (Checkout Pro + PIX) |
| WhatsApp | Z-API |
| E-mail | Resend |
| Anti-spam | Cloudflare Turnstile |
| Deploy | Vercel |

---

## Rodar localmente

```bash
pnpm install
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de ambiente obrigatórias

```env
# Banco
DATABASE_URL=

# Auth
BETTER_AUTH_SECRET=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=

# Z-API (WhatsApp)
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=

# Resend (e-mail)
RESEND_API_KEY=

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Admin
ADMIN_SECRET=
```

---

## Documentação completa

Ver [`docs/DOCUMENTACAO.md`](./docs/DOCUMENTACAO.md).

---

## Links

- [Continuar no v0 →](https://v0.app/chat/projects/prj_dcstjAsQdJA6yJPDH1yOVFPxoq8w)
- [Deploy no Vercel →](https://vercel.com)
- [Documentação Next.js →](https://nextjs.org/docs)

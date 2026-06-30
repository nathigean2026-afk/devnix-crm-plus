import { MetadataRoute } from "next"

const BASE_URL = "https://crm.elevanthe.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Permite crawlers nas páginas públicas
        userAgent: "*",
        allow: ["/", "/demo", "/planos/publico", "/sign-in", "/sign-up", "/esqueci-senha"],
        disallow: [
          "/admin",
          "/dashboard",
          "/planos/sucesso",
          "/sessao-encerrada",
          "/aceitar-convite",
          "/api/",
          "/orcamento/",
          "/ordem-servico/",
          "/recibo/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

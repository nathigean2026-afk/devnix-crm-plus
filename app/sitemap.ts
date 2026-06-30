import { MetadataRoute } from "next"

const BASE_URL = "https://crm.elevanthe.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Páginas públicas principais
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/planos/publico`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },

    // Autenticação
    {
      url: `${BASE_URL}/sign-in`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/sign-up`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/esqueci-senha`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ]
}

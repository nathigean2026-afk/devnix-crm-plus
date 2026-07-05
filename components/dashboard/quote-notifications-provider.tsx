"use client"

import { useQuoteNotifications } from "@/hooks/use-quote-notifications"

// Componente invisível que ativa o polling de notificações de orçamento.
// Deve ser renderizado dentro do layout autenticado do dashboard.
export function QuoteNotificationsProvider() {
  useQuoteNotifications()
  return null
}

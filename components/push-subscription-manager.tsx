"use client"

import { useEffect } from "react"

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

// Converte chave VAPID base64url → Uint8Array (exigido pela Web Push API)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

async function saveSubscription(sub: PushSubscription) {
  const subJson = sub.toJSON()
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    }),
  })
  return res.ok
}

async function doSubscribe(registration: ServiceWorkerRegistration) {
  try {
    // Se já tem subscription ativa, garante que está no banco
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      await saveSubscription(existing)
      return
    }

    // Pede permissão ao usuário
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return

    // Cria nova subscription com a chave VAPID
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
    })

    await saveSubscription(sub)
  } catch (err) {
    console.error("[push] Erro ao registrar subscription:", err)
  }
}

export function PushSubscriptionManager() {
  useEffect(() => {
    // Verifica suporte do navegador
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !VAPID_KEY
    ) return

    // Aguarda o SW estar registrado e ativo, depois inscreve
    navigator.serviceWorker.ready.then((registration) => {
      doSubscribe(registration)
    })
  }, [])

  return null
}

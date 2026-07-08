"use client"

import { useEffect } from "react"

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
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
    if (!vapidKey) return

    // Se já tem subscription ativa, garante que está salva no banco
    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      await saveSubscription(existing)
      return
    }

    // Cria nova subscription com a chave VAPID (permissão já foi concedida)
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    await saveSubscription(sub)
  } catch (err) {
    console.error("[push-manager] doSubscribe:", err)
  }
}

export function PushSubscriptionManager() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
    // Só age se o usuário já concedeu permissão — não pede permissão aqui
    if (Notification.permission !== "granted") return

    async function run() {
      try {
        // Garante que o SW está registrado antes de chamar .ready
        const existingRegs = await navigator.serviceWorker.getRegistrations()
        if (existingRegs.length === 0) {
          await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        }

        const registration = await navigator.serviceWorker.ready
        await doSubscribe(registration)
      } catch (err) {
        console.error("[push-manager] erro:", err)
      }
    }

    run()
  }, [])

  return null
}

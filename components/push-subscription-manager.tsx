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
  console.log("[v0] push - salvando subscription, endpoint:", subJson.endpoint?.slice(0, 60))
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    }),
  })
  const json = await res.json().catch(() => ({}))
  console.log("[v0] push - resposta do subscribe:", res.status, json)
  return res.ok
}

async function doSubscribe(registration: ServiceWorkerRegistration) {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
    console.log("[v0] push - VAPID key disponível:", vapidKey ? "sim (" + vapidKey.slice(0, 20) + "...)" : "NÃO - variável ausente!")

    if (!vapidKey) {
      console.error("[v0] push - NEXT_PUBLIC_VAPID_PUBLIC_KEY não definida, abortando")
      return
    }

    const permissionState = Notification.permission
    console.log("[v0] push - permissão atual:", permissionState)

    // Se já tem subscription ativa, garante que está no banco
    const existing = await registration.pushManager.getSubscription()
    console.log("[v0] push - subscription existente:", existing ? "sim" : "não")

    if (existing) {
      await saveSubscription(existing)
      return
    }

    // Pede permissão ao usuário
    console.log("[v0] push - pedindo permissão...")
    const permission = await Notification.requestPermission()
    console.log("[v0] push - permissão concedida:", permission)
    if (permission !== "granted") {
      console.warn("[v0] push - permissão negada ou ignorada:", permission)
      return
    }

    // Cria nova subscription com a chave VAPID
    console.log("[v0] push - criando subscription...")
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    console.log("[v0] push - subscription criada com sucesso")

    await saveSubscription(sub)
  } catch (err) {
    console.error("[v0] push - erro ao registrar subscription:", err)
  }
}

export function PushSubscriptionManager() {
  useEffect(() => {
    if (typeof window === "undefined") return

    if (!("serviceWorker" in navigator)) {
      console.warn("[v0] push - serviceWorker não suportado neste navegador")
      return
    }
    if (!("PushManager" in window)) {
      console.warn("[v0] push - PushManager não suportado neste navegador")
      return
    }

    console.log("[v0] push - aguardando SW ficar ready...")
    navigator.serviceWorker.ready.then((registration) => {
      console.log("[v0] push - SW ready, iniciando subscribe...")
      doSubscribe(registration)
    }).catch((err) => {
      console.error("[v0] push - erro ao aguardar SW ready:", err)
    })
  }, [])

  return null
}

"use client"

import { useEffect } from "react"

export function PWAProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js")
        } catch {
          // swallow registration errors
        }
      }
      if (document.readyState === "complete") register()
      else window.addEventListener("load", register, { once: true })
    }
  }, [])

  return null
}

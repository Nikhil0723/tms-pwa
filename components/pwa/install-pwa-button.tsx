"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

interface InstallPWAButtonProps {
  className?: string
}

export function InstallPWAButton({ className }: InstallPWAButtonProps) {
  const [supported, setSupported] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setSupported(true)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener)

    const iosStandalone = (navigator as any).standalone === true
    const displayStandalone = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(iosStandalone || displayStandalone)

    const onAppInstalled = () => {
      // Hide button after successful install
      setDeferredPrompt(null)
      setSupported(false)
      setIsStandalone(true)
    }
    window.addEventListener("appinstalled", onAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  if (!supported || isStandalone) return null

  const handleClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    try {
      await deferredPrompt.userChoice
    } finally {
      setDeferredPrompt(null)
      setSupported(false)
    }
  }

  return (
    <Button onClick={handleClick} size="sm" className={className} aria-label="Install app">
      <Download className="h-4 w-4 mr-2" />
      Install app
    </Button>
  )
}

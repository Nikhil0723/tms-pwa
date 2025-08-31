"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useLiveData } from "@/hooks/use-live-data"

export function ThemeSync() {
  const { setTheme } = useTheme()
  const { settings } = useLiveData()

  useEffect(() => {
    if (!settings?.theme) return
    // allowed: 'light' | 'dark' | 'system'
    setTheme(settings.theme as any)
  }, [settings?.theme, setTheme])

  return null
}

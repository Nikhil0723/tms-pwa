"use client"

import { useLiveData } from "@/hooks/use-live-data"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import dynamic from "next/dynamic"
import Image from "next/image"

interface HeaderProps {
  onMenuClick?: () => void
}

const InstallPWAButton = dynamic(
  () => import("@/components/pwa/install-pwa-button").then((m) => ({ default: m.InstallPWAButton })),
  { ssr: false, loading: () => null },
)

export function Header({ onMenuClick }: HeaderProps) {
  const { settings } = useLiveData()

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          {settings?.logoDataUrl ? (
            <Image
              src={settings.logoDataUrl || "/placeholder.svg?height=28&width=28&query=school%20logo"}
              alt="School logo"
              width={28}
              height={28}
              className="rounded-sm object-contain"
              sizes="(max-width: 768px) 24px, 28px"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div>
            <h2 className="text-lg font-semibold">{settings?.schoolName || "Tuition Management System"}</h2>
            <p className="text-sm text-muted-foreground">
              Academic Year: {settings?.academicYear || new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <InstallPWAButton />
        <span className="text-sm text-muted-foreground">Admin Portal</span>
      </div>
    </header>
  )
}

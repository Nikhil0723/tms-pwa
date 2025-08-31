"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Receipt, CreditCard, FileText, BarChart3, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstallPWAButton } from "@/components/pwa/install-pwa-button"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: Users },
  { name: "Fee Templates", href: "/fees", icon: Receipt },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean // Added isMobile prop to handle desktop vs mobile behavior
}

export function Sidebar({ isOpen = true, onClose, isMobile = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && isMobile && <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />}

      <div
        className={cn(
          "flex h-full w-64 flex-col bg-card border-r transition-transform duration-300 ease-in-out",
          isMobile
            ? cn("fixed z-50 inset-y-0 left-0", isOpen ? "translate-x-0" : "-translate-x-full")
            : cn("fixed z-30 inset-y-0 left-0", isOpen ? "translate-x-0" : "-translate-x-full"),
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <h1 className="text-xl font-semibold">TFM Admin</h1>
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                onClick={() => {
                  if (isMobile) {
                    onClose?.()
                  }
                }}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto border-t px-3 py-3">
          <InstallPWAButton className="w-full" />
        </div>
      </div>
    </>
  )
}

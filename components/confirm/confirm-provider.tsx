"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmOptions = {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  mode?: "confirm" | "alert"
}

type ConfirmContextValue = (opts?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider")
  }
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const resolverRef = React.useRef<(v: boolean) => void>()
  const [opts, setOpts] = React.useState<ConfirmOptions>({
    title: "Are you sure?",
    description: "This action cannot be undone.",
    confirmText: "Confirm",
    cancelText: "Cancel",
    mode: "confirm",
  })

  const confirm = React.useCallback((options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setOpts((prev) => ({ ...prev, ...(options || {}) }))
      setOpen(true)
    })
  }, [])

  function handleClose(result: boolean) {
    setOpen(false)
    resolverRef.current?.(result)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opts.title || (opts.mode === "alert" ? "Notice" : "Are you sure?")}</AlertDialogTitle>
            {opts.description ? <AlertDialogDescription>{opts.description}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {opts.mode !== "alert" ? (
              <AlertDialogCancel onClick={() => handleClose(false)}>{opts.cancelText || "Cancel"}</AlertDialogCancel>
            ) : null}
            <AlertDialogAction onClick={() => handleClose(true)}>
              {opts.confirmText || (opts.mode === "alert" ? "OK" : "Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type FormGuardProps = {
  scope?: string
  children: React.ReactNode
  promptWord?: string
}

export function FormGuard({ scope = "default", children, promptWord = "PROCEED" }: FormGuardProps) {
  const storageKey = `tfm:form-guard:${scope}:unlocked`
  const [unlocked, setUnlocked] = useState(false)
  const [typed, setTyped] = useState("")

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(storageKey)
      if (v === "1") setUnlocked(true)
    } catch {
      // ignore
    }
  }, [storageKey])

  const handleUnlock = () => {
    try {
      sessionStorage.setItem(storageKey, "1")
    } catch {
      // ignore
    }
    setUnlocked(true)
  }

  return (
    <>
      {children}
      <Dialog open={!unlocked}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Confirm access</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This action is protected. Type {promptWord} to continue editing or creating records.
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
              placeholder={promptWord}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled>
                Cancel
              </Button>
              <Button type="button" onClick={handleUnlock} disabled={typed !== promptWord}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

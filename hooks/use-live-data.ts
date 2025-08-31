"use client"

import { useState, useEffect } from "react"
import { storage } from "@/lib/storage"
import type { Student, FeeTemplate, Payment, Settings } from "@/types"

export function useLiveData() {
  const [students, setStudents] = useState<Student[]>([])
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)

  const refreshData = () => {
    setStudents(storage.getStudents())
    setFeeTemplates(storage.getFeeTemplates())
    setPayments(storage.getPayments())
    setSettings(storage.getSettings())
  }

  useEffect(() => {
    // Initial load
    refreshData()

    // Listen for storage changes (multi-tab sync)
    const handleStorageChange = () => {
      refreshData()
    }

    window.addEventListener("tfm-storage-change", handleStorageChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("tfm-storage-change", handleStorageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  return {
    students,
    feeTemplates,
    payments,
    settings,
    refreshData,
  }
}

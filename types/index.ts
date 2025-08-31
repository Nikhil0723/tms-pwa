export type UUID = string

export interface Student {
  id: UUID
  studentId: string // optional external id
  firstName: string
  lastName: string
  grade: string
  contactPhone?: string
  contactEmail?: string
  guardianName?: string
  enrollmentDate: string // ISO date
  status: "active" | "inactive"
  notes?: string
  assignedFees: StudentFeeLine[] // snapshot of assigned fee lines
}

export interface FeeTemplate {
  id: UUID
  title: string
  category: "tuition" | "exam" | "transport" | "misc"
  amount: number
  frequency: "one-time" | "monthly" | "term" | "annual" | "custom"
  dueDay?: number // e.g., day of month
  notes?: string
}

export interface StudentFeeLine {
  id: UUID
  templateId?: UUID // refer to template (optional if custom)
  title: string
  amount: number
  dueDate?: string // ISO
  createdAt: string
  status: "open" | "paid" | "partial" | "overdue"
  paymentsApplied: { paymentId: UUID; amount: number }[]
}

export interface Payment {
  id: UUID
  studentId: UUID
  date: string // ISO
  amount: number
  method: string
  notes?: string
  appliedTo: { feeLineId: UUID; amount: number }[]
}

export interface Settings {
  schoolName: string
  schoolLogoDataUrl?: string
  currency: string
  academicYear?: string
  invoiceSeq?: number
  dateFormat?: string
}

export interface AppMetadata {
  version: string
  lastBackup?: string
  createdAt: string
}

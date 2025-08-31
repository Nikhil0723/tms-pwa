import type { Student, Payment, StudentFeeLine } from "@/types"

export function calculateOutstanding(student: Student, payments: Payment[]): number {
  const studentPayments = payments.filter((p) => p.studentId === student.id)

  let totalFees = 0
  let totalPaid = 0

  // Calculate total fees
  student.assignedFees.forEach((fee) => {
    totalFees += fee.amount
  })

  // Calculate total payments
  studentPayments.forEach((payment) => {
    totalPaid += payment.amount
  })

  return Math.max(0, totalFees - totalPaid)
}

export function updateFeeLineStatus(feeLine: StudentFeeLine): StudentFeeLine {
  const totalPaid = feeLine.paymentsApplied.reduce((sum, p) => sum + p.amount, 0)

  let status: StudentFeeLine["status"] = "open"

  if (totalPaid >= feeLine.amount) {
    status = "paid"
  } else if (totalPaid > 0) {
    status = "partial"
  } else if (feeLine.dueDate && isOverdue(feeLine.dueDate)) {
    status = "overdue"
  }

  return { ...feeLine, status }
}

function isOverdue(dueDate: string): boolean {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

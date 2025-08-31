"use client"

import { formatCurrency } from "./currency"
import { formatDate } from "./date"
import { calculateOutstanding } from "./calculations"
import type { Student, Payment, FeeTemplate, Settings } from "@/types"

export interface ExportData {
  students: Student[]
  payments: Payment[]
  feeTemplates: FeeTemplate[]
  settings: Settings
}

export function exportStudentsCSV(data: ExportData): string {
  const { students, payments, settings } = data

  const headers = [
    "Student ID",
    "First Name",
    "Last Name",
    "Grade",
    "Status",
    "Contact Phone",
    "Contact Email",
    "Guardian Name",
    "Enrollment Date",
    "Total Fees",
    "Total Paid",
    "Outstanding Balance",
    "Notes",
  ]

  const rows = students.map((student) => {
    const studentPayments = payments.filter((p) => p.studentId === student.id)
    const totalFees = student.assignedFees.reduce((sum, fee) => sum + fee.amount, 0)
    const totalPaid = studentPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const outstanding = calculateOutstanding(student, payments)

    return [
      student.studentId,
      student.firstName,
      student.lastName,
      student.grade,
      student.status,
      student.contactPhone || "",
      student.contactEmail || "",
      student.guardianName || "",
      formatDate(student.enrollmentDate, settings.dateFormat),
      totalFees.toFixed(2),
      totalPaid.toFixed(2),
      outstanding.toFixed(2),
      student.notes || "",
    ]
  })

  return convertToCSV([headers, ...rows])
}

export function exportPaymentsCSV(data: ExportData, dateRange?: { start: string; end: string }): string {
  const { students, payments, settings } = data

  let filteredPayments = payments
  if (dateRange) {
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    filteredPayments = payments.filter((payment) => {
      const paymentDate = new Date(payment.date)
      return paymentDate >= startDate && paymentDate <= endDate
    })
  }

  const headers = ["Payment Date", "Student ID", "Student Name", "Grade", "Amount", "Method", "Applied To", "Notes"]

  const rows = filteredPayments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((payment) => {
      const student = students.find((s) => s.id === payment.studentId)
      const appliedTo = payment.appliedTo
        .map((app) => {
          const fee = student?.assignedFees.find((f) => f.id === app.feeLineId)
          return fee ? `${fee.title}: ${formatCurrency(app.amount, settings.currency)}` : "Unknown Fee"
        })
        .join("; ")

      return [
        formatDate(payment.date, settings.dateFormat),
        student?.studentId || "Unknown",
        student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
        student?.grade || "",
        payment.amount.toFixed(2),
        payment.method,
        appliedTo || "Not applied",
        payment.notes || "",
      ]
    })

  return convertToCSV([headers, ...rows])
}

export function exportOutstandingBalancesCSV(data: ExportData): string {
  const { students, payments, settings } = data

  const studentsWithOutstanding = students
    .map((student) => ({
      student,
      outstanding: calculateOutstanding(student, payments),
    }))
    .filter((item) => item.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)

  const headers = [
    "Student ID",
    "Student Name",
    "Grade",
    "Contact Email",
    "Guardian Name",
    "Outstanding Balance",
    "Overdue Fees",
  ]

  const rows = studentsWithOutstanding.map(({ student, outstanding }) => {
    const overdueFees = student.assignedFees
      .filter((fee) => fee.dueDate && new Date(fee.dueDate) < new Date() && fee.status !== "paid")
      .map((fee) => fee.title)
      .join("; ")

    return [
      student.studentId,
      `${student.firstName} ${student.lastName}`,
      student.grade,
      student.contactEmail || "",
      student.guardianName || "",
      outstanding.toFixed(2),
      overdueFees || "None",
    ]
  })

  return convertToCSV([headers, ...rows])
}

export function exportFeeTemplatesCSV(data: ExportData): string {
  const { feeTemplates, students } = data

  const headers = ["Fee Name", "Category", "Amount", "Frequency", "Due Day", "Assigned Students", "Notes"]

  const rows = feeTemplates.map((template) => {
    const assignedCount = students.filter((student) =>
      student.assignedFees.some((fee) => fee.templateId === template.id),
    ).length

    return [
      template.title,
      template.category,
      template.amount.toFixed(2),
      template.frequency,
      template.dueDay?.toString() || "",
      assignedCount.toString(),
      template.notes || "",
    ]
  })

  return convertToCSV([headers, ...rows])
}

function convertToCSV(data: string[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = cell.replace(/"/g, '""')
          return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped
        })
        .join(","),
    )
    .join("\n")
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

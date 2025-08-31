export function formatDate(date: string | Date, format = "MM/dd/yyyy"): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ""

  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const year = d.getFullYear()

  switch (format) {
    case "MM/dd/yyyy":
      return `${month}/${day}/${year}`
    case "dd/MM/yyyy":
      return `${day}/${month}/${year}`
    case "yyyy-MM-dd":
      return `${year}-${month}-${day}`
    default:
      return d.toLocaleDateString()
  }
}

export function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

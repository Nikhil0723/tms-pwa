import type { Student, FeeTemplate, Payment, Settings, AppMetadata } from "@/types"

const STORAGE_PREFIX = "tfm:v0:"
const CURRENT_VERSION = "1.0.0"

export class StorageService {
  private static instance: StorageService

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  private getKey(entity: string): string {
    return `${STORAGE_PREFIX}${entity}`
  }

  private safeGet<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.getKey(key))
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error)
      return defaultValue
    }
  }

  private safeSet<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value))
      this.dispatchStorageEvent(key)
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error)
    }
  }

  private dispatchStorageEvent(key: string): void {
    window.dispatchEvent(
      new CustomEvent("tfm-storage-change", {
        detail: { key: this.getKey(key) },
      }),
    )
  }

  // Students
  getStudents(): Student[] {
    return this.safeGet("students", [])
  }

  setStudents(students: Student[]): void {
    this.safeSet("students", students)
  }

  addStudent(student: Student): void {
    const students = this.getStudents()
    students.push(student)
    this.setStudents(students)
  }

  updateStudent(id: string, updates: Partial<Student>): void {
    const students = this.getStudents()
    const index = students.findIndex((s) => s.id === id)
    if (index !== -1) {
      students[index] = { ...students[index], ...updates }
      this.setStudents(students)
    }
  }

  deleteStudent(id: string): void {
    const students = this.getStudents().filter((s) => s.id !== id)
    this.setStudents(students)
  }

  // Fee Templates
  getFeeTemplates(): FeeTemplate[] {
    return this.safeGet("feeTemplates", [])
  }

  setFeeTemplates(templates: FeeTemplate[]): void {
    this.safeSet("feeTemplates", templates)
  }

  addFeeTemplate(template: FeeTemplate): void {
    const templates = this.getFeeTemplates()
    templates.push(template)
    this.setFeeTemplates(templates)
  }

  updateFeeTemplate(id: string, updates: Partial<FeeTemplate>): void {
    const templates = this.getFeeTemplates()
    const index = templates.findIndex((t) => t.id === id)
    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates }
      this.setFeeTemplates(templates)
    }
  }

  deleteFeeTemplate(id: string): void {
    const templates = this.getFeeTemplates().filter((t) => t.id !== id)
    this.setFeeTemplates(templates)
  }

  // Payments
  getPayments(): Payment[] {
    return this.safeGet("payments", [])
  }

  setPayments(payments: Payment[]): void {
    this.safeSet("payments", payments)
  }

  addPayment(payment: Payment): void {
    const payments = this.getPayments()
    payments.push(payment)
    this.setPayments(payments)
  }

  // Settings
  getSettings(): Settings {
    return this.safeGet("settings", {
      schoolName: "My School",
      currency: "USD",
      academicYear: new Date().getFullYear().toString(),
      invoiceSeq: 1,
      dateFormat: "MM/dd/yyyy",
    })
  }

  setSettings(settings: Settings): void {
    this.safeSet("settings", settings)
  }

  // Metadata
  getMetadata(): AppMetadata {
    return this.safeGet("metadata", {
      version: CURRENT_VERSION,
      createdAt: new Date().toISOString(),
    })
  }

  setMetadata(metadata: AppMetadata): void {
    this.safeSet("metadata", metadata)
  }

  // Backup & Restore
  exportData(): string {
    const data = {
      students: this.getStudents(),
      feeTemplates: this.getFeeTemplates(),
      payments: this.getPayments(),
      settings: this.getSettings(),
      metadata: this.getMetadata(),
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)

      // Basic validation
      if (!data.students || !Array.isArray(data.students)) {
        throw new Error("Invalid data format")
      }

      this.setStudents(data.students)
      this.setFeeTemplates(data.feeTemplates || [])
      this.setPayments(data.payments || [])
      this.setSettings(data.settings || this.getSettings())
      this.setMetadata(data.metadata || this.getMetadata())

      return true
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  // Clear all data
  clearAllData(): void {
    const keys = ["students", "feeTemplates", "payments", "settings", "metadata"]
    keys.forEach((key) => {
      localStorage.removeItem(this.getKey(key))
    })
  }
}

export const storage = StorageService.getInstance()

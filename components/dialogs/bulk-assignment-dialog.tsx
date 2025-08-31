"use client"

import { useState } from "react"
import { useLiveData } from "@/hooks/use-live-data"
import { storage } from "@/lib/storage"
import { generateUUID } from "@/utils/uuid"
import { formatCurrency } from "@/utils/currency"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { FeeTemplate, StudentFeeLine } from "@/types"
import { useConfirm } from "@/components/confirm/confirm-provider"

interface BulkAssignmentDialogProps {
  template: FeeTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkAssignmentDialog({ template, open, onOpenChange }: BulkAssignmentDialogProps) {
  const { students, settings, refreshData } = useLiveData()
  const [assignmentMode, setAssignmentMode] = useState<"grade" | "individual">("grade")
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const confirmDialog = useConfirm()

  // Get unique grades and sanitize them
  const grades = Array.from(
    new Set(
      students
        .map((s) => (s.grade == null ? "" : typeof s.grade === "string" ? s.grade : String(s.grade)))
        .map((g) => g.trim())
        .filter((g) => g.length > 0),
    ),
  ).sort()

  // Get students for current selection
  const getTargetStudents = () => {
    if (assignmentMode === "grade" && selectedGrade) {
      return students.filter((s) => s.grade === selectedGrade && s.status === "active")
    }
    if (assignmentMode === "individual") {
      return students.filter((s) => selectedStudents.includes(s.id))
    }
    return []
  }

  const targetStudents = getTargetStudents()

  // Get students who already have this fee assigned
  const studentsWithFee = students.filter((student) =>
    student.assignedFees.some((fee) => fee.templateId === template.id),
  )

  // Get students who would be newly assigned
  const newAssignments = targetStudents.filter(
    (student) => !student.assignedFees.some((fee) => fee.templateId === template.id),
  )

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const createFeeLine = (template: FeeTemplate): StudentFeeLine => {
    const now = new Date()
    let dueDate: string | undefined

    if (template.dueDay) {
      let due = new Date(now.getFullYear(), now.getMonth(), template.dueDay)
      // If the due date has passed this month, set it for next month
      if (due < now) {
        due = new Date(now.getFullYear(), now.getMonth() + 1, template.dueDay)
      }
      dueDate = due.toISOString()
    }

    return {
      id: generateUUID(),
      templateId: template.id,
      title: template.title,
      amount: template.amount,
      dueDate,
      createdAt: new Date().toISOString(),
      status: "open",
      paymentsApplied: [],
    }
  }

  const handleAssign = async () => {
    setIsSubmitting(true)

    try {
      const feeLine = createFeeLine(template)

      newAssignments.forEach((student) => {
        const updatedFees = [...student.assignedFees, feeLine]
        storage.updateStudent(student.id, { assignedFees: updatedFees })
      })

      refreshData()
      onOpenChange(false)
    } catch (error) {
      console.error("Error assigning fee:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnassign = async () => {
    const ok = await confirmDialog({
      title: "Remove fee from all students?",
      description: "This will unassign the fee from every student currently assigned.",
      confirmText: "Remove",
      cancelText: "Cancel",
      destructive: true,
      mode: "confirm",
    })
    if (!ok) return

    setIsSubmitting(true)
    try {
      studentsWithFee.forEach((student) => {
        const updatedFees = student.assignedFees.filter((fee) => fee.templateId !== template.id)
        storage.updateStudent(student.id, { assignedFees: updatedFees })
      })
      refreshData()
      onOpenChange(false)
    } catch (error) {
      console.error("Error unassigning fee:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Fee Assignment: {template.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fee Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fee Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="outline">{template.frequency}</Badge>
                <span className="font-medium">{formatCurrency(template.amount, settings?.currency)}</span>
                {template.dueDay && <span className="text-sm text-muted-foreground">Due: Day {template.dueDay}</span>}
              </div>
              {template.notes && <p className="text-sm text-muted-foreground mt-2">{template.notes}</p>}
            </CardContent>
          </Card>

          {/* Current Assignment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Currently assigned to {studentsWithFee.length} students</span>
                {studentsWithFee.length > 0 && (
                  <Button variant="destructive" onClick={handleUnassign} disabled={isSubmitting}>
                    Remove from All Students
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Assignment Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assign to Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Assignment Mode</Label>
                <Select
                  value={assignmentMode}
                  onValueChange={(value: "grade" | "individual") => setAssignmentMode(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grade">Assign by Grade</SelectItem>
                    <SelectItem value="individual">Select Individual Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assignmentMode === "grade" && (
                <div>
                  <Label>Select Grade</Label>
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Only render non-empty grades */}
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade} ({students.filter((s) => s.grade === grade && s.status === "active").length} students)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {assignmentMode === "individual" && (
                <div className="space-y-2">
                  <Label>Select Students</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                    {students
                      .filter((s) => s.status === "active")
                      .map((student) => (
                        <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                          <Checkbox
                            id={student.id}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleStudentToggle(student.id)}
                          />
                          <Label htmlFor={student.id} className="flex-1 cursor-pointer">
                            {student.firstName} {student.lastName} ({student.grade})
                            {student.assignedFees.some((fee) => fee.templateId === template.id) && (
                              <Badge variant="secondary" className="ml-2">
                                Already assigned
                              </Badge>
                            )}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {targetStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Total students selected:</strong> {targetStudents.length}
                  </p>
                  <p>
                    <strong>New assignments:</strong> {newAssignments.length}
                  </p>
                  <p>
                    <strong>Already assigned:</strong> {targetStudents.length - newAssignments.length}
                  </p>
                  <p>
                    <strong>Total fee amount:</strong>{" "}
                    {formatCurrency(newAssignments.length * template.amount, settings?.currency)}
                  </p>
                </div>

                {newAssignments.length > 0 && (
                  <div className="mt-4">
                    <Label>Students to be assigned:</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {newAssignments.map((student) => (
                        <div key={student.id} className="text-sm p-1">
                          {student.firstName} {student.lastName} ({student.grade})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {newAssignments.length > 0 && (
              <Button onClick={handleAssign} disabled={isSubmitting}>
                {isSubmitting ? "Assigning..." : `Assign to ${newAssignments.length} Students`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

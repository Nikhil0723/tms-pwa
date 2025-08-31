"use client"

import { useState } from "react"
import { useLiveData } from "@/hooks/use-live-data"
import { storage } from "@/lib/storage"
import { formatCurrency } from "@/utils/currency"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Filter, Edit, Trash2, Users } from "lucide-react"
import { FeeTemplateForm } from "@/components/forms/fee-template-form"
import { BulkAssignmentDialog } from "@/components/dialogs/bulk-assignment-dialog"
import type { FeeTemplate } from "@/types"
import { useConfirm } from "@/components/confirm/confirm-provider"

export default function FeesPage() {
  const { feeTemplates, students, settings, refreshData } = useLiveData()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [frequencyFilter, setFrequencyFilter] = useState("all")
  const [editingTemplate, setEditingTemplate] = useState<FeeTemplate | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [bulkAssignTemplate, setBulkAssignTemplate] = useState<FeeTemplate | null>(null)
  const confirmDialog = useConfirm()

  // Filter templates
  const filteredTemplates = feeTemplates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
    const matchesFrequency = frequencyFilter === "all" || template.frequency === frequencyFilter

    return matchesSearch && matchesCategory && matchesFrequency
  })

  const handleDeleteTemplate = async (templateId: string) => {
    const assignedStudents = students.filter((student) =>
      student.assignedFees.some((fee) => fee.templateId === templateId),
    )

    if (assignedStudents.length > 0) {
      const ok = await confirmDialog({
        title: "Delete fee template?",
        description: `This template is assigned to ${assignedStudents.length} student(s). Deleting will remove it from all assigned students.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        destructive: true,
        mode: "confirm",
      })
      if (!ok) return

      // Remove fee lines from students
      assignedStudents.forEach((student) => {
        const updatedFees = student.assignedFees.filter((fee) => fee.templateId !== templateId)
        storage.updateStudent(student.id, { assignedFees: updatedFees })
      })
    }

    storage.deleteFeeTemplate(templateId)
    refreshData()
  }

  const handleEditTemplate = (template: FeeTemplate) => {
    setEditingTemplate(template)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingTemplate(null)
    refreshData()
  }

  const getAssignedStudentCount = (templateId: string) => {
    return students.filter((student) => student.assignedFees.some((fee) => fee.templateId === templateId)).length
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "tuition":
        return "default"
      case "exam":
        return "secondary"
      case "transport":
        return "outline"
      case "misc":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "one-time":
        return "default"
      case "monthly":
        return "secondary"
      case "term":
        return "outline"
      case "annual":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fee Templates</h1>
          <p className="text-muted-foreground">Manage fee templates and assign them to students</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fee templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tuition">Tuition</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="misc">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequencies</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="term">Term</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fee Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Templates ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No fee templates found</p>
              {feeTemplates.length === 0 && (
                <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                  Create your first fee template
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fee Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Due Day</TableHead>
                  <TableHead>Assigned Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => {
                  const assignedCount = getAssignedStudentCount(template.id)

                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.title}</div>
                          {template.notes && <div className="text-sm text-muted-foreground">{template.notes}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCategoryColor(template.category)}>{template.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(template.amount, settings?.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getFrequencyColor(template.frequency)}>{template.frequency}</Badge>
                      </TableCell>
                      <TableCell>{template.dueDay ? `Day ${template.dueDay}` : "Not set"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{assignedCount}</span>
                          {assignedCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setBulkAssignTemplate(template)}>
                              <Users className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setBulkAssignTemplate(template)}>
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fee Template Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Fee Template" : "Create Fee Template"}</DialogTitle>
          </DialogHeader>
          <FeeTemplateForm
            template={editingTemplate}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingTemplate(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      {bulkAssignTemplate && (
        <BulkAssignmentDialog
          template={bulkAssignTemplate}
          open={!!bulkAssignTemplate}
          onOpenChange={(open) => !open && setBulkAssignTemplate(null)}
        />
      )}
    </div>
  )
}

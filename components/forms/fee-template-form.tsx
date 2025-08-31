"use client"

import type React from "react"
import { FormGuard } from "@/components/security/form-guard"
import { useState } from "react"
import { storage } from "@/lib/storage"
import { generateUUID } from "@/utils/uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FeeTemplate } from "@/types"

interface FeeTemplateFormProps {
  template?: FeeTemplate | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function FeeTemplateForm({ template, onSuccess, onCancel }: FeeTemplateFormProps) {
  const [formData, setFormData] = useState({
    title: template?.title || "",
    category: template?.category || ("tuition" as const),
    amount: template?.amount?.toString() || "",
    frequency: template?.frequency || ("one-time" as const),
    dueDay: template?.dueDay?.toString() || "",
    notes: template?.notes || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const templateData: FeeTemplate = {
        id: template?.id || generateUUID(),
        title: formData.title,
        category: formData.category,
        amount: Number.parseFloat(formData.amount) || 0,
        frequency: formData.frequency,
        dueDay: formData.dueDay ? Number.parseInt(formData.dueDay) : undefined,
        notes: formData.notes || undefined,
      }

      if (template) {
        storage.updateFeeTemplate(template.id, templateData)
      } else {
        storage.addFeeTemplate(templateData)
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error saving fee template:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormGuard scope="fee-template-form">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Fee Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Monthly Tuition, Exam Fee"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="misc">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange("amount", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="term">Term</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDay">Due Day (Optional)</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay}
                  onChange={(e) => handleInputChange("dueDay", e.target.value)}
                  placeholder="e.g., 15 for 15th of month"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For monthly fees, specify which day of the month it's due
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional information about this fee..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </FormGuard>
  )
}

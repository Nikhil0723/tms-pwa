"use client"

import { useState } from "react"
import { useLiveData } from "@/hooks/use-live-data"
import { storage } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Palette, School } from "lucide-react"
import Image from "next/image"
import type { Settings as SettingsType } from "@/types"

export default function SettingsPage() {
  const { settings, refreshData } = useLiveData()
  const [formData, setFormData] = useState<SettingsType>(
    settings || {
      id: "default",
      schoolName: "Tuition Management System",
      academicYear: new Date().getFullYear().toString(),
      currency: "USD",
      dateFormat: "MM/dd/yyyy",
      language: "en",
      theme: "light",
      timezone: "UTC",
      invoicePrefix: "INV",
      invoiceNumberStart: 1000,
      paymentMethods: ["Cash", "Check", "Bank Transfer", "Online"],
      feeCategories: ["Tuition", "Books", "Lab Fee", "Transport", "Exam Fee", "Other"],
      gradeOptions: [
        "K-1",
        "K-2",
        "1st",
        "2nd",
        "3rd",
        "4th",
        "5th",
        "6th",
        "7th",
        "8th",
        "9th",
        "10th",
        "11th",
        "12th",
      ],
      logoDataUrl: null,
    },
  )
  const [isSaving, setIsSaving] = useState(false)
  const [newPaymentMethod, setNewPaymentMethod] = useState("")
  const [newFeeCategory, setNewFeeCategory] = useState("")

  const handleInputChange = (field: keyof SettingsType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddPaymentMethod = () => {
    if (newPaymentMethod.trim() && !formData.paymentMethods.includes(newPaymentMethod.trim())) {
      handleInputChange("paymentMethods", [...formData.paymentMethods, newPaymentMethod.trim()])
      setNewPaymentMethod("")
    }
  }

  const handleAddFeeCategory = () => {
    if (newFeeCategory.trim() && !formData.feeCategories.includes(newFeeCategory.trim())) {
      handleInputChange("feeCategories", [...formData.feeCategories, newFeeCategory.trim()])
      setNewFeeCategory("")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      storage.setSettings(formData)
      refreshData()
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure system preferences and options</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid md:grid-cols-3 overflow-x-auto md:overflow-visible whitespace-nowrap">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                    {formData.logoDataUrl ? (
                      <Image
                        src={formData.logoDataUrl || "/placeholder.svg"}
                        alt="Logo preview"
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground px-2 text-center">No Logo</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo">School Logo</Label>
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          handleInputChange("logoDataUrl" as any, reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }}
                      className="block text-sm"
                    />
                    <p className="text-xs text-muted-foreground">PNG or JPG, recommended 128x128</p>
                  </div>
                </div>
              </div>
              {/* existing fields */}
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange("schoolName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => handleInputChange("academicYear", e.target.value)}
                  placeholder="2024-2025"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                  placeholder="INV"
                />
              </div>
              <div>
                <Label htmlFor="invoiceNumberStart">Starting Invoice Number</Label>
                <Input
                  id="invoiceNumberStart"
                  type="number"
                  value={formData.invoiceNumberStart}
                  onChange={(e) => handleInputChange("invoiceNumberStart", Number.parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select value={formData.theme} onValueChange={(value) => handleInputChange("theme", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new payment method"
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPaymentMethod()}
                />
                <Button onClick={handleAddPaymentMethod} disabled={!newPaymentMethod.trim()}>
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {formData.paymentMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{method}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newMethods = formData.paymentMethods.filter((_, i) => i !== index)
                        handleInputChange("paymentMethods", newMethods)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fee Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new fee category"
                  value={newFeeCategory}
                  onChange={(e) => setNewFeeCategory(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddFeeCategory()}
                />
                <Button onClick={handleAddFeeCategory} disabled={!newFeeCategory.trim()}>
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {formData.feeCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{category}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newCategories = formData.feeCategories.filter((_, i) => i !== index)
                        handleInputChange("feeCategories", newCategories)
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

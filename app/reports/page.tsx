"use client"

import { useState } from "react"
import { useLiveData } from "@/hooks/use-live-data"
import { storage } from "@/lib/storage"
import {
  exportStudentsCSV,
  exportPaymentsCSV,
  exportOutstandingBalancesCSV,
  exportFeeTemplatesCSV,
  downloadCSV,
  downloadJSON,
} from "@/utils/csv-export"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Upload, FileSpreadsheet, Database, Users, CreditCard, Receipt, Settings } from "lucide-react"
import { useConfirm } from "@/components/confirm/confirm-provider"

export default function ReportsPage() {
  const { students, payments, feeTemplates, settings, refreshData } = useLiveData()
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const confirmDialog = useConfirm()

  const exportData = {
    students,
    payments,
    feeTemplates,
    settings: settings!,
  }

  const handleExportStudents = () => {
    const csvContent = exportStudentsCSV(exportData)
    downloadCSV(csvContent, `students-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const handleExportPayments = () => {
    const csvContent = exportPaymentsCSV(exportData, dateRange)
    downloadCSV(csvContent, `payments-${dateRange.start}-to-${dateRange.end}.csv`)
  }

  const handleExportOutstanding = () => {
    const csvContent = exportOutstandingBalancesCSV(exportData)
    downloadCSV(csvContent, `outstanding-balances-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const handleExportFeeTemplates = () => {
    const csvContent = exportFeeTemplatesCSV(exportData)
    downloadCSV(csvContent, `fee-templates-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const handleBackupData = () => {
    const backupData = storage.exportData()
    downloadJSON(JSON.parse(backupData), `tfm-backup-${new Date().toISOString().split("T")[0]}.json`)
  }

  const handleImportData = async () => {
    if (!importFile) return

    setIsProcessing(true)
    try {
      const fileContent = await importFile.text()
      const success = storage.importData(fileContent)

      if (success) {
        refreshData()
        setShowImportDialog(false)
        setImportFile(null)
        await confirmDialog({
          mode: "alert",
          title: "Import Complete",
          description: "Data imported successfully!",
          confirmText: "OK",
        })
      } else {
        await confirmDialog({
          mode: "alert",
          title: "Import Failed",
          description: "Error importing data. Please check the file format.",
          confirmText: "OK",
        })
      }
    } catch (error) {
      console.error("Import error:", error)
      await confirmDialog({
        mode: "alert",
        title: "Import Error",
        description: "Error importing data. Please try again.",
        confirmText: "OK",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClearAllData = async () => {
    const ok1 = await confirmDialog({
      title: "Clear ALL data?",
      description: "This action cannot be undone. Make sure you have a backup before proceeding.",
      confirmText: "Continue",
      cancelText: "Cancel",
      destructive: true,
      mode: "confirm",
    })
    if (!ok1) return

    const ok2 = await confirmDialog({
      title: "Permanently delete everything?",
      description: "This will delete all students, payments, fee templates, and settings.",
      confirmText: "Delete All",
      cancelText: "Cancel",
      destructive: true,
      mode: "confirm",
    })
    if (!ok2) return

    storage.clearAllData()
    refreshData()
    await confirmDialog({
      mode: "alert",
      title: "Data Cleared",
      description: "All data has been cleared.",
      confirmText: "OK",
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Data Management</h1>
        <p className="text-muted-foreground">Export data, generate reports, and manage backups</p>
      </div>

      {/* Export Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Students Report</h4>
                    <p className="text-sm text-muted-foreground">All student information and balances</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportStudents}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Outstanding Balances</h4>
                    <p className="text-sm text-muted-foreground">Students with unpaid fees</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportOutstanding}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Payment Transactions</h4>
                    <p className="text-sm text-muted-foreground">Payment history with date range</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportPayments}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Fee Templates</h4>
                    <p className="text-sm text-muted-foreground">All fee templates and assignments</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportFeeTemplates}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Payment Date Range (for payment exports)</Label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Label htmlFor="startDate" className="text-sm">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate" className="text-sm">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-4 w-4" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Backup & Restore</h4>
              <div className="space-y-2">
                <Button onClick={handleBackupData} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Backup (JSON)
                </Button>
                <Button variant="outline" onClick={() => setShowImportDialog(true)} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Restore from Backup
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Backup includes all students, payments, fee templates, and settings
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Data Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Students:</span>
                  <span className="font-medium">{students.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Payments:</span>
                  <span className="font-medium">{payments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee Templates:</span>
                  <span className="font-medium">{feeTemplates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Size:</span>
                  <span className="font-medium">{Math.round(new Blob([storage.exportData()]).size / 1024)} KB</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-destructive">Danger Zone</h4>
            <Button variant="destructive" onClick={handleClearAllData}>
              Clear All Data
            </Button>
            <p className="text-xs text-muted-foreground">
              This will permanently delete all data. Make sure you have a backup first.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      {showImportDialog ? (
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="w-[90vw] max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Restore from Backup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="importFile">Select Backup File (JSON)</Label>
                <Input
                  id="importFile"
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{"⚠️"} This will replace all current data with the backup data.</p>
                <p>Make sure to create a backup of your current data first.</p>
              </div>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImportData} disabled={!importFile || isProcessing}>
                  {isProcessing ? "Importing..." : "Import Data"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}

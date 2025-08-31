"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLiveData } from "@/hooks/use-live-data"
import { calculateOutstanding } from "@/utils/calculations"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import { StudentForm } from "@/components/forms/student-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, ArrowLeft } from "lucide-react"
import type { Student } from "@/types"

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { students, payments, settings, refreshData } = useLiveData()
  const [student, setStudent] = useState<Student | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const studentId = params.id as string

  useEffect(() => {
    const foundStudent = students.find((s) => s.id === studentId)
    setStudent(foundStudent || null)
  }, [students, studentId])

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Student not found</p>
        </div>
      </div>
    )
  }

  const studentPayments = payments.filter((p) => p.studentId === student.id)
  const outstanding = calculateOutstanding(student, payments)

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Details
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Edit Student</h1>
          <p className="text-muted-foreground">Update student information and fee assignments</p>
        </div>
        <StudentForm
          student={student}
          onSuccess={() => {
            setIsEditing(false)
            refreshData()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-muted-foreground">
              Student ID: {student.studentId} • Grade: {student.grade}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Student
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrollment Date:</span>
                  <span>{formatDate(student.enrollmentDate, settings?.dateFormat)}</span>
                </div>
                {student.contactPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{student.contactPhone}</span>
                  </div>
                )}
                {student.contactEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{student.contactEmail}</span>
                  </div>
                )}
                {student.guardianName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guardian:</span>
                    <span>{student.guardianName}</span>
                  </div>
                )}
                {student.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-sm">{student.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fees:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      student.assignedFees.reduce((sum, fee) => sum + fee.amount, 0),
                      settings?.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      studentPayments.reduce((sum, payment) => sum + payment.amount, 0),
                      settings?.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outstanding:</span>
                  <span className={`font-medium ${outstanding > 0 ? "text-destructive" : "text-green-600"}`}>
                    {formatCurrency(outstanding, settings?.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Count:</span>
                  <span>{studentPayments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Fees</CardTitle>
            </CardHeader>
            <CardContent>
              {student.assignedFees.length === 0 ? (
                <p className="text-muted-foreground">No fees assigned</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.assignedFees.map((fee) => {
                      const totalPaid = fee.paymentsApplied.reduce((sum, p) => sum + p.amount, 0)
                      return (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.title}</TableCell>
                          <TableCell>{formatCurrency(fee.amount, settings?.currency)}</TableCell>
                          <TableCell>
                            {fee.dueDate ? formatDate(fee.dueDate, settings?.dateFormat) : "No due date"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                fee.status === "paid"
                                  ? "default"
                                  : fee.status === "partial"
                                    ? "secondary"
                                    : fee.status === "overdue"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {fee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(totalPaid, settings?.currency)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {studentPayments.length === 0 ? (
                <p className="text-muted-foreground">No payments recorded</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Applied To</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentPayments
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date, settings?.dateFormat)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount, settings?.currency)}
                          </TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>
                            {payment.appliedTo.length > 0 ? (
                              <div className="space-y-1">
                                {payment.appliedTo.map((application, index) => {
                                  const fee = student.assignedFees.find((f) => f.id === application.feeLineId)
                                  return (
                                    <div key={index} className="text-sm">
                                      {fee?.title}: {formatCurrency(application.amount, settings?.currency)}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not applied</span>
                            )}
                          </TableCell>
                          <TableCell>{payment.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

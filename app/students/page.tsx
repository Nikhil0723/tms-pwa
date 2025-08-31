"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useLiveData } from "@/hooks/use-live-data"
import { storage } from "@/lib/storage"
import { formatDate } from "@/utils/date"
import { calculateOutstanding } from "@/utils/calculations"
import { formatCurrency } from "@/utils/currency"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Edit, Trash2, UserPlus, Users } from "lucide-react"
import type { Student } from "@/types"
import { StudentForm } from "@/components/forms/student-form"
import { useConfirm } from "@/components/confirm/confirm-provider"

export default function StudentsPage() {
  const { students, payments, settings, refreshData } = useLiveData()
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("list")
  const confirmDialog = useConfirm()
  const [debounced, setDebounced] = useState(searchTerm)
  const [pageSize, setPageSize] = useState<number>(50)
  const [page, setPage] = useState<number>(1)

  // Get unique grades for filter
  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => (s.grade || "").trim()).filter((g) => g.length > 0))).sort(),
    [students],
  )

  // simple inline debounce
  // NOTE: this is inside component but stable enough for local usage
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useMemo(() => {
    const id = setTimeout(() => setDebounced(searchTerm), 250)
    return () => clearTimeout(id)
  }, [searchTerm])

  // Filter students
  const filteredStudents = useMemo(() => {
    const q = debounced.toLowerCase()
    return students.filter((student) => {
      const matchesSearch =
        student.firstName.toLowerCase().includes(q) ||
        student.lastName.toLowerCase().includes(q) ||
        student.studentId.toLowerCase().includes(q)

      const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter
      const matchesStatus = statusFilter === "all" || student.status === statusFilter

      return matchesSearch && matchesGrade && matchesStatus
    })
  }, [students, debounced, gradeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize))
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, page, pageSize])

  // reset page on filter change
  useMemo(() => {
    setPage(1)
  }, [debounced, gradeFilter, statusFilter])

  const handleDeleteStudent = async (studentId: string) => {
    const ok = await confirmDialog({
      title: "Delete student?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      mode: "confirm",
    })
    if (!ok) return
    storage.deleteStudent(studentId)
    refreshData()
  }

  const getPaymentStatus = (student: Student) => {
    const outstanding = calculateOutstanding(student, payments)
    if (outstanding === 0) return "paid"
    if (outstanding > 0 && payments.some((p) => p.studentId === student.id)) return "partial"
    return "unpaid"
  }

  const handleStudentCreated = () => {
    setActiveTab("list")
    refreshData()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student records and enrollment</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "list" && (
            <Button onClick={() => setActiveTab("form")} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for list and form views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students List
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{students.length}</div>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{students.filter((s) => s.status === "active").length}</div>
                <p className="text-sm text-muted-foreground">Active Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{grades.length}</div>
                <p className="text-sm text-muted-foreground">Grade Levels</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {students.filter((s) => getPaymentStatus(s) === "unpaid").length}
                </div>
                <p className="text-sm text-muted-foreground">Unpaid Students</p>
              </CardContent>
            </Card>
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
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Students ({filteredStudents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No students found</p>
                  {students.length === 0 && (
                    <Button onClick={() => setActiveTab("form")} className="mt-4">
                      Add your first student
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 pb-3">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredStudents.length)} of{" "}
                      {filteredStudents.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                        <SelectTrigger className="w-[110px]">
                          <SelectValue placeholder="Page size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                          <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Prev
                        </Button>
                        <span className="text-sm px-2">
                          Page {page} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Outstanding</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedStudents.map((student) => {
                          const outstanding = calculateOutstanding(student, payments)
                          const paymentStatus = getPaymentStatus(student)

                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {student.firstName} {student.lastName}
                                  </div>
                                  {student.contactEmail && (
                                    <div className="text-sm text-muted-foreground">{student.contactEmail}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{student.studentId}</TableCell>
                              <TableCell>{student.grade}</TableCell>
                              <TableCell>
                                <Badge variant={student.status === "active" ? "default" : "secondary"}>
                                  {student.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    paymentStatus === "paid"
                                      ? "default"
                                      : paymentStatus === "partial"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {paymentStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(outstanding, settings?.currency)}</TableCell>
                              <TableCell>{formatDate(student.enrollmentDate, settings?.dateFormat)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/students/${student.id}`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-sm px-2">
                      Page {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Student</CardTitle>
              <p className="text-muted-foreground">
                Create a new student record and assign multiple fees from templates
              </p>
            </CardHeader>
            <CardContent>
              <StudentForm onSuccess={handleStudentCreated} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

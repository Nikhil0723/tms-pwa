"use client"

import { useState, useMemo } from "react"
import { useLiveData } from "@/hooks/use-live-data"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import { calculateOutstanding } from "@/utils/calculations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search, Filter, DollarSign, Calendar, CreditCard } from "lucide-react"
import { PaymentForm } from "@/components/forms/payment-form"

export default function PaymentsPage() {
  const { students, payments, settings, refreshData } = useLiveData()
  const [searchTerm, setSearchTerm] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [pageSize, setPageSize] = useState<number>(50)
  const [page, setPage] = useState<number>(1)

  // Get unique payment methods
  const paymentMethods = Array.from(new Set(payments.map((p) => p.method))).sort()

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout | null = null
    const debounced = (term: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => setSearchTerm(term), 250)
    }
    return debounced
  }, [])

  const filteredPayments = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return payments.filter((payment) => {
      const student = students.find((s) => s.id === payment.studentId)
      const studentName = student ? `${student.firstName} ${student.lastName}` : ""

      const matchesSearch =
        studentName.toLowerCase().includes(q) ||
        payment.method.toLowerCase().includes(q) ||
        (payment.notes && payment.notes.toLowerCase().includes(q))

      const matchesMethod = methodFilter === "all" || payment.method === methodFilter

      let matchesDate = true
      if (dateFilter !== "all") {
        const paymentDate = new Date(payment.date)
        const now = new Date()

        switch (dateFilter) {
          case "today":
            matchesDate = paymentDate.toDateString() === now.toDateString()
            break
          case "week":
            matchesDate = paymentDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case "month":
            matchesDate = paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
            break
          case "year":
            matchesDate = paymentDate.getFullYear() === now.getFullYear()
            break
        }
      }

      return matchesSearch && matchesMethod && matchesDate
    })
  }, [payments, students, searchTerm, methodFilter, dateFilter])

  const sortedPayments = useMemo(
    () => [...filteredPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredPayments],
  )

  const totalPages = Math.max(1, Math.ceil(sortedPayments.length / pageSize))
  const pagedPayments = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedPayments.slice(start, start + pageSize)
  }, [sortedPayments, page, pageSize])

  useMemo(() => {
    setPage(1)
  }, [searchTerm, methodFilter, dateFilter])

  const handlePaymentSuccess = () => {
    setIsPaymentFormOpen(false)
    refreshData()
  }

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return "default"
      case "card":
        return "secondary"
      case "bank":
        return "outline"
      case "check":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Record and manage student payments</p>
        </div>
        <Button onClick={() => setIsPaymentFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                sortedPayments.reduce((sum, payment) => sum + payment.amount, 0),
                settings?.currency,
              )}
            </div>
            <p className="text-xs text-muted-foreground">{sortedPayments.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                sortedPayments
                  .filter((p) => new Date(p.date).toDateString() === new Date().toDateString())
                  .reduce((sum, payment) => sum + payment.amount, 0),
                settings?.currency,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {sortedPayments.filter((p) => new Date(p.date).toDateString() === new Date().toDateString()).length}{" "}
              payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                students.reduce((sum, student) => sum + calculateOutstanding(student, payments), 0),
                settings?.currency,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Across all students</p>
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
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History ({sortedPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payments found</p>
              {payments.length === 0 && (
                <Button onClick={() => setIsPaymentFormOpen(true)} className="mt-4">
                  Record your first payment
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 pb-3">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedPayments.length)} of{" "}
                  {sortedPayments.length}
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
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Applied To</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedPayments.map((payment) => {
                      const student = students.find((s) => s.id === payment.studentId)

                      return (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date, settings?.dateFormat)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {student ? `${student.firstName} ${student.lastName}` : "Unknown Student"}
                              </div>
                              {student && (
                                <div className="text-sm text-muted-foreground">
                                  {student.studentId} • {student.grade}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(payment.amount, settings?.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getMethodColor(payment.method)}>{payment.method}</Badge>
                          </TableCell>
                          <TableCell>
                            {payment.appliedTo.length > 0 ? (
                              <div className="space-y-1">
                                {payment.appliedTo.map((application, index) => {
                                  const fee = student?.assignedFees.find((f) => f.id === application.feeLineId)
                                  return (
                                    <div key={index} className="text-sm">
                                      {fee?.title || "Unknown Fee"}:{" "}
                                      {formatCurrency(application.amount, settings?.currency)}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not applied</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate" title={payment.notes}>
                              {payment.notes || "-"}
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

      {/* Payment Form Dialog */}
      <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm onSuccess={handlePaymentSuccess} onCancel={() => setIsPaymentFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

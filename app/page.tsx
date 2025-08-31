"use client";

import { useLiveData } from "@/hooks/use-live-data";
import { calculateOutstanding } from "@/utils/calculations";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Calendar,
  Percent,
  Target,
  SquareArrowOutUpRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

const CollectionTrendChart = dynamic(
  () =>
    import("@/components/charts/collection-trend-chart").then((m) => ({
      default: m.CollectionTrendChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Collection Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    ),
  }
);

const FeeCategoryChart = dynamic(
  () =>
    import("@/components/charts/fee-category-chart").then((m) => ({
      default: m.FeeCategoryChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Fee Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    ),
  }
);

const OutstandingByGradeChart = dynamic(
  () =>
    import("@/components/charts/outstanding-by-grade-chart").then((m) => ({
      default: m.OutstandingByGradeChart,
    })),
  {
    ssr: false,
    loading: () => (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Outstanding by Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    ),
  }
);

export default function Dashboard() {
  const { students, payments, feeTemplates, settings } = useLiveData();

  // Calculate KPIs
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "active").length;

  const totalCollected = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const totalOutstanding = students.reduce((sum, student) => {
    return sum + calculateOutstanding(student, payments);
  }, 0);

  const overdueCount = students.filter((student) => {
    return student.assignedFees.some(
      (fee) =>
        fee.dueDate &&
        new Date(fee.dueDate) < new Date() &&
        fee.status !== "paid"
    );
  }).length;

  const totalFees = students.reduce((sum, student) => {
    return (
      sum + student.assignedFees.reduce((feeSum, fee) => feeSum + fee.amount, 0)
    );
  }, 0);

  const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;

  const thisMonthPayments = payments.filter((p) => {
    const paymentDate = new Date(p.date);
    const now = new Date();
    return (
      paymentDate.getMonth() === now.getMonth() &&
      paymentDate.getFullYear() === now.getFullYear()
    );
  });

  const thisMonthCollected = thisMonthPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const lastMonthPayments = payments.filter((p) => {
    const paymentDate = new Date(p.date);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return (
      paymentDate.getMonth() === lastMonth.getMonth() &&
      paymentDate.getFullYear() === lastMonth.getFullYear()
    );
  });

  const lastMonthCollected = lastMonthPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const monthlyGrowth =
    lastMonthCollected > 0
      ? ((thisMonthCollected - lastMonthCollected) / lastMonthCollected) * 100
      : 0;

  const averageFeePerStudent =
    totalStudents > 0 ? totalFees / totalStudents : 0;
  const averagePaymentAmount =
    payments.length > 0 ? totalCollected / payments.length : 0;

  const currency = settings?.currency || "USD";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your tuition management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Link
                href="/students"
                prefetch={false}
                className="md:hidden lg:flex"
              >
                <SquareArrowOutUpRight
                  className="h-4 w-4 text-muted-foreground"
                  aria-label="Go to Students"
                />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {activeStudents} active • {totalStudents - activeStudents}{" "}
              inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collected
            </CardTitle>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Link
                href="/payments"
                prefetch={false}
                className="md:hidden lg:flex"
              >
                <SquareArrowOutUpRight
                  className="h-4 w-4 text-muted-foreground"
                  aria-label="Go to Payments"
                />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCollected, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.length} payments • Avg:{" "}
              {formatCurrency(averagePaymentAmount, currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Link
                href="/invoices"
                prefetch={false}
                className="md:hidden lg:flex"
              >
                <SquareArrowOutUpRight
                  className="h-4 w-4 text-muted-foreground"
                  aria-label="Go to Invoices"
                />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalOutstanding, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(collectionRate)}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <Link
                href="/invoices"
                prefetch={false}
                className="md:hidden lg:flex"
              >
                <SquareArrowOutUpRight
                  className="h-4 w-4 text-muted-foreground"
                  aria-label="Go to Invoices"
                />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0
                ? Math.round((overdueCount / totalStudents) * 100)
                : 0}
              % of students
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(thisMonthCollected, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyGrowth >= 0 ? "+" : ""}
              {monthlyGrowth.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Collection Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collectionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalCollected, currency)} of{" "}
              {formatCurrency(totalFees, currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Fee/Student
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageFeePerStudent, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {feeTemplates.length} fee templates
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CollectionTrendChart payments={payments} settings={settings!} />
        <FeeCategoryChart students={students} settings={settings!} />
      </div>

      <OutstandingByGradeChart
        students={students}
        payments={payments}
        settings={settings!}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {payments
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .slice(0, 5)
                  .map((payment) => {
                    const student = students.find(
                      (s) => s.id === payment.studentId
                    );
                    const daysAgo = Math.floor(
                      (Date.now() - new Date(payment.date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <div
                        key={payment.id}
                        className="flex justify-between items-start p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {student
                              ? `${student.firstName} ${student.lastName}`
                              : "Unknown Student"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {payment.method}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {daysAgo === 0
                                ? "Today"
                                : daysAgo === 1
                                ? "Yesterday"
                                : `${daysAgo} days ago`}
                            </span>
                          </div>
                          {payment.appliedTo.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Applied to {payment.appliedTo.length} fee
                              {payment.appliedTo.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(payment.amount, currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(payment.date, settings?.dateFormat)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Payment Methods</p>
                  <p className="text-sm text-muted-foreground">
                    Most popular method
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const methodCounts = payments.reduce((acc, p) => {
                      acc[p.method] = (acc[p.method] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const topMethod = Object.entries(methodCounts).sort(
                      ([, a], [, b]) => b - a
                    )[0];
                    return (
                      <div>
                        <Badge>{topMethod?.[0] || "None"}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {topMethod?.[1] || 0} payments
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Grade Distribution</p>
                  <p className="text-sm text-muted-foreground">
                    Students by grade
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const gradeCounts = students.reduce((acc, s) => {
                      acc[s.grade] = (acc[s.grade] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const topGrade = Object.entries(gradeCounts).sort(
                      ([, a], [, b]) => b - a
                    )[0];
                    return (
                      <div>
                        <Badge variant="outline">
                          {topGrade?.[0] || "None"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {topGrade?.[1] || 0} students
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Collection Efficiency</p>
                  <p className="text-sm text-muted-foreground">
                    Avg days to payment
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const paidFees = students.flatMap((s) =>
                      s.assignedFees.filter(
                        (f) => f.status === "paid" && f.dueDate
                      )
                    );
                    if (paidFees.length === 0)
                      return <Badge variant="outline">No data</Badge>;

                    const avgDays =
                      paidFees.reduce((sum, fee) => {
                        const dueDate = new Date(fee.dueDate!);
                        const payments = fee.paymentsApplied;
                        if (payments.length === 0) return sum;

                        // Find the payment that completed this fee
                        const payment = payments[payments.length - 1]; // Last payment
                        const paymentDate = new Date(
                          payments.find(
                            (p) => p.paymentId === payment.paymentId
                          )?.paymentId || fee.createdAt
                        );
                        const daysDiff = Math.floor(
                          (paymentDate.getTime() - dueDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return sum + Math.max(0, daysDiff);
                      }, 0) / paidFees.length;

                    return (
                      <div>
                        <Badge
                          variant={
                            avgDays <= 7
                              ? "default"
                              : avgDays <= 30
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {Math.round(avgDays)} days
                        </Badge>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

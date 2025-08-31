"use client"

import { useMemo } from "react"
import { calculateOutstanding } from "@/utils/calculations"
import { formatCurrency } from "@/utils/currency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { AlertTriangle, Users } from "lucide-react"
import type { Student, Payment, Settings } from "@/types"

interface OutstandingByGradeChartProps {
  students: Student[]
  payments: Payment[]
  settings: Settings
}

export function OutstandingByGradeChart({ students, payments, settings }: OutstandingByGradeChartProps) {
  const currency = settings?.currency || "USD"

  const chartData = useMemo(() => {
    const gradeData = new Map<string, { outstanding: number; count: number }>()

    students
      .filter((student) => student.status === "active")
      .forEach((student) => {
        const outstanding = calculateOutstanding(student, payments)
        if (outstanding > 0) {
          const existing = gradeData.get(student.grade) || { outstanding: 0, count: 0 }
          gradeData.set(student.grade, {
            outstanding: existing.outstanding + outstanding,
            count: existing.count + 1,
          })
        }
      })

    return Array.from(gradeData.entries())
      .map(([grade, data]) => ({
        grade,
        outstanding: data.outstanding,
        count: data.count,
        average: data.outstanding / data.count,
        color: data.outstanding > 10000 ? "#ef4444" : data.outstanding > 5000 ? "#f59e0b" : "#10b981",
      }))
      .sort((a, b) => {
        const aNum = Number.parseInt(a.grade) || (a.grade === "K" ? 0 : 999)
        const bNum = Number.parseInt(b.grade) || (b.grade === "K" ? 0 : 999)
        return aNum - bNum
      })
  }, [students, payments])

  const totalOutstanding = chartData.reduce((sum, item) => sum + item.outstanding, 0)
  const totalStudents = chartData.reduce((sum, item) => sum + item.count, 0)
  const highestGrade = chartData.reduce(
    (max, item) => (item.outstanding > max.outstanding ? item : max),
    chartData[0] || { outstanding: 0, grade: "N/A" },
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <p className="font-semibold text-foreground">Grade {label}</p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-destructive">{formatCurrency(data.outstanding, currency)}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {data.count} student{data.count !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Avg: {formatCurrency(data.average, currency)}</p>
          </div>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Outstanding Balances by Grade</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              All Clear
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[320px] text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-foreground">No Outstanding Balances!</p>
            <p className="text-muted-foreground">All students have paid their fees</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Outstanding by Grade
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardTitle>
          <Badge variant="destructive">
            {totalStudents} student{totalStudents !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Total outstanding:{" "}
            <strong className="text-destructive">{formatCurrency(totalOutstanding, currency)}</strong>
          </span>
          <span>
            Highest: <strong className="text-foreground">Grade {highestGrade.grade}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="grade"
              className="text-muted-foreground"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              className="text-muted-foreground"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatCurrency(value, currency, true)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="outstanding" radius={[6, 6, 0, 0]} stroke="hsl(var(--border))">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

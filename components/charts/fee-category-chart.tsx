"use client"

import { useMemo } from "react"
import { formatCurrency } from "@/utils/currency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { Student, Settings } from "@/types"

interface FeeCategoryChartProps {
  students: Student[]
  settings: Settings
}

const CATEGORY_COLORS = {
  tuition: "#3b82f6",
  exam: "#10b981",
  transport: "#f59e0b",
  library: "#8b5cf6",
  sports: "#ef4444",
  misc: "#6b7280",
}

export function FeeCategoryChart({ students, settings }: FeeCategoryChartProps) {
  const currency = settings?.currency || "USD"

  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    students.forEach((student) => {
      student.assignedFees.forEach((fee) => {
        const title = fee.title.toLowerCase()
        let category = "misc"

        if (title.includes("tuition")) category = "tuition"
        else if (title.includes("exam")) category = "exam"
        else if (title.includes("transport") || title.includes("bus")) category = "transport"
        else if (title.includes("library") || title.includes("book")) category = "library"
        else if (title.includes("sport") || title.includes("activity")) category = "sports"

        categoryTotals[category] = (categoryTotals[category] || 0) + fee.amount
      })
    })

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)

    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([category, amount]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: amount,
        percentage: ((amount / total) * 100).toFixed(1),
        color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.misc,
      }))
      .sort((a, b) => b.value - a.value)
  }, [students])

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0)
  const topCategory = chartData[0]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
            <p className="font-semibold text-foreground">{data.name}</p>
          </div>
          <p className="text-lg font-bold text-primary">{formatCurrency(data.value, currency)}</p>
          <p className="text-sm text-muted-foreground">{data.percentage}% of total fees</p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (Number.parseFloat(percentage) < 5) return null // Hide labels for small slices

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage}%`}
      </text>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[320px] text-muted-foreground">No fee data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fee Categories</CardTitle>
          <Badge variant="outline">
            {chartData.length} categor{chartData.length !== 1 ? "ies" : "y"}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Total fees: <strong className="text-foreground">{formatCurrency(totalAmount, currency)}</strong>
          </span>
          {topCategory && (
            <span>
              Top:{" "}
              <strong className="text-foreground">
                {topCategory.name} ({topCategory.percentage}%)
              </strong>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="font-medium ml-auto">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

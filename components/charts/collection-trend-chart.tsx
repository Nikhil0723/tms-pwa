"use client"

import { useMemo } from "react"
import { formatCurrency } from "@/utils/currency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import type { Payment, Settings } from "@/types"

interface CollectionTrendChartProps {
  payments: Payment[]
  settings: Settings
}

export function CollectionTrendChart({ payments, settings }: CollectionTrendChartProps) {
  const currency = settings?.currency || "USD"

  const chartData = useMemo(() => {
    const now = new Date()
    const months = []

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      const monthPayments = payments.filter((payment) => {
        const paymentDate = new Date(payment.date)
        return paymentDate.getFullYear() === date.getFullYear() && paymentDate.getMonth() === date.getMonth()
      })

      const totalAmount = monthPayments.reduce((sum, payment) => sum + payment.amount, 0)

      months.push({
        month: monthName,
        amount: totalAmount,
        count: monthPayments.length,
        shortMonth: date.toLocaleDateString("en-US", { month: "short" }),
      })
    }

    return months
  }, [payments])

  const totalCollection = chartData.reduce((sum, month) => sum + month.amount, 0)
  const avgMonthly = totalCollection / 12
  const lastMonth = chartData[chartData.length - 1]?.amount || 0
  const prevMonth = chartData[chartData.length - 2]?.amount || 0
  const monthlyChange = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0
  const isPositiveTrend = monthlyChange >= 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-xl">
          <p className="font-semibold text-foreground">{label}</p>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">{formatCurrency(payload[0].value, currency)}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {payload[0].payload.count} payment{payload[0].payload.count !== 1 ? "s" : ""}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Collection Trend</CardTitle>
          <Badge variant={isPositiveTrend ? "default" : "destructive"} className="gap-1">
            {isPositiveTrend ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {monthlyChange >= 0 ? "+" : ""}
            {monthlyChange.toFixed(1)}%
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            12-month total: <strong className="text-foreground">{formatCurrency(totalCollection, currency)}</strong>
          </span>
          <span>
            Monthly avg: <strong className="text-foreground">{formatCurrency(avgMonthly, currency)}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="shortMonth"
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
            <Area
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#collectionGradient)"
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 3, fill: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

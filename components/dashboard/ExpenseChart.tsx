'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Expense, ChartData, DateSelection } from '@/types'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

const COLORS = [
  '#667eea', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
]

interface ExpenseChartProps {
  selectedDate?: DateSelection
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ selectedDate }) => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [timeRange, setTimeRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const currentDate = selectedDate || {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  }

  useEffect(() => {
    if (user) {
      fetchExpenseData()
    }
  }, [user, timeRange, selectedDate])

  const fetchExpenseData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const date = new Date(currentDate.year, currentDate.month)
      let startDate: Date
      let endDate: Date

      if (timeRange === 'week') {
        startDate = startOfWeek(date)
        endDate = endOfWeek(date)
      } else {
        startDate = startOfMonth(date)
        endDate = endOfMonth(date)
      }

      // Fetch all expenses for the user
      const expensesRef = collection(db, 'expenses')
      const q = query(
        expensesRef,
        where('userId', '==', user.uid)
      )

      const querySnapshot = await getDocs(q)
      const expenses: Expense[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const expenseDate = new Date(data.date)
        
        // Filter expenses by date range
        if (expenseDate >= startDate && expenseDate <= endDate) {
          expenses.push({ id: doc.id, ...data } as Expense)
        }
      })

      // Group expenses by category
      const categoryTotals: { [key: string]: number } = {}
      let total = 0
      
      expenses.forEach((expense) => {
        if (categoryTotals[expense.category]) {
          categoryTotals[expense.category] += expense.amount
        } else {
          categoryTotals[expense.category] = expense.amount
        }
        total += expense.amount
      })

      setTotalAmount(Math.round(total * 100) / 100)

      // Convert to chart data format
      const data: ChartData[] = Object.entries(categoryTotals)
        .map(([name, value], index) => ({
          name,
          value: Math.round(value * 100) / 100,
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)

      setChartData(data)
    } catch (error: any) {
      console.error('Error fetching expense data:', error)
      setError('Failed to load expense data')
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / totalAmount) * 100).toFixed(1)
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: 2,
            p: 1.5,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: payload[0].payload.color }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2">
            ₹{payload[0].value.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {percentage}% of total
          </Typography>
        </Box>
      )
    }
    return null
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (percent < 0.05) return null // Don't show label for small segments
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={isMobile ? 10 : 12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? 250 : 300 }}>
        <CircularProgress sx={{ color: '#667eea' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? 250 : 300 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const monthYearLabel = format(new Date(currentDate.year, currentDate.month), 'MMMM yyyy')

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: isMobile ? 1 : 2,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
            Expense Breakdown
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {timeRange === 'week' ? 'This Week' : monthYearLabel}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 120 }}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            displayEmpty
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e5e7eb',
              },
            }}
          >
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">Full Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {chartData.length > 0 ? (
        <>
          {/* Total Display */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
              ₹{totalAmount.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Spent
            </Typography>
          </Box>

          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={isMobile ? 70 : 90}
                innerRadius={isMobile ? 40 : 50}
                fill="#8884d8"
                dataKey="value"
                stroke="white"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <Box sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'center',
            mt: 1,
          }}>
            {chartData.slice(0, 6).map((entry, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: '#f8fafc',
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: entry.color,
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {entry.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: isMobile ? 250 : 300,
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h4">📊</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
            No expenses found for this period
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Add some expenses to see your spending breakdown
          </Typography>
        </Box>
      )}
    </Box>
  )
}

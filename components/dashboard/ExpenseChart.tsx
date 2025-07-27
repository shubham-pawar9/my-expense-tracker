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
import { Expense, ChartData } from '@/types'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

export const ExpenseChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [timeRange, setTimeRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (user) {
      fetchExpenseData()
    }
  }, [user, timeRange])

  const fetchExpenseData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const now = new Date()
      let startDate: Date
      let endDate: Date

      if (timeRange === 'week') {
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
      } else {
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
      }

      // Fetch all expenses for the user (we'll filter by date in JavaScript)
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
        
        // Filter expenses by date range in JavaScript
        if (expenseDate >= startDate && expenseDate <= endDate) {
          expenses.push({ id: doc.id, ...data } as Expense)
        }
      })

      // Group expenses by category
      const categoryTotals: { [key: string]: number } = {}
      expenses.forEach((expense) => {
        if (categoryTotals[expense.category]) {
          categoryTotals[expense.category] += expense.amount
        } else {
          categoryTotals[expense.category] = expense.amount
        }
      })

      // Convert to chart data format
      const data: ChartData[] = Object.entries(categoryTotals).map(([name, value], index) => ({
        name,
        value: Math.round(value * 100) / 100, // Round to 2 decimal places
        color: COLORS[index % COLORS.length],
      }))

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
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2">
            ₹{payload[0].value.toFixed(2)}
          </Typography>
        </Box>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? 250 : 300 }}>
        <CircularProgress />
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
        <Typography variant="h6" sx={{ fontSize: isMobile ? '0.8rem' : '1rem' }}>
          Expense Breakdown
        </Typography>
        <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 120 }}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            displayEmpty
          >
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={isMobile ? 60 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {!isMobile && <Legend />}
          </PieChart>
        </ResponsiveContainer>
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
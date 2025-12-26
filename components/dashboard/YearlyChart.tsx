'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Area,
} from 'recharts'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { MonthlyChartData } from '@/types'
import {
  startOfYear,
  endOfYear,
  format,
  eachMonthOfInterval,
  isSameMonth,
} from 'date-fns'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const YearlyChart: React.FC = () => {
  const [chartData, setChartData] = useState<MonthlyChartData[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fixedExpenses, setFixedExpenses] = useState(0)
  const [yearTotal, setYearTotal] = useState(0)
  const [avgMonthly, setAvgMonthly] = useState(0)
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    if (user) {
      fetchYearlyData()
    }
  }, [user, selectedYear])

  const fetchYearlyData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Fetch fixed expenses from user settings (default to 5000)
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      let userFixedExpenses = 5000 // Default fixed expense
      if (userDoc.exists()) {
        userFixedExpenses = userDoc.data().fixedExpenses || 5000
      }
      setFixedExpenses(userFixedExpenses)

      const startDate = startOfYear(new Date(selectedYear, 0))
      const endDate = endOfYear(new Date(selectedYear, 0))
      const months = eachMonthOfInterval({ start: startDate, end: endDate })

      // Fetch all expenses for the user
      const expensesRef = collection(db, 'expenses')
      const q = query(expensesRef, where('userId', '==', user.uid))
      const querySnapshot = await getDocs(q)

      // Group expenses by month
      const monthlyTotals: { [key: string]: number } = {}
      MONTH_NAMES.forEach(month => {
        monthlyTotals[month] = 0
      })

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const expenseDate = new Date(data.date)
        
        if (expenseDate.getFullYear() === selectedYear) {
          const monthName = MONTH_NAMES[expenseDate.getMonth()]
          monthlyTotals[monthName] += data.amount || 0
        }
      })

      // Create chart data
      const data: MonthlyChartData[] = MONTH_NAMES.map((month) => ({
        month,
        total: Math.round((monthlyTotals[month] + userFixedExpenses) * 100) / 100,
        fixed: userFixedExpenses,
        variable: Math.round(monthlyTotals[month] * 100) / 100,
      }))

      setChartData(data)
      
      // Calculate statistics
      const totalExpenses = data.reduce((sum, item) => sum + item.total, 0)
      setYearTotal(Math.round(totalExpenses * 100) / 100)
      
      const currentMonth = new Date().getMonth()
      const monthsWithData = selectedYear === new Date().getFullYear() ? currentMonth + 1 : 12
      setAvgMonthly(Math.round((totalExpenses / monthsWithData) * 100) / 100)

    } catch (error: any) {
      console.error('Error fetching yearly data:', error)
      setError('Failed to load yearly data')
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {label} {selectedYear}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#8b5cf6' }}>
              Variable: ₹{payload[0]?.value?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" sx={{ color: '#06b6d4' }}>
              Fixed: ₹{payload[1]?.value?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5, borderTop: '1px solid #eee', pt: 0.5 }}>
              Total: ₹{((payload[0]?.value || 0) + (payload[1]?.value || 0)).toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? 300 : 400 }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0,
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📊 Yearly Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your spending trends throughout the year
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value as number)}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Stats Summary */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 3,
        flexWrap: 'wrap',
      }}>
        <Chip
          label={`Year Total: ₹${yearTotal.toLocaleString()}`}
          sx={{
            bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            px: 1,
          }}
        />
        <Chip
          label={`Monthly Avg: ₹${avgMonthly.toLocaleString()}`}
          sx={{
            bgcolor: '#10b981',
            color: 'white',
            fontWeight: 600,
            px: 1,
          }}
        />
        <Chip
          label={`Fixed/Month: ₹${fixedExpenses.toLocaleString()}`}
          sx={{
            bgcolor: '#06b6d4',
            color: 'white',
            fontWeight: 600,
            px: 1,
          }}
        />
      </Box>

      <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: isMobile ? 10 : 30,
            left: isMobile ? -10 : 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            stroke="#666"
          />
          <YAxis
            tick={{ fontSize: isMobile ? 10 : 12 }}
            stroke="#666"
            tickFormatter={(value) => `₹${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: isMobile ? '12px' : '14px',
            }}
          />
          <Bar
            dataKey="variable"
            name="Variable Expenses"
            stackId="a"
            fill="#8b5cf6"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="fixed"
            name="Fixed Expenses"
            stackId="a"
            fill="#06b6d4"
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  )
}


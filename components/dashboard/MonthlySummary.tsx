'use client'

import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { DateSelection } from '@/types'

interface MonthlySummaryProps {
  selectedDate?: DateSelection
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ selectedDate }) => {
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [fixedExpenses, setFixedExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const currentDate = selectedDate || {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  }

  useEffect(() => {
    if (user) {
      fetchMonthlyData()
    }
  }, [user, selectedDate])

  const fetchMonthlyData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const date = new Date(currentDate.year, currentDate.month)
      const startDate = startOfMonth(date)
      const endDate = endOfMonth(date)

      // Fetch all expenses for the user
      const expensesRef = collection(db, 'expenses')
      const expensesQuery = query(
        expensesRef,
        where('userId', '==', user.uid)
      )

      const expensesSnapshot = await getDocs(expensesQuery)
      let total = 0
      
      expensesSnapshot.forEach((doc) => {
        const data = doc.data()
        const expenseDate = new Date(data.date)
        
        // Filter expenses for selected month
        if (expenseDate >= startDate && expenseDate <= endDate) {
          total += data.amount || 0
        }
      })
      
      setTotalExpenses(Math.round(total * 100) / 100)

      // Fetch user settings for monthly income and fixed expenses
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setMonthlyIncome(userData.monthlyIncome || 0)
          // Default to 5000 if no fixed expenses are set
          setFixedExpenses(userData.fixedExpenses || 5000)
        } else {
          setMonthlyIncome(0)
          setFixedExpenses(5000) // Default fixed expense
        }
      } catch (userError) {
        console.error('Error fetching user settings:', userError)
        setMonthlyIncome(0)
        setFixedExpenses(5000) // Default fixed expense
      }
    } catch (error: any) {
      console.error('Error fetching monthly data:', error)
      setError('Failed to load monthly data')
    } finally {
      setLoading(false)
    }
  }

  const totalWithFixed = totalExpenses + fixedExpenses
  const savings = monthlyIncome - totalWithFixed
  const savingsPercentage = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0

  const monthYearLabel = format(new Date(currentDate.year, currentDate.month), 'MMMM yyyy')

  if (loading) {
    return (
      <Paper sx={{ p: isMobile ? 2 : 3, height: '100%', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? 150 : 200 }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </Paper>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: isMobile ? 2 : 3, height: '100%', borderRadius: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: isMobile ? 2 : 3, height: '100%', borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 600 }}>
        📈 Summary - {monthYearLabel}
      </Typography>
      
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid item xs={12}>
          <Card sx={{ 
            bgcolor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#22c55e', mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  Monthly Income
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ color: '#16a34a', fontWeight: 700, fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                ₹{monthlyIncome.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ 
            bgcolor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ color: '#f59e0b', mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  Variable Expenses
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ color: '#d97706', fontWeight: 700, fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                ₹{totalExpenses.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ 
            bgcolor: '#f3e8ff',
            border: '1px solid #c4b5fd',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RepeatIcon sx={{ color: '#8b5cf6', mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  Fixed Expenses
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ color: '#7c3aed', fontWeight: 700, fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                ₹{fixedExpenses.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Card sx={{ 
            background: savings >= 0 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: 2,
          }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon 
                  sx={{ 
                    color: 'white', 
                    mr: 1,
                    fontSize: isMobile ? '1.2rem' : '1.5rem'
                  }} 
                />
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  {savings >= 0 ? 'Savings' : 'Overspent'}
                </Typography>
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: isMobile ? '1.5rem' : '1.75rem'
                }}
              >
                ₹{Math.abs(savings).toLocaleString()}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  mt: 0.5
                }}
              >
                {savingsPercentage >= 0 ? savingsPercentage.toFixed(1) : Math.abs(savingsPercentage).toFixed(1)}% of income
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Expenses Summary */}
        <Grid item xs={12}>
          <Box sx={{ 
            p: 1.5, 
            bgcolor: '#f8fafc', 
            borderRadius: 2,
            border: '1px dashed #e2e8f0',
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Total Monthly Expenses
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#334155' }}>
              ₹{totalWithFixed.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (Variable + Fixed)
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}

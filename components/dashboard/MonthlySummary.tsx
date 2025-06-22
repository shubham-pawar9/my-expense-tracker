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
} from '@mui/icons-material'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export const MonthlySummary: React.FC = () => {
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (user) {
      fetchMonthlyData()
    }
  }, [user])

  const fetchMonthlyData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const now = new Date()
      const startDate = startOfMonth(now)
      const endDate = endOfMonth(now)

      // Fetch all expenses for the user (we'll filter by date in JavaScript)
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
        
        // Filter expenses for current month in JavaScript
        if (expenseDate >= startDate && expenseDate <= endDate) {
          total += data.amount || 0
        }
      })
      
      setTotalExpenses(Math.round(total * 100) / 100)

      // Fetch user settings for monthly income
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setMonthlyIncome(userData.monthlyIncome || 0)
        } else {
          // Set default income if user settings don't exist
          setMonthlyIncome(5000)
        }
      } catch (userError) {
        console.error('Error fetching user settings:', userError)
        setMonthlyIncome(5000) // Default fallback
      }
    } catch (error: any) {
      console.error('Error fetching monthly data:', error)
      setError('Failed to load monthly data')
    } finally {
      setLoading(false)
    }
  }

  const savings = monthlyIncome - totalExpenses
  const savingsPercentage = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0

  if (loading) {
    return (
      <Paper sx={{ p: isMobile ? 2 : 3, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? 150 : 200 }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: isMobile ? 2 : 3, height: '100%' }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: isMobile ? 2 : 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
        Monthly Summary
      </Typography>
      
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main', mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  Monthly Income
                </Typography>
              </Box>
              <Typography variant="h5" color="success.main" sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                ₹{monthlyIncome.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDownIcon sx={{ color: 'error.main', mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  Total Expenses
                </Typography>
              </Box>
              <Typography variant="h5" color="error.main" sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>
                ₹{totalExpenses.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: isMobile ? 1.5 : 2 }} />
          <Card sx={{ 
            bgcolor: savings >= 0 ? '#e8f5e8' : '#ffebee',
            border: savings >= 0 ? '1px solid #4caf50' : '1px solid #f44336'
          }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon 
                  sx={{ 
                    color: savings >= 0 ? 'success.main' : 'error.main', 
                    mr: 1,
                    fontSize: isMobile ? '1.2rem' : '1.5rem'
                  }} 
                />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
                  Savings
                </Typography>
              </Box>
              <Typography 
                variant="h5" 
                color={savings >= 0 ? 'success.main' : 'error.main'}
                sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}
              >
                ₹{savings.toLocaleString()}
              </Typography>
              <Typography 
                variant="body2" 
                color={savings >= 0 ? 'success.main' : 'error.main'}
                sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
              >
                {savingsPercentage.toFixed(1)}% of income
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  )
} 
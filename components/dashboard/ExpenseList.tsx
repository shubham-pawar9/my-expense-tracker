'use client'

import React, { useState, useEffect } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material'
import { Delete as DeleteIcon, Receipt as ReceiptIcon } from '@mui/icons-material'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Expense, DateSelection } from '@/types'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'Food & Dining': '#ff9800',
    'Transportation': '#2196f3',
    'Entertainment': '#e91e63',
    'Shopping': '#9c27b0',
    'Healthcare': '#f44336',
    'Utilities': '#4caf50',
    'Rent/Mortgage': '#795548',
    'Insurance': '#607d8b',
    'Education': '#3f51b5',
    'Other': '#9e9e9e',
  }
  return colors[category] || '#9e9e9e'
}

interface ExpenseListProps {
  selectedDate?: DateSelection
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ selectedDate }) => {
  const [expenses, setExpenses] = useState<Expense[]>([])
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
      fetchExpenses()
    }
  }, [user, selectedDate])

  const fetchExpenses = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      const date = new Date(currentDate.year, currentDate.month)
      const startDate = startOfMonth(date)
      const endDate = endOfMonth(date)
      
      const expensesRef = collection(db, 'expenses')
      const q = query(
        expensesRef, 
        where('userId', '==', user.uid)
      )
      const querySnapshot = await getDocs(q)
      
      const expensesData: Expense[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const expenseDate = new Date(data.date)
        
        // Filter by selected month
        if (expenseDate >= startDate && expenseDate <= endDate) {
          expensesData.push({ id: doc.id, ...data } as Expense)
        }
      })

      // Sort by date (newest first)
      expensesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setExpenses(expensesData)
    } catch (error: any) {
      console.error('Error fetching expenses:', error)
      setError('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId))
      setExpenses(expenses.filter(expense => expense.id !== expenseId))
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      setError('Failed to delete expense')
    }
  }

  const monthYearLabel = format(new Date(currentDate.year, currentDate.month), 'MMMM yyyy')

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </Paper>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Typography variant="body2" color="text.secondary">
          Try refreshing the page or check your internet connection.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: isMobile ? 2 : 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ReceiptIcon sx={{ color: '#667eea' }} />
        <Typography variant="h6">
          Expenses for {monthYearLabel}
        </Typography>
        <Chip
          label={`${expenses.length} items`}
          size="small"
          sx={{
            ml: 'auto',
            bgcolor: '#667eea',
            color: 'white',
            fontWeight: 600,
          }}
        />
      </Box>
      
      {expenses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <ReceiptIcon sx={{ fontSize: 40, color: '#9ca3af' }} />
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            No expenses found for {monthYearLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add your first expense to start tracking your spending!
          </Typography>
        </Box>
      ) : isMobile ? (
        // Mobile view with cards
        <Grid container spacing={2}>
          {expenses.map((expense) => (
            <Grid item xs={12} key={expense.id}>
              <Card
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {expense.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </Typography>
                      <Chip
                        label={expense.category}
                        size="small"
                        sx={{
                          backgroundColor: getCategoryColor(expense.category),
                          color: 'white',
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        ₹{expense.amount.toFixed(2)}
                      </Typography>
                      <Tooltip title="Delete expense">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExpense(expense.id)}
                          color="error"
                          sx={{ p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // Desktop view with table
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  sx={{
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: '#f8fafc',
                    },
                  }}
                >
                  <TableCell>
                    {format(new Date(expense.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={expense.category}
                      size="small"
                      sx={{
                        backgroundColor: getCategoryColor(expense.category),
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 600, color: '#667eea' }}>
                      ₹{expense.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete expense">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExpense(expense.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

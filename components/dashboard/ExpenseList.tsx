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
} from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Expense } from '@/types'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

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

export const ExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (user) {
      fetchExpenses()
    }
  }, [user])

  const fetchExpenses = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      
      const expensesRef = collection(db, 'expenses')
      const q = query(
        expensesRef, 
        where('userId', '==', user.uid)
      )
      const querySnapshot = await getDocs(q)
      
      const expensesData: Expense[] = []
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() } as Expense)
      })

      // Sort by date (newest first) in JavaScript
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
      toast.success('Expense deleted successfully')
    } catch (error: any) {
      console.error('Error deleting expense:', error)
      setError('Failed to delete expense')
      toast.error('Failed to delete expense')
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Typography variant="body2" color="text.secondary">
          Try refreshing the page or check your internet connection.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h6" gutterBottom>
        Recent Expenses
      </Typography>
      
      {expenses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No expenses found yet.
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
              <Card sx={{ position: 'relative' }}>
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
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        ₹{expense.amount.toFixed(2)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExpense(expense.id)}
                        color="error"
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
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
                    ₹{expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteExpense(expense.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
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
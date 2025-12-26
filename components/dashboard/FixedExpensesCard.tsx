'use client'

import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Repeat as RepeatIcon,
  Home as HomeIcon,
  Wifi as WifiIcon,
  DirectionsCar as CarIcon,
  LocalHospital as HealthIcon,
  School as SchoolIcon,
  Subscriptions as SubscriptionIcon,
} from '@mui/icons-material'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { FixedExpenseItem } from '@/types'

const FIXED_CATEGORIES = [
  { name: 'Rent/Mortgage', icon: HomeIcon, color: '#795548' },
  { name: 'Utilities', icon: WifiIcon, color: '#4caf50' },
  { name: 'Transportation', icon: CarIcon, color: '#2196f3' },
  { name: 'Insurance', icon: HealthIcon, color: '#f44336' },
  { name: 'Education', icon: SchoolIcon, color: '#3f51b5' },
  { name: 'Subscriptions', icon: SubscriptionIcon, color: '#9c27b0' },
  { name: 'Other', icon: RepeatIcon, color: '#9e9e9e' },
]

interface FixedExpensesCardProps {
  onUpdate?: () => void
}

export const FixedExpensesCard: React.FC<FixedExpensesCardProps> = ({ onUpdate }) => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<FixedExpenseItem | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (user) {
      loadFixedExpenses()
    }
  }, [user])

  const loadFixedExpenses = async () => {
    if (!user) return

    try {
      setLoading(true)
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        const items = data.fixedExpenseItems || []
        
        // If no fixed expenses exist, create a default one
        if (items.length === 0) {
          const defaultExpense: FixedExpenseItem = {
            id: 'default-fixed',
            name: 'Monthly Fixed Expenses',
            amount: 5000,
            category: 'Other',
          }
          
          // Save the default expense to database
          await setDoc(doc(db, 'users', user.uid), {
            fixedExpenseItems: [defaultExpense],
            fixedExpenses: 5000,
            updatedAt: new Date(),
          }, { merge: true })
          
          setFixedExpenses([defaultExpense])
        } else {
          setFixedExpenses(items)
        }
      } else {
        // New user - create default fixed expense
        const defaultExpense: FixedExpenseItem = {
          id: 'default-fixed',
          name: 'Monthly Fixed Expenses',
          amount: 5000,
          category: 'Other',
        }
        
        await setDoc(doc(db, 'users', user.uid), {
          fixedExpenseItems: [defaultExpense],
          fixedExpenses: 5000,
          updatedAt: new Date(),
        }, { merge: true })
        
        setFixedExpenses([defaultExpense])
      }
    } catch (error) {
      console.error('Error loading fixed expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = () => {
    setEditingExpense(null)
    setName('')
    setAmount('')
    setCategory('')
    setDialogOpen(true)
  }

  const handleEditExpense = (expense: FixedExpenseItem) => {
    setEditingExpense(expense)
    setName(expense.name)
    setAmount(expense.amount.toString())
    setCategory(expense.category)
    setDialogOpen(true)
  }

  const handleSaveExpense = async () => {
    if (!user || !name || !amount || !category) return

    try {
      setSaving(true)
      
      let updatedExpenses: FixedExpenseItem[]
      
      if (editingExpense) {
        updatedExpenses = fixedExpenses.map(exp =>
          exp.id === editingExpense.id
            ? { ...exp, name, amount: parseFloat(amount), category }
            : exp
        )
      } else {
        const newExpense: FixedExpenseItem = {
          id: Date.now().toString(),
          name,
          amount: parseFloat(amount),
          category,
        }
        updatedExpenses = [...fixedExpenses, newExpense]
      }

      // Calculate total fixed expenses
      const totalFixed = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)

      await setDoc(doc(db, 'users', user.uid), {
        fixedExpenseItems: updatedExpenses,
        fixedExpenses: totalFixed,
        updatedAt: new Date(),
      }, { merge: true })

      setFixedExpenses(updatedExpenses)
      setDialogOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error saving fixed expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return

    try {
      const updatedExpenses = fixedExpenses.filter(exp => exp.id !== expenseId)
      // Default to 5000 if all expenses are deleted
      const totalFixed = updatedExpenses.length > 0 
        ? updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        : 5000

      await setDoc(doc(db, 'users', user.uid), {
        fixedExpenseItems: updatedExpenses,
        fixedExpenses: totalFixed,
        updatedAt: new Date(),
      }, { merge: true })

      setFixedExpenses(updatedExpenses)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting fixed expense:', error)
    }
  }

  // Default to 5000 if no fixed expenses are added
  const totalFixedExpenses = fixedExpenses.length > 0 
    ? fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    : 5000

  const getCategoryInfo = (categoryName: string) => {
    return FIXED_CATEGORIES.find(cat => cat.name === categoryName) || FIXED_CATEGORIES[6]
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Paper>
    )
  }

  return (
    <>
      <Paper sx={{ p: isMobile ? 2 : 3, height: '100%' }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}>
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RepeatIcon sx={{ color: '#8b5cf6' }} />
              Fixed Expenses
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Monthly recurring expenses
            </Typography>
          </Box>
          <IconButton
            onClick={handleAddExpense}
            sx={{
              bgcolor: '#8b5cf6',
              color: 'white',
              '&:hover': { bgcolor: '#7c3aed' },
            }}
            size="small"
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Card
          sx={{
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Monthly Fixed
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ₹{totalFixedExpenses.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>

        {fixedExpenses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#f3e8ff', 
              borderRadius: 2, 
              mb: 2,
              border: '1px dashed #c4b5fd',
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Default fixed expense applied
              </Typography>
              <Typography variant="h6" sx={{ color: '#7c3aed', fontWeight: 600 }}>
                ₹5,000/month
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddExpense}
              size="small"
              sx={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
            >
              Customize Fixed Expenses
            </Button>
          </Box>
        ) : (
          <List dense disablePadding>
            {fixedExpenses.map((expense, index) => {
              const categoryInfo = getCategoryInfo(expense.category)
              const IconComponent = categoryInfo.icon
              
              return (
                <React.Fragment key={expense.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: categoryInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <IconComponent sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <ListItemText
                      primary={expense.name}
                      secondary={expense.category}
                      primaryTypographyProps={{ fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>
                      ₹{expense.amount.toLocaleString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end', position: 'absolute', bottom: 15, right: -15, width: '100%' }}>
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleEditExpense(expense)}
                        sx={{ color: '#666' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteExpense(expense.id)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                    </Box>
                  </ListItem>
                  {index < fixedExpenses.length - 1 && <Divider />}
                </React.Fragment>
              )
            })}
          </List>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Expense Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rent, Netflix, Gym"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                {FIXED_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.name} value={cat.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <cat.icon sx={{ color: cat.color, fontSize: 20 }} />
                      {cat.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveExpense}
            variant="contained"
            disabled={saving || !name || !amount || !category}
          >
            {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}


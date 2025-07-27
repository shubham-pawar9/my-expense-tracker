'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface AddExpenseDialogProps {
  open: boolean
  onClose: () => void
  onExpenseAdded: () => void
}

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Utilities',
  'Rent/Mortgage',
  'Insurance',
  'Education',
  'Other',
]

export const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ open, onClose, onExpenseAdded }) => {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category || !description) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      await addDoc(collection(db, 'expenses'), {
        userId: user?.uid,
        amount: parseFloat(amount),
        category,
        description,
        date,
        createdAt: new Date(),
      })
      toast.success('Expense added successfully')
      // Reset form
      setAmount('')
      setCategory('')
      setDescription('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      
      // Close dialog and refresh dashboard
      onClose()
      onExpenseAdded()
    } catch (error: any) {
      setError(error.message || 'Failed to add expense')
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setAmount('')
    setCategory('')
    setDescription('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setError('')
    onClose()
  }

  const handleCancel = () => {
    handleClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          margin: isMobile ? 0 : 'auto',
          borderRadius: isMobile ? 0 : 1,
        }
      }}
    >
      <DialogTitle sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem', pb: isMobile ? 1 : 2 }}>
        Add New Expense
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pb: isMobile ? 2 : 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            required
            sx={{ mb: isMobile ? 2 : 2 }}
          />
          <FormControl fullWidth margin="dense" required sx={{ mb: isMobile ? 2 : 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            sx={{ mb: isMobile ? 2 : 2 }}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
          <Button onClick={handleCancel} size={isMobile ? 'large' : 'medium'}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            size={isMobile ? 'large' : 'medium'}
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
} 
'use client'

import React, { useEffect, useState } from 'react'
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
import { ParsedExpense } from '../utils/voiceParser'
import VoiceMic from '../voiceMic/VoiceMic'
import { useSnackbar } from 'notistack'

interface AddExpenseDialogProps {
  open: boolean
  onClose: () => void
  onExpenseAdded: () => void
}
const VOICE_CATEGORY_MAP: Record<string, string> = {
  food: 'Food & Dining',
  dining: 'Food & Dining',
  travel: 'Transportation',
  transport: 'Transportation',
  shopping: 'Shopping',
  movie: 'Entertainment',
  entertainment: 'Entertainment',
  medical: 'Healthcare',
  health: 'Healthcare',
  rent: 'Rent/Mortgage',
  education: 'Education',
  study: 'Education',
  bill: 'Utilities',
  insurance: 'Insurance',
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
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { enqueueSnackbar } = useSnackbar()

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
      enqueueSnackbar('Expense added 🎉', {
        variant: 'success',
      })
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

  const handleVoiceResult = (data: ParsedExpense) => {

    setAmount(String(data.amount))

    const mappedCategory =
      VOICE_CATEGORY_MAP[data.category] || 'Other'

    setCategory(mappedCategory)

    setDescription(`Voice expense: ${data.category}`)
    setIsVoiceInput(true)
  }
  useEffect(() => {
    if (!isVoiceInput) return

    handleSubmit()
    setIsVoiceInput(false)
    return

  }, [isVoiceInput])


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
      <DialogTitle sx={{
        fontSize: isMobile ? '1.25rem' : '1.5rem', pb: isMobile ? 1 : 2, display: 'flex', alignItems: 'flex-starts', justifyContent: 'space-between'
      }}>
        Add New Expense
        <Box><VoiceMic onResult={handleVoiceResult} /></Box>
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
            {isVoiceInput
              ? `Add Expense`
              : loading
                ? 'Adding...'
                : 'Add Expense'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
} 
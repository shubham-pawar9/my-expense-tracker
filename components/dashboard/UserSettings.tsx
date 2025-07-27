'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Divider,
  InputAdornment,
} from '@mui/material'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'react-hot-toast'
import { FourSquare } from 'react-loading-indicators'

interface UserSettingsProps {
  open: boolean
  onClose: () => void
}

export const UserSettings: React.FC<UserSettingsProps> = ({ open, onClose }) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>()
  const [fixedExpenses, setFixedExpenses] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (open && user) {
      loadUserSettings()
    }
  }, [open, user])

  const loadUserSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        setMonthlyIncome(data.monthlyIncome || 0)
        setFixedExpenses(data.fixedExpenses?.toString() || '')
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        monthlyIncome: monthlyIncome,
        fixedExpenses: fixedExpenses ? parseFloat(fixedExpenses) : 0,
        updatedAt: new Date(),
      }, { merge: true })
      toast.success('Settings saved successfully')

      onClose()
    } catch (error) {
      console.error('Error saving user settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>User Settings</DialogTitle>
      <DialogContent>
        {loading ? (
          <FourSquare color="#1976d2" size="small" text="Loading settings..." textColor="#1976d2" />
        ) : (
          <Box sx={{ pt: 1 }}>
            <Typography variant="h6" gutterBottom>
              Financial Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set your monthly income and fixed expenses to get better insights into your spending patterns.
            </Typography>

            <TextField
              fullWidth
              label="Monthly Income"
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <TextField
              fullWidth
              label="Fixed Monthly Expenses"
              type="number"
              value={fixedExpenses}
              onChange={(e) => setFixedExpenses(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              placeholder="1000"
              helperText="Rent, utilities, subscriptions, etc."
              sx={{ mb: 3 }}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> These settings help calculate your disposable income and savings percentage. 
                You can update these values anytime.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 
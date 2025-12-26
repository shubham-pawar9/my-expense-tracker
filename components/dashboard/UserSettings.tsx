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
  InputAdornment,
  Alert,
} from '@mui/material'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'

interface UserSettingsProps {
  open: boolean
  onClose: () => void
}

export const UserSettings: React.FC<UserSettingsProps> = ({ open, onClose }) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (open && user) {
      loadUserSettings()
      setSuccess(false)
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
        updatedAt: new Date(),
      }, { merge: true })

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Error saving user settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        ⚙️ User Settings
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Typography>Loading settings...</Typography>
        ) : (
          <Box sx={{ pt: 1 }}>
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Settings saved successfully!
              </Alert>
            )}

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              💰 Financial Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set your monthly income to get better insights into your spending patterns and savings.
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
              sx={{ mb: 3 }}
              helperText="Your total monthly income (salary, freelance, etc.)"
            />

            <Box sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: '#f0fdf4', 
              borderRadius: 2,
              border: '1px solid #86efac',
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>💡 Tip:</strong> Fixed expenses (rent, subscriptions, etc.) can be managed directly from the dashboard using the "Fixed Expenses" card. They are automatically included in your monthly calculations.
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={saving}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            },
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

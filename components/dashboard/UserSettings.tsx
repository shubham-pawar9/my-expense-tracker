'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Checkbox,
  CircularProgress,
  IconButton,
  useMediaQuery,
  Dialog as MuiDialog,
} from '@mui/material'
import { Download, Share, ArrowBack, ChevronLeft, ChevronRight } from '@mui/icons-material'
import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/auth/AuthProvider'
import { DailyVendor, VendorDailyEntry, VendorType } from '@/types'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ensureDailyVendorEntries } from '@/lib/dailyVendors'

interface UserSettingsProps {
  open: boolean
  onClose: () => void
}

type SettingsTab = 'general' | 'daily-vendors'
type VendorView = 'list' | 'add' | 'edit' | 'history' | 'detail'

const VENDOR_TYPES: VendorType[] = ['Milk', 'Newspaper', 'Maid']

export const UserSettings: React.FC<UserSettingsProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState<SettingsTab>('general')
  const [vendorView, setVendorView] = useState<VendorView>('list')
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [vendors, setVendors] = useState<DailyVendor[]>([])
  const [entries, setEntries] = useState<VendorDailyEntry[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<VendorDailyEntry | null>(null)
  const [editDelivered, setEditDelivered] = useState(true)
  const [editQuantity, setEditQuantity] = useState(0)
  const [editAmount, setEditAmount] = useState(0)

  const [vendorName, setVendorName] = useState('')
  const [vendorType, setVendorType] = useState<VendorType>('Milk')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [dailyQuantity, setDailyQuantity] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [newspaperName, setNewspaperName] = useState('')
  const [pricePerDay, setPricePerDay] = useState('')

  const [billMonth, setBillMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [savingVendor, setSavingVendor] = useState(false)
  const [editingVendorId, setEditingVendorId] = useState('')

  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width:600px)')

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor.id === selectedVendorId) || null,
    [vendors, selectedVendorId],
  )

  const selectedVendorEntries = useMemo(() => {
    return entries
      .filter((entry) => entry.vendorId === selectedVendorId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [entries, selectedVendorId])

  useEffect(() => {
    if (!open || !user) return

    const load = async () => {
      setLoading(true)
      setSuccess('')
      setError('')
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid))
        if (userSnap.exists()) {
          const userData = userSnap.data()
          setMonthlyIncome(userData.monthlyIncome || 0)
        } else {
          setMonthlyIncome(0)
        }

        await ensureDailyVendorEntries(user.uid)
        await loadVendorsAndEntries()
      } catch (err) {
        console.error(err)
        setError('Failed to load settings data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, user])

  const loadVendorsAndEntries = async () => {
    if (!user) return

    const auth = getAuth()
    const authUser = auth.currentUser
    console.log('Firebase Auth User:', authUser)
    console.log('User UID:', authUser?.uid)

    if (!authUser?.uid) {
      setError('Please sign in again to load vendors.')
      return
    }

    if (authUser.uid !== user.uid) {
      console.warn('Auth context UID and Firebase currentUser UID mismatch.', {
        contextUid: user.uid,
        authUid: authUser.uid,
      })
    }

    try {
      const vendorsQuery = query(
        collection(db, 'dailyVendors'),
        where('userId', '==', authUser.uid),
      )

      const vendorSnap = await getDocs(vendorsQuery)
      console.log('Vendors fetched:', vendorSnap.size)

      const vendorList = vendorSnap.docs.map((vendorDoc) => {
        const vendorData = vendorDoc.data() as DailyVendor

        console.log('Vendor Doc ID:', vendorDoc.id)
        console.log('Vendor UserId:', vendorData.userId)
        console.log('Current Auth UID:', auth.currentUser?.uid)

        return {
          ...vendorData,
          userId: authUser.uid,
          id: vendorDoc.id,
        }
      })

      setVendors(vendorList)

      const entrySnap = await getDocs(
        query(collection(db, 'vendorDailyEntries'), where('userId', '==', authUser.uid)),
      )

      const entryList = entrySnap.docs.map((entryDoc) => {
        const entryData = entryDoc.data() as VendorDailyEntry & { vendorDocId?: string }
        const resolvedVendorName = entryData.vendorName || entryData.vendorDocId || ''

        let resolvedVendorId = entryData.vendorId
        if (!vendorList.some((vendor) => vendor.id === resolvedVendorId) && resolvedVendorName) {
          resolvedVendorId = vendorList.find((vendor) => vendor.vendorName === resolvedVendorName)?.id || resolvedVendorId
        }

        return {
          ...entryData,
          userId: authUser.uid,
          vendorName: resolvedVendorName,
          vendorId: resolvedVendorId,
          id: entryDoc.id,
        }
      })

      await Promise.all(
        entrySnap.docs.map((entryDoc) => {
          const entryData = entryDoc.data() as VendorDailyEntry & { vendorDocId?: string }
          const matchedEntry = entryList.find((entry) => entry.id === entryDoc.id)

          if (!matchedEntry) return Promise.resolve()

          const shouldMigrateVendorName = !entryData.vendorName && Boolean(matchedEntry.vendorName)
          const shouldMigrateVendorId = entryData.vendorId !== matchedEntry.vendorId

          if (!shouldMigrateVendorName && !shouldMigrateVendorId) {
            return Promise.resolve()
          }

          return setDoc(
            doc(db, 'vendorDailyEntries', entryDoc.id),
            {
              vendorName: matchedEntry.vendorName,
              vendorId: matchedEntry.vendorId,
            },
            { merge: true },
          )
        }),
      )

      setEntries(entryList)

      if (!selectedVendorId && vendorList.length > 0) {
        setSelectedVendorId(vendorList[0].id)
      }
    } catch (error) {
      console.error('Vendor fetch error:', error)
      setError('Failed to load vendors. Please check authentication and Firestore rules.')
    }
  }

  const saveGeneralSettings = async () => {
    if (!user) return

    setSaving(true)
    setError('')
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email,
          monthlyIncome,
          updatedAt: new Date(),
        },
        { merge: true },
      )
      setSuccess('Settings saved successfully!')
    } catch (err) {
      console.error(err)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetVendorForm = () => {
    setVendorName('')
    setVendorType('Milk')
    setPhoneNumber('')
    setStartDate(format(new Date(), 'yyyy-MM-dd'))
    setPricePerLiter('')
    setDailyQuantity('')
    setDeliveryTime('')
    setNewspaperName('')
    setPricePerDay('')
    setEditingVendorId('')
  }

  const populateVendorForm = (vendor: DailyVendor) => {
    setEditingVendorId(vendor.id)
    setVendorName(vendor.vendorName)
    setVendorType(vendor.vendorType)
    setPhoneNumber(vendor.phoneNumber || '')
    setStartDate(vendor.startDate)
    setPricePerLiter(vendor.pricePerLiter?.toString() || '')
    setDailyQuantity(vendor.dailyQuantity?.toString() || '')
    setDeliveryTime(vendor.deliveryTime || '')
    setNewspaperName(vendor.newspaperName || '')
    setPricePerDay(vendor.pricePerDay?.toString() || '')
  }

  const saveVendor = async () => {
    if (!user || !vendorName || !startDate || savingVendor) return

    const auth = getAuth()
    const authUser = auth.currentUser

    console.log('Firebase Auth User:', authUser)
    console.log('User UID:', authUser?.uid)

    if (!authUser?.uid) {
      setError('Please sign in again before adding a vendor.')
      return
    }

    const vendorRef = editingVendorId
      ? doc(db, 'dailyVendors', editingVendorId)
      : doc(collection(db, 'dailyVendors'))
    const payload: Partial<DailyVendor> = {
      userId: authUser.uid,
      vendorName,
      vendorType,
      startDate,
      isActive: true,
      updatedAt: new Date(),
      ...(editingVendorId ? {} : { createdAt: new Date() }),
    }

    if (phoneNumber) payload.phoneNumber = phoneNumber
    if (deliveryTime) payload.deliveryTime = deliveryTime

    if (vendorType === 'Milk') {
      payload.pricePerLiter = parseFloat(pricePerLiter) || 0
      payload.dailyQuantity = parseFloat(dailyQuantity) || 0
    }

    if (vendorType === 'Newspaper') {
      payload.newspaperName = newspaperName
      payload.pricePerDay = parseFloat(pricePerDay) || 0
    }

    try {
      setSavingVendor(true)
      await setDoc(vendorRef, payload, { merge: Boolean(editingVendorId) })
      await ensureDailyVendorEntries(authUser.uid)
      await loadVendorsAndEntries()
      setSuccess(editingVendorId ? 'Vendor updated successfully.' : 'Vendor added and daily entries generated.')
      resetVendorForm()
      setVendorView('list')
    } catch (error) {
      console.error('Vendor fetch error:', error)
      setError('Failed to save vendor. Please verify Firestore rules and userId mapping.')
    } finally {
      setSavingVendor(false)
    }
  }

  const toggleVendorStatus = async (vendor: DailyVendor) => {
    if (!user) return

    const nextActiveStatus = !vendor.isActive
    await setDoc(
      doc(db, 'dailyVendors', vendor.id),
      {
        isActive: nextActiveStatus,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    if (!nextActiveStatus) {
      const today = format(new Date(), 'yyyy-MM-dd')
      const entrySnap = await getDocs(
        query(
          collection(db, 'vendorDailyEntries'),
          where('userId', '==', user.uid),
          where('vendorId', '==', vendor.id),
        ),
      )
      const expenseSnap = await getDocs(
        query(
          collection(db, 'expenses'),
          where('userId', '==', user.uid),
          where('vendorId', '==', vendor.id),
        ),
      )

      const batch = writeBatch(db)
      entrySnap.docs.forEach((entryDoc) => {
        const entryData = entryDoc.data() as VendorDailyEntry
        if (entryData.date >= today) {
          batch.set(doc(db, 'vendorDailyEntries', entryDoc.id), {
            status: 'Skipped',
            amount: 0,
            updatedAt: new Date(),
          }, { merge: true })
        }
      })
      expenseSnap.docs.forEach((expenseDoc) => {
        const expenseData = expenseDoc.data() as { date?: string }
        if ((expenseData.date || '') >= today) {
          batch.set(doc(db, 'expenses', expenseDoc.id), {
            amount: 0,
            updatedAt: new Date(),
          }, { merge: true })
        }
      })
      await batch.commit()
    } else {
      await ensureDailyVendorEntries(user.uid)
    }

    await loadVendorsAndEntries()
    setSuccess(nextActiveStatus ? 'Vendor enabled.' : 'Vendor disabled. Future expenses will not be deducted.')
  }

  const deleteVendor = async (vendor: DailyVendor) => {
    if (!user) return
    const shouldDelete = window.confirm(`Delete ${vendor.vendorName}? This also removes related entries and expenses.`)
    if (!shouldDelete) return

    const entrySnap = await getDocs(
      query(collection(db, 'vendorDailyEntries'), where('userId', '==', user.uid), where('vendorId', '==', vendor.id)),
    )
    const expenseSnap = await getDocs(
      query(collection(db, 'expenses'), where('userId', '==', user.uid), where('vendorId', '==', vendor.id)),
    )

    const batch = writeBatch(db)
    entrySnap.docs.forEach((entryDoc) => batch.delete(doc(db, 'vendorDailyEntries', entryDoc.id)))
    expenseSnap.docs.forEach((expenseDoc) => batch.delete(doc(db, 'expenses', expenseDoc.id)))
    batch.delete(doc(db, 'dailyVendors', vendor.id))
    await batch.commit()

    if (selectedVendorId === vendor.id) {
      setSelectedVendorId('')
      setVendorView('history')
    }

    await loadVendorsAndEntries()
    setSuccess('Vendor and related records deleted.')
  }

  const getCalendarColor = (day: Date) => {
    const dayValue = format(day, 'yyyy-MM-dd')
    const entry = selectedVendorEntries.find((item) => item.date === dayValue)

    if (!entry) {
      if (selectedVendor && isBefore(day, parseISO(selectedVendor.startDate))) {
        return '#d1d5db'
      }
      if (isAfter(day, new Date())) {
        return '#d1d5db'
      }
      return '#e5e7eb'
    }

    return entry.status === 'Delivered' ? '#22c55e' : '#ef4444'
  }

  const openEntryEditor = (day: Date) => {
    if (!selectedVendor) return

    const dayValue = format(day, 'yyyy-MM-dd')
    let entry = selectedVendorEntries.find((item) => item.date === dayValue) || null

    if (!entry) {
      const quantity = selectedVendor.vendorType === 'Milk' ? selectedVendor.dailyQuantity || 0 : 1
      const amount = selectedVendor.vendorType === 'Milk'
        ? (selectedVendor.pricePerLiter || 0) * (selectedVendor.dailyQuantity || 0)
        : selectedVendor.vendorType === 'Newspaper'
          ? selectedVendor.pricePerDay || 0
          : 0
      entry = {
        id: '',
        userId: selectedVendor.userId,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.vendorName,
        vendorType: selectedVendor.vendorType,
        date: dayValue,
        status: 'Delivered',
        quantity,
        amount,
      }
    }

    setEditingEntry(entry)
    setEditDelivered(entry.status === 'Delivered')
    setEditQuantity(entry.quantity)
    setEditAmount(entry.amount)
    setEntryDialogOpen(true)
  }

  const saveEditedEntry = async () => {
    if (!user || !editingEntry) return

    const status = editDelivered ? 'Delivered' : 'Skipped'
    const amount = editDelivered ? editAmount : 0
    const payload = {
      ...editingEntry,
      userId: user.uid,
      status,
      quantity: editQuantity,
      amount,
      updatedAt: new Date(),
      createdAt: editingEntry.createdAt || new Date(),
    }

    const entryRef = editingEntry.id
      ? doc(db, 'vendorDailyEntries', editingEntry.id)
      : doc(collection(db, 'vendorDailyEntries'))

    await setDoc(entryRef, payload)

    const expenseQuery = await getDocs(
      query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        where('vendorId', '==', editingEntry.vendorId),
        where('date', '==', editingEntry.date),
      ),
    )

    const expensePayload = {
      userId: user.uid,
      amount,
      category: 'Daily Supply',
      description: `${editingEntry.vendorType} - ${editingEntry.vendorName}`,
      date: editingEntry.date,
      createdAt: new Date(),
      vendorId: editingEntry.vendorId,
      vendorEntryId: entryRef.id,
    }

    if (expenseQuery.empty) {
      await setDoc(doc(collection(db, 'expenses')), expensePayload)
    } else {
      await setDoc(doc(db, 'expenses', expenseQuery.docs[0].id), expensePayload, { merge: true })
    }

    setEntryDialogOpen(false)
    await loadVendorsAndEntries()
  }

  const monthDate = new Date(`${billMonth}-01`)
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const monthEntries = selectedVendorEntries.filter((entry) => {
    const d = parseISO(entry.date)
    return !isBefore(d, monthStart) && !isAfter(d, monthEnd)
  })

  const deliveredDays = monthEntries.filter((entry) => entry.status === 'Delivered').length
  const skippedDays = monthEntries.filter((entry) => entry.status === 'Skipped').length
  const monthlyTotal = monthEntries.reduce((sum, entry) => sum + entry.amount, 0)

  const downloadBill = () => {
    if (!selectedVendor) return

    const lines = [
      `Vendor: ${selectedVendor.vendorName}`,
      `Month: ${format(monthDate, 'MMMM yyyy')}`,
      `Delivered Days: ${deliveredDays}`,
      `Skipped Days: ${skippedDays}`,
      `Quantity/day: ${selectedVendor.dailyQuantity || 1}`,
      `Price: ₹${selectedVendor.vendorType === 'Milk' ? selectedVendor.pricePerLiter || 0 : selectedVendor.pricePerDay || 0}`,
      `Total: ₹${monthlyTotal.toFixed(2)}`,
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedVendor.vendorName.replace(/\s+/g, '_')}_${billMonth}_bill.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const shareBill = async () => {
    if (!selectedVendor) return

    const content = `Vendor: ${selectedVendor.vendorName}\nMonth: ${format(monthDate, 'MMMM yyyy')}\nDelivered Days: ${deliveredDays}\nSkipped Days: ${skippedDays}\nTotal: ₹${monthlyTotal.toFixed(2)}`

    if (navigator.share) {
      await navigator.share({
        title: 'Monthly Vendor Bill',
        text: content,
      })
      return
    }

    await navigator.clipboard.writeText(content)
    setSuccess('Bill copied to clipboard (share not supported).')
  }

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>⚙️ Settings</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
          <Tab label="General" value="general" />
          <Tab label="Daily Vendors" value="daily-vendors" />
        </Tabs>

        {loading ? (
          <Typography>Loading settings...</Typography>
        ) : (
          <>
            {tab === 'general' && (
              <Box>
                <Typography variant="h6" gutterBottom>💰 Financial Information</Typography>
                <TextField
                  fullWidth
                  label="Monthly Income"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Box>
            )}

            {tab === 'daily-vendors' && (
              <Box>
                {vendorView !== 'list' && (
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={() => setVendorView('list')}
                    sx={{ mb: 2 }}
                  >
                    Back to Daily Vendors
                  </Button>
                )}

                {vendorView === 'list' && (
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Button variant="contained" onClick={() => { resetVendorForm(); setVendorView('add') }}>Add Vendor</Button>
                    <Button variant="outlined" onClick={() => setVendorView('history')}>Vendor History</Button>
                  </Stack>
                )}

                {(vendorView === 'add' || vendorView === 'edit') && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>{vendorView === 'edit' ? 'Edit Vendor' : 'Add Vendor Form'}</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}><Typography variant="subtitle1">Basic Information</Typography></Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Vendor Name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Vendor Type</InputLabel>
                          <Select value={vendorType} label="Vendor Type" onChange={(e) => setVendorType(e.target.value as VendorType)}>
                            {VENDOR_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Phone Number (optional)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                      </Grid>

                      {vendorType === 'Milk' && (
                        <>
                          <Grid item xs={12}><Typography variant="subtitle1">Milk Vendor Additional Fields</Typography></Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth type="number" label="Price per Liter" value={pricePerLiter} onChange={(e) => setPricePerLiter(e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth type="number" label="Daily Quantity (Liters)" value={dailyQuantity} onChange={(e) => setDailyQuantity(e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Delivery Time (optional)" type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} InputLabelProps={{ shrink: true }} />
                          </Grid>
                        </>
                      )}

                      {vendorType === 'Newspaper' && (
                        <>
                          <Grid item xs={12}><Typography variant="subtitle1">Newspaper Vendor Fields</Typography></Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Newspaper Name" value={newspaperName} onChange={(e) => setNewspaperName(e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth type="number" label="Price Per Day" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Delivery Time" type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} InputLabelProps={{ shrink: true }} />
                          </Grid>
                        </>
                      )}

                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          onClick={saveVendor}
                          disabled={savingVendor || !vendorName.trim() || !startDate}
                          startIcon={savingVendor ? <CircularProgress size={18} color="inherit" /> : undefined}
                        >
                          {savingVendor ? 'Saving...' : vendorView === 'edit' ? 'Update Vendor' : 'Save Vendor'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {vendorView === 'history' && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Vendor History</Typography>
                    <List>
                      {vendors.map((vendor) => (
                        <ListItem key={vendor.id} disablePadding>
                          <ListItemButton onClick={() => { setSelectedVendorId(vendor.id); setVendorView('detail') }}>
                            <ListItemText
                              primary={vendor.vendorName}
                              secondary={`${vendor.vendorType}${vendor.newspaperName ? ` - ${vendor.newspaperName}` : ''}${vendor.isActive ? '' : ' • Inactive'}`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {vendorView === 'detail' && selectedVendor && (
                  <Paper sx={{ p: 2 }}>
                    <Stack
                      direction={isMobile ? 'column' : 'row'}
                      justifyContent="space-between"
                      alignItems={isMobile ? 'stretch' : 'center'}
                      spacing={1.5}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="h6">{selectedVendor.vendorName} Calendar</Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent={isMobile ? 'space-between' : 'flex-end'}
                        spacing={1}
                        sx={{
                          width: isMobile ? '100%' : 'auto',
                          p: isMobile ? 0.75 : 0.5,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => setBillMonth(format(subMonths(monthDate, 1), 'yyyy-MM'))}
                          aria-label="Previous month"
                        >
                          <ChevronLeft fontSize="small" />
                        </IconButton>
                        <Typography variant="subtitle2" sx={{ minWidth: isMobile ? 130 : 140, textAlign: 'center' }}>
                          {format(monthDate, 'MMMM yyyy')}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setBillMonth(format(addMonths(monthDate, 1), 'yyyy-MM'))}
                          aria-label="Next month"
                        >
                          <ChevronRight fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: isMobile ? 0.5 : 1,
                      }}
                    >
                      {calendarDays.map((day) => (
                        <Button
                          key={day.toISOString()}
                          fullWidth
                          onClick={() => openEntryEditor(day)}
                          sx={{
                            minHeight: isMobile ? 38 : 44,
                            minWidth: 0,
                            px: isMobile ? 0 : 1,
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            bgcolor: getCalendarColor(day),
                            color: '#111827',
                            fontWeight: 700,
                          }}
                        >
                          {format(day, 'd')}
                        </Button>
                      ))}
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
                      <Chip label="Delivered" sx={{ bgcolor: '#22c55e', color: 'white' }} />
                      <Chip label="Not Delivered" sx={{ bgcolor: '#ef4444', color: 'white' }} />
                      <Chip label="Not yet" sx={{ bgcolor: '#d1d5db' }} />
                    </Stack>

                    <Divider sx={{ my: 2 }} />
                    <Stack direction={isMobile ? 'column' : 'row'} spacing={1.5} sx={{ mb: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          populateVendorForm(selectedVendor)
                          setVendorView('edit')
                        }}
                      >
                        Edit Vendor Info
                      </Button>
                      <Button
                        variant="outlined"
                        color={selectedVendor.isActive ? 'warning' : 'success'}
                        onClick={() => toggleVendorStatus(selectedVendor)}
                      >
                        {selectedVendor.isActive ? 'Disable Vendor' : 'Enable Vendor'}
                      </Button>
                      <Button variant="outlined" color="error" onClick={() => deleteVendor(selectedVendor)}>
                        Delete Vendor
                      </Button>
                    </Stack>
                    {!selectedVendor.isActive && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        This vendor is inactive. Vendor remains visible, but future expenses are not deducted.
                      </Alert>
                    )}

                    <Typography variant="h6" sx={{ mb: 1 }}>Monthly Bill Generator</Typography>
                    <Typography variant="body2">Vendor: {selectedVendor.vendorName}</Typography>
                    <Typography variant="body2">Month: {format(monthDate, 'MMMM')}</Typography>
                    <Typography variant="body2">Delivered Days: {deliveredDays}</Typography>
                    <Typography variant="body2">Skipped Days: {skippedDays}</Typography>
                    <Typography variant="body2">Quantity/day: {selectedVendor.dailyQuantity || 1}</Typography>
                    <Typography variant="body2">Price: ₹{selectedVendor.vendorType === 'Milk' ? selectedVendor.pricePerLiter || 0 : selectedVendor.pricePerDay || 0}</Typography>
                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>Total: ₹{monthlyTotal.toFixed(2)}</Typography>

                    <Stack direction={isMobile ? 'column' : 'row'} spacing={1.5} sx={{ mt: 2 }}>
                      <Button startIcon={<Download />} variant="contained" onClick={downloadBill}>Download Bill</Button>
                      <Button startIcon={<Share />} variant="outlined" onClick={shareBill}>Share Bill</Button>
                    </Stack>
                  </Paper>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {tab === 'general' && (
          <Button onClick={saveGeneralSettings} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <MuiDialog open={entryDialogOpen} onClose={() => setEntryDialogOpen(false)}>
        <DialogTitle>Edit Daily Entry</DialogTitle>
        <DialogContent>
          <Typography>Date: {editingEntry?.date}</Typography>
          <Typography>Vendor: {editingEntry?.vendorName}</Typography>
          <Stack direction="row" alignItems="center">
            <Checkbox checked={editDelivered} onChange={(e) => setEditDelivered(e.target.checked)} />
            <Typography>Delivered</Typography>
          </Stack>
          <Stack direction="row" alignItems="center">
            <Checkbox checked={!editDelivered} onChange={(e) => setEditDelivered(!e.target.checked)} />
            <Typography>Not Delivered</Typography>
          </Stack>
          <TextField fullWidth type="number" label="Quantity" sx={{ mt: 1 }} value={editQuantity} onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)} />
          <TextField fullWidth type="number" label="Amount" sx={{ mt: 1 }} value={editDelivered ? editAmount : 0} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} disabled={!editDelivered} />
          {!editDelivered && <Typography sx={{ mt: 1 }}>Status = Skipped, Amount = ₹0</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntryDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveEditedEntry} variant="contained">Save</Button>
        </DialogActions>
      </MuiDialog>
    </Dialog>
  )
}

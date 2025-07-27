'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Fab,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountBalance as AccountIcon,
} from '@mui/icons-material'
import { useAuth } from '@/components/auth/AuthProvider'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { ExpenseChart } from '@/components/dashboard/ExpenseChart'
import { AddExpenseDialog } from '@/components/dashboard/AddExpenseDialog'
import { ExpenseList } from '@/components/dashboard/ExpenseList'
import { MonthlySummary } from '@/components/dashboard/MonthlySummary'
import { UserSettings } from '@/components/dashboard/UserSettings'
import { toast } from 'react-hot-toast'

export const Dashboard: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeView, setActiveView] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to logout')
    }
  }

  const handleExpenseAdded = () => {
    // Trigger refresh of all dashboard components
    setRefreshKey(prev => prev + 1)
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, view: 'dashboard' },
    { text: 'Add Expense', icon: <AddIcon />, view: 'add-expense' },
    { text: 'Settings', icon: <SettingsIcon />, view: 'settings' },
  ]

  const handleMenuClick = (view: string) => {
    setActiveView(view)
    if (view === 'add-expense') {
      setAddExpenseOpen(true)
    } else if (view === 'settings') {
      setSettingsOpen(true)
    }
    if (isMobile) {
      setDrawerOpen(false)
    }
  }

  const renderContent = () => {
    // Always show dashboard content, regardless of activeView
    return (
      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: isMobile ? 2 : 3, height: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Expense Overview
            </Typography>
            <ExpenseChart key={`chart-${refreshKey}`} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <MonthlySummary key={`summary-${refreshKey}`} />
        </Grid>
        <Grid item xs={12}>
          <ExpenseList key={`list-${refreshKey}`} />
        </Grid>
      </Grid>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ minHeight: isMobile ? '56px' : '64px' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            Expense Tracker
          </Typography>
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => setAddExpenseOpen(true)}
            sx={{ 
              display: { xs: 'none', sm: 'flex' },
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}
          >
            Add Expense
          </Button>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            top: isMobile ? 0 : 64,
            height: isMobile ? '100%' : 'calc(100% - 64px)',
          },
        }}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleMenuClick(item.view)}
              selected={activeView === item.view}
              sx={{ py: isMobile ? 1.5 : 2 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : 3,
          width: { md: `calc(100% - 240px)` },
          mt: isMobile ? 7 : 8,
        }}
      >
        <Container maxWidth="xl" sx={{ px: isMobile ? 0 : 2 }}>
          {renderContent()}
        </Container>
      </Box>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add expense"
          onClick={() => setAddExpenseOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialogs */}
      <AddExpenseDialog
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />
      <UserSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  )
}

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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CalendarMonth as CalendarIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Repeat as RepeatIcon,
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
import { MonthYearPicker } from '@/components/dashboard/MonthYearPicker'
import { YearlyChart } from '@/components/dashboard/YearlyChart'
import { FixedExpensesCard } from '@/components/dashboard/FixedExpensesCard'
import { DateSelection } from '@/types'

type ViewMode = 'monthly' | 'yearly'

export const Dashboard: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeView, setActiveView] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [selectedDate, setSelectedDate] = useState<DateSelection>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  })
  const { user } = useAuth()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleExpenseAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleDateChange = (date: DateSelection) => {
    setSelectedDate(date)
    setRefreshKey(prev => prev + 1)
  }

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode)
    }
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, view: 'dashboard' },
    { text: 'Add Expense', icon: <AddIcon />, view: 'add-expense' },
    { text: 'Fixed Expenses', icon: <RepeatIcon />, view: 'fixed' },
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
    return (
      <>
        {/* View Mode Toggle & Date Picker */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 2,
          mb: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              size={isMobile ? 'small' : 'medium'}
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                '& .MuiToggleButton-root': {
                  px: 3,
                  py: 1,
                  border: 'none',
                  '&.Mui-selected': {
                    bgcolor: '#667eea',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#5a67d8',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="monthly" aria-label="monthly view">
                <PieChartIcon sx={{ mr: 1 }} />
                Monthly
              </ToggleButton>
              <ToggleButton value="yearly" aria-label="yearly view">
                <BarChartIcon sx={{ mr: 1 }} />
                Yearly
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {viewMode === 'monthly' ? (
          <>
            {/* Month Picker */}
            <MonthYearPicker
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />

            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Main Chart */}
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: isMobile ? 2 : 3, height: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    Expense Overview
                  </Typography>
                  <ExpenseChart
                    key={`chart-${refreshKey}`}
                    selectedDate={selectedDate}
                  />
                </Paper>
              </Grid>

              {/* Monthly Summary */}
              <Grid item xs={12} sm={6} lg={4}>
                <MonthlySummary
                  key={`summary-${refreshKey}`}
                  selectedDate={selectedDate}
                />
              </Grid>

              {/* Fixed Expenses */}
              <Grid item xs={12} sm={6} lg={4}>
                <FixedExpensesCard
                  key={`fixed-${refreshKey}`}
                  onUpdate={handleExpenseAdded}
                />
              </Grid>

              {/* Expense List */}
              <Grid item xs={12} lg={8}>
                <ExpenseList
                  key={`list-${refreshKey}`}
                  selectedDate={selectedDate}
                />
              </Grid>
            </Grid>
          </>
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {/* Yearly Chart */}
            <Grid item xs={12}>
              <YearlyChart key={`yearly-${refreshKey}`} />
            </Grid>

            {/* Fixed Expenses */}
            <Grid item xs={12} md={4}>
              <FixedExpensesCard
                key={`fixed-yearly-${refreshKey}`}
                onUpdate={handleExpenseAdded}
              />
            </Grid>

            {/* Monthly Summary for Current Month */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ color: '#667eea' }} />
                  Current Month Quick View
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Switch to Monthly view for detailed breakdown
                </Typography>
                <Box sx={{ opacity: 0.9 }}>
                  <MonthlySummary key={`summary-yearly-${refreshKey}`} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Toolbar sx={{ minHeight: isMobile ? '56px' : '64px' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            💰 Expense Tracker
          </Typography>
          <Tooltip title="Add Expense">
            <Button
              color="inherit"
              startIcon={<AddIcon />}
              onClick={() => setAddExpenseOpen(true)}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                fontSize: isMobile ? '0.875rem' : '1rem',
                bgcolor: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                },
              }}
            >
              Add Expense
            </Button>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{
                ml: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 260,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 260,
            boxSizing: 'border-box',
            top: isMobile ? 0 : 64,
            height: isMobile ? '100%' : 'calc(100% - 64px)',
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
            borderRight: 'none',
          },
        }}
      >
        <Box sx={{ p: 2, display: isMobile ? 'block' : 'none' }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            💰 Expense Tracker
          </Typography>
        </Box>
        <List sx={{ px: 2, mt: isMobile ? 0 : 2 }}>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleMenuClick(item.view)}
              selected={activeView === item.view}
              sx={{
                py: isMobile ? 1.5 : 2,
                borderRadius: 2,
                mb: 1,
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(102, 126, 234, 0.3)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.4)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          ))}
        </List>

        {/* Quick Stats in Sidebar */}
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Pro Tip
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', mt: 0.5 }}>
              Add fixed expenses like rent & subscriptions to track your real savings!
            </Typography>
          </Paper>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : 3,
          width: { md: `calc(100% - 260px)` },
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            },
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

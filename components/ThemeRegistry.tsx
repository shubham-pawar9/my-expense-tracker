'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PaletteMode, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { getAppTheme } from '@/lib/theme'

interface ColorModeContextValue {
  mode: PaletteMode
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
})

export const useColorMode = () => useContext(ColorModeContext)

const STORAGE_KEY = 'expense-tracker-color-mode'

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('light')

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') {
      setMode(saved)
      return
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark')
    }
  }, [])

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  const contextValue = useMemo(
    () => ({
      mode,
      toggleColorMode,
    }),
    [mode],
  )

  const theme = useMemo(() => getAppTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

import React from 'react'
import ReactDOM from 'react-dom/client' 
// React + создание корня приложения

import { RouterProvider } from 'react-router-dom' 
// Роутинг (маршруты, переходы между страницами)

import { ThemeProvider, CssBaseline, createTheme } from '@mui/material' 
// Material UI: тема, базовые стили

import { QueryClient, QueryClientProvider } from '@tanstack/react-query' 
// React Query: кэширование и управление запросами

import { router } from './router.tsx' 
// объект маршрутов приложения

const queryClient = new QueryClient() 
// создаём кэш-клиент React Query

// создаём Material UI тему
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* StrictMode помогает находить потенциальные ошибки в разработке */}

    <QueryClientProvider client={queryClient}>
      {/* React Query: делает кэш и запросы доступными по всему приложению */}

      <ThemeProvider theme={theme}>
        {/* Material UI: передаёт тему всем компонентам */}

        <CssBaseline />
        {/* Сбрасывает базовые стили браузера для единообразия */}

        <RouterProvider router={router} />
        {/* Подключение маршрутов приложения */}

      </ThemeProvider>

    </QueryClientProvider>

  </React.StrictMode>
)

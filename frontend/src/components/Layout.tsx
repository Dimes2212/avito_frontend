import { AppBar, Toolbar, Typography, Button, Container, Box, Stack } from '@mui/material' 
// импорт готовых компонентов MUI

import { Link, Outlet } from 'react-router-dom'  
// Link — навигация без перезагрузки страницы
// Outlet — место, куда вставляется текущая страница

export default function Layout() {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

            {/* Шапка */}
            <AppBar position='static'>
                <Toolbar>

                    <Typography variant='h6' sx={{ flexGrow: 1 }}>
                        Moderation Panel
                    </Typography>

                    {/* Горизонтальный ряд кнопок */}
                    <Stack direction="row" spacing={2}>
                        <Button color="inherit" component={Link} to="/list">
                            Список
                        </Button>

                        <Button color="inherit" component={Link} to="/stats">
                            Статистика
                        </Button>
                    </Stack>

                </Toolbar>
            </AppBar>

            {/* Основная часть */}
            <Container sx={{ py: 3 }}>
                {/* компонент текущего маршрута */}
                <Outlet />
            </Container>

        </Box>
    )
}

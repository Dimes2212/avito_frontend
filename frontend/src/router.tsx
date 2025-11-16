import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import ListPage from './pages/ListPage.tsx'
import ItemPage from './pages/ItemPage.tsx'
import StatsPage from './pages/StatsPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {index: true, element: <ListPage />},
            {path: 'list', element: <ListPage />},
            {path: 'item/:id' , element: <ItemPage />},
            {path: 'stats' , element: <StatsPage />},
            {path: '*', element: <NotFoundPage />}
        ],
    },
])
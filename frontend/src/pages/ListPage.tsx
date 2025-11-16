// src/pages/ListPage.tsx
import { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAds, type AdsListResponse, type Advertisement } from '../api/ads'

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'draft'
type SortOption =
  | 'none'
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'price_asc'
  | 'price_desc'
  | 'priority'

const PAGE_SIZE = 10

const statusLabels: Record<StatusFilter, string> = {
  pending: 'На модерации',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  draft: 'Черновик',
}

export default function ListPage() {
  // фильтры
  const [statusFilter, setStatusFilter] = useState<StatusFilter[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('') // строки из инпута
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('none')
  const navigate = useNavigate()

  // текущая страница (клиентская пагинация по отфильтрованному списку)
  const [page, setPage] = useState<number>(1)

  // запрос: забираем побольше объявлений один раз
  const queryResult = useQuery<AdsListResponse | string, Error>({
    queryKey: ['ads', { all: true }],
    queryFn: async ({ signal }) => {
      const res = await fetchAds({ page: 1, limit: 150 }, signal)
      return res
    },
    // keepPreviousData здесь больше не используется в v5, убрали чтобы не было ошибки типов
  })

  const { data, isLoading, isError } = queryResult

  const isHtmlResponse = typeof data === 'string'

  // аккуратно сузим тип без кастов
  let adsData: AdsListResponse | null = null
  if (!isError && data && typeof data !== 'string') {
    adsData = data
  }

  const safeAds: Advertisement[] =
    adsData && Array.isArray(adsData.ads) ? adsData.ads : []

  // 🔹 категории из данных
  const categories = useMemo(() => {
    const set = new Set<string>()
    safeAds.forEach((ad) => {
      if (ad.category) set.add(ad.category)
    })
    return Array.from(set).sort()
  }, [safeAds])

  // 🔹 применение фильтров + сортировки
  const filteredAndSortedAds = useMemo(() => {
    let result = [...safeAds]

    // фильтр по статусу (множественный выбор)
    if (statusFilter.length > 0) {
      result = result.filter((ad) =>
        statusFilter.includes(ad.status as StatusFilter)
      )
    }

    // фильтр по категории
    if (categoryFilter !== 'all') {
      result = result.filter((ad) => ad.category === categoryFilter)
    }

    // фильтр по цене
    const min = minPrice.trim() === '' ? null : Number(minPrice)
    const max = maxPrice.trim() === '' ? null : Number(maxPrice)

    if (min !== null && !Number.isNaN(min)) {
      result = result.filter((ad) => ad.price >= min)
    }
    if (max !== null && !Number.isNaN(max)) {
      result = result.filter((ad) => ad.price <= max)
    }

    // поиск по названию
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter((ad) =>
        ad.title.toLowerCase().includes(q)
      )
    }

    // сортировка
    result.sort((a, b) => {
      switch (sort) {
        case 'createdAt_desc': {
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          )
        }
        case 'createdAt_asc': {
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          )
        }
        case 'price_asc':
          return a.price - b.price
        case 'price_desc':
          return b.price - a.price
        case 'priority': {
          const prio = (p: string | undefined) =>
            p === 'urgent' ? 1 : 0
          return prio(b.priority) - prio(a.priority)
        }
        case 'none':
        default:
          return 0
      }
    })

    return result
  }, [
    safeAds,
    statusFilter,
    categoryFilter,
    minPrice,
    maxPrice,
    search,
    sort,
  ])

  // пагинация по отфильтрованному списку
  const totalItems = filteredAndSortedAds.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pageAds = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return filteredAndSortedAds.slice(start, end)
  }, [filteredAndSortedAds, currentPage])

  // состояния загрузки / ошибок
  if (isLoading && !adsData) {
    return <Typography>Загрузка объявлений…</Typography>
  }

  if (isError || !adsData) {
    return (
      <Typography color="error">
        Не удалось загрузить объявления
      </Typography>
    )
  }

  if (isHtmlResponse) {
    return (
      <Typography color="error">
        Сервер вернул HTML вместо JSON (запрос ушёл не в API).
      </Typography>
    )
  }

  const handleResetFilters = () => {
    setStatusFilter([])
    setCategoryFilter('all')
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
    setSort('none')
    setPage(1)
  }

  return (
    <Stack spacing={2} direction="column">
      {/* заголовок */}
      <Typography variant="h5">Список объявлений</Typography>

      {/* ФИЛЬТРЫ */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Фильтры
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          {/* статус — множественный выбор */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-label">Статус</InputLabel>
            <Select
              labelId="status-label"
              multiple
              label="Статус"
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value
                const arr =
                  typeof value === 'string'
                    ? (value.split(',') as StatusFilter[])
                    : (value as StatusFilter[])
                setStatusFilter(arr)
                setPage(1)
              }}
              renderValue={(selected) =>
                (selected as StatusFilter[]).length === 0
                  ? 'Все'
                  : (selected as StatusFilter[])
                      .map((s) => statusLabels[s])
                      .join(', ')
              }
            >
              <MenuItem value="pending">На модерации</MenuItem>
              <MenuItem value="approved">Одобрено</MenuItem>
              <MenuItem value="rejected">Отклонено</MenuItem>
              <MenuItem value="draft">Черновик</MenuItem>
            </Select>
          </FormControl>

          {/* категория */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="category-label">Категория</InputLabel>
            <Select
              labelId="category-label"
              label="Категория"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
            >
              <MenuItem value="all">Все</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* диапазон цен */}
          <TextField
            size="small"
            label="Цена от"
            type="number"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value)
              setPage(1)
            }}
            sx={{ width: 120 }}
          />
          <TextField
            size="small"
            label="Цена до"
            type="number"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              setPage(1)
            }}
            sx={{ width: 120 }}
          />
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          {/* поиск только по названию */}
          <TextField
            size="small"
            label="Поиск"
            placeholder="Название объявления"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />

          {/* сортировка */}
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="sort-label">Сортировка</InputLabel>
            <Select
              labelId="sort-label"
              label="Сортировка"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption)
                setPage(1)
              }}
            >
              <MenuItem value="none">Без сортировки</MenuItem>
              <MenuItem value="createdAt_desc">
                По дате (новые → старые)
              </MenuItem>
              <MenuItem value="createdAt_asc">
                По дате (старые → новые)
              </MenuItem>
              <MenuItem value="price_asc">
                По цене (возрастание)
              </MenuItem>
              <MenuItem value="price_desc">
                По цене (убывание)
              </MenuItem>
              <MenuItem value="priority">
                По приоритету (срочные вперёд)
              </MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handleResetFilters}>
            Сбросить фильтры
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Найдено объявлений: {totalItems}
        </Typography>
      </Paper>

      {/* СПИСОК ОБЪЯВЛЕНИЙ (только текущая страница) */}
      <Stack spacing={2}>
        {pageAds.map((ad) => {
          const createdDate = new Date(ad.createdAt).toLocaleDateString(
            'ru-RU'
          )
          const handleOpen = () => {
            navigate(`/item/${ad.id}`)
          }
          const isUrgent = ad.priority === 'urgent'
          const imageUrl =
            (ad.images && ad.images[0]) ||
            'https://via.placeholder.com/80x80?text=No+Image'

          return (
            <Paper
              key={ad.id}
              sx={{ p: 2, cursor: 'pointer' }}
              onClick={handleOpen}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
              >
                {/* блок слева: картинка + текст */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={ad.title}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 1,
                      objectFit: 'cover',
                      bgcolor: 'grey.200',
                    }}
                  />
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle1">
                        {ad.title}
                      </Typography>
                      {isUrgent && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{
                            border: '1px solid',
                            borderRadius: 1,
                            px: 0.5,
                          }}
                        >
                          Срочно
                        </Typography>
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {ad.category} • {ad.price.toLocaleString('ru-RU')} ₽ •{' '}
                      {createdDate}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Статус:{' '}
                      {statusLabels[ad.status as StatusFilter] ??
                        ad.status}{' '}
                      • Приоритет:{' '}
                      {isUrgent ? 'срочный' : 'обычный'}
                    </Typography>
                  </Box>
                </Stack>

                {/* кнопка справа */}
                <Button
                  variant="contained"
                  component={Link}
                  to={`/item/${ad.id}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/item/${ad.id}`)
                  }}
                >
                  Открыть
                </Button>
              </Stack>
            </Paper>
          )
        })}

        {pageAds.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            По выбранным фильтрам объявлений нет
          </Typography>
        )}
      </Stack>

      {/* ПАГИНАЦИЯ по отфильтрованному списку */}
      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
          <Pagination
            page={currentPage}
            count={totalPages}
            onChange={(_, value) => {
              setPage(value)
            }}
          />
        </Stack>
      )}

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: 'center' }}
      >
        Страница {currentPage} из {totalPages} • Всего {totalItems} объявлений
      </Typography>
    </Stack>
  )
}

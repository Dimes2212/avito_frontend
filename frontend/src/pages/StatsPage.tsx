import { useState, useMemo } from 'react'
import {
  Paper,
  Typography,
  Stack,
  Button,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import {
  fetchSummaryStats,
  fetchActivityChart,
  fetchDecisionsChart,
  fetchCategoriesChart,
  type Period,
  type SummaryStats,
  type ActivityPoint,
  type DecisionsChart,
  type CategoriesChart,
} from '../api/stats'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'

const DECISION_COLORS = ['#4caf50', '#f44336', '#ffb300']
const CATEGORY_COLORS = ['#1976d2', '#9c27b0', '#ff9800', '#4caf50', '#e91e63']

export default function StatsPage() {
  //выбор периода (по умолчанию — неделя)
  const [period, setPeriod] = useState<Period>('week')

  //общая статистика
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useQuery<SummaryStats>({
    queryKey: ['stats', 'summary'],
    queryFn: ({ signal }) => fetchSummaryStats(signal),
  })

  // 🔹 активность по дням
  const {
    data: activity,
    isLoading: isActivityLoading,
    isError: isActivityError,
  } = useQuery<ActivityPoint[]>({
    queryKey: ['stats', 'activity', period],
    queryFn: ({ signal }) => fetchActivityChart(period, signal),
  })

  //распределение решений
  const {
    data: decisions,
    isLoading: isDecisionsLoading,
    isError: isDecisionsError,
  } = useQuery<DecisionsChart>({
    queryKey: ['stats', 'decisions', period],
    queryFn: ({ signal }) => fetchDecisionsChart(period, signal),
  })

  //график по категориям
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery<CategoriesChart>({
    queryKey: ['stats', 'categories', period],
    queryFn: ({ signal }) => fetchCategoriesChart(period, signal),
  })

  // 🔹 данные для бар-чарта решений
  const decisionsBarData = useMemo(() => {
    if (!decisions) return []

    const total =
      decisions.approved +
        decisions.rejected +
        decisions.requestChanges || 1

    return [
      {
        name: 'Одобрено',
        value: decisions.approved,
        percent: (decisions.approved / total) * 100,
      },
      {
        name: 'Отклонено',
        value: decisions.rejected,
        percent: (decisions.rejected / total) * 100,
      },
      {
        name: 'На доработку',
        value: decisions.requestChanges,
        percent: (decisions.requestChanges / total) * 100,
      },
    ]
  }, [decisions])

  // 🔹 данные для графика категорий
  const categoriesBarData = useMemo(() => {
    if (!categories) return []
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }))
  }, [categories])

  const isLoadingAll =
    isSummaryLoading ||
    isActivityLoading ||
    isDecisionsLoading ||
    isCategoriesLoading

  const isErrorAny =
    isSummaryError ||
    isActivityError ||
    isDecisionsError ||
    isCategoriesError

  // 🔹 helper: красиво показываем среднее время проверки
  const formatAvgReviewTime = (seconds: number) => {
    if (!seconds) return '—'
    if (seconds < 60) return `${seconds} с`
    const minutes = Math.round(seconds / 60)
    return `${minutes} мин`
  }

  // 🔹 все хуки уже вызвали — дальше можно возвращать JSX
  if (isLoadingAll && !summary) {
    return <Typography>Загрузка статистики…</Typography>
  }

  if (isErrorAny || !summary) {
    return (
      <Typography color="error">
        Не удалось загрузить статистику
      </Typography>
    )
  }

  return (
    <Stack spacing={3}>
      {/* Заголовок + выбор периода */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
      >
        <Typography variant="h5">Статистика модерации</Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={period === 'today' ? 'contained' : 'outlined'}
            onClick={() => setPeriod('today')}
          >
            Сегодня
          </Button>
          <Button
            size="small"
            variant={period === 'week' ? 'contained' : 'outlined'}
            onClick={() => setPeriod('week')}
          >
            Неделя
          </Button>
          <Button
            size="small"
            variant={period === 'month' ? 'contained' : 'outlined'}
            onClick={() => setPeriod('month')}
          >
            Месяц
          </Button>
        </Stack>
      </Stack>

      {/* 1. Карточки общей статистики */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems="stretch"
      >
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Всего проверено (всё время)
          </Typography>
          <Typography variant="h5">{summary.totalReviewed}</Typography>
          <Typography variant="caption" color="text.secondary">
            Сегодня: {summary.totalReviewedToday} • Неделя:{' '}
            {summary.totalReviewedThisWeek} • Месяц:{' '}
            {summary.totalReviewedThisMonth}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Одобрено
          </Typography>
          <Typography variant="h5">
            {summary.approvedPercentage.toFixed(1)}%
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Отклонено
          </Typography>
          <Typography variant="h5">
            {summary.rejectedPercentage.toFixed(1)}%
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Среднее время на проверку
          </Typography>
          <Typography variant="h5">
            {formatAvgReviewTime(summary.averageReviewTime)}
          </Typography>
        </Paper>
      </Stack>

      {/* 2. Графики: активность + распределение решений */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems="stretch"
      >
        {/* Активность по дням */}
        <Paper sx={{ p: 2, flex: 1, height: 320 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Активность по дням
          </Typography>
          {activity && activity.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activity}
                margin={{ top: 16, right: 16, left: 0, bottom: 40 }}
              >
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" />
                <Bar dataKey="approved" name="Одобрено" stackId="a" />
                <Bar dataKey="rejected" name="Отклонено" stackId="a" />
                <Bar
                  dataKey="requestChanges"
                  name="На доработку"
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Нет данных для выбранного периода
            </Typography>
          )}
        </Paper>

        {/* Распределение решений  */}
        <Paper sx={{ p: 2, flex: 1, height: 320 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Распределение решений
          </Typography>
          {decisionsBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={decisionsBarData}
                margin={{ top: 16, right: 16, left: 0, bottom: 40 }}
              >
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(
                    value: number | string,
                    _name: string,
                    entry: any,
                  ) => {
                    const num = Number(value)
                    const percent = entry?.payload?.percent ?? 0
                    return [
                      `${num} (${percent.toFixed(1)}%)`,
                      entry?.payload?.name,
                    ]
                  }}
                />
                <Legend verticalAlign="bottom" align="center" />
                <Bar dataKey="value" name="Количество">
                  {decisionsBarData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        DECISION_COLORS[index % DECISION_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Нет данных для выбранного периода
            </Typography>
          )}
        </Paper>
      </Stack>

      {/* 3. График по категориям */}
      <Paper sx={{ p: 2, height: 320 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Проверенные объявления по категориям
        </Typography>
        {categoriesBarData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoriesBarData}
              margin={{ top: 16, right: 16, left: 0, bottom: 40 }}
            >
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Количество">
                {categoriesBarData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Нет данных для выбранного периода
          </Typography>
        )}
      </Paper>
    </Stack>
  )
}

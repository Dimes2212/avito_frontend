import { useState, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  fetchAdById,
  type Advertisement,
  approveAd,
  rejectAd,
  requestChanges,
} from '../api/ads'

const REJECTION_REASONS = [
  'Запрещённый товар',
  'Неверная категория',
  'Некорректное описание',
  'Проблемы с фото',
  'Подозрение на мошенничество',
  'Другое',
]

const actionLabels: Record<
  'approved' | 'rejected' | 'requestChanges',
  string
> = {
  approved: 'Одобрено',
  rejected: 'Отклонено',
  requestChanges: 'Запрос на доработку',
}

const statusMap: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  draft: 'Черновик',
}

export default function ItemPage() {
  //ПАРАМЕТРЫ И НАВИГАЦИЯ
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const adId = Number(id)
  const isInvalidId = Number.isNaN(adId)

  //ЛОКАЛЬНОЕ СОСТОЯНИЕ
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [reason, setReason] = useState<string>('')
  const [comment, setComment] = useState<string>('')
  const [formError, setFormError] = useState<string | null>(null)

  //ЗАПРОС ОБЪЯВЛЕНИЯ
  const { data, isLoading, isError } = useQuery<Advertisement>({
    queryKey: ['ad', adId],
    queryFn: ({ signal }) => fetchAdById(adId, signal),
    enabled: !isInvalidId, // хук вызывается всегда, но реально запрос только при нормальном id
  })

  //МУТАЦИИ МОДЕРАЦИИ
  const mutation = useMutation({
    mutationFn: async (payload: {
      type: 'approve' | 'reject' | 'requestChanges'
      reason?: string
      comment?: string
    }) => {
      if (payload.type === 'approve') {
        return await approveAd(adId)
      }

      if (!payload.reason) {
        throw new Error('reason_required')
      }

      const body = {
        reason: payload.reason,
        comment: payload.comment,
      }

      if (payload.type === 'reject') {
        return await rejectAd(adId, body)
      }

      return await requestChanges(adId, body)
    },
    onSuccess: (updatedAd) => {
      // обновляем кеш
      queryClient.setQueryData(['ad', adId], updatedAd)
      queryClient.invalidateQueries({ queryKey: ['ads'] })
      setFormError(null)
    },
    onError: (error: any) => {
      if (error?.message === 'reason_required') {
        setFormError('Укажите причину перед отправкой решения')
      } else {
        setFormError('Не удалось выполнить действие. Попробуйте ещё раз.')
      }
    },
  })

  //МЕМO ДЛЯ ХАРАКТЕРИСТИК
  const characteristicsEntries = useMemo(() => {
    if (!data || !data.characteristics) return []
    return Object.entries(data.characteristics)
  }, [data])

  //ОБРАБОТЧИКИ
  const handleApprove = () => {
    mutation.mutate({ type: 'approve' })
  }

  const handleReject = () => {
    mutation.mutate({ type: 'reject', reason, comment })
  }

  const handleRequestChanges = () => {
    mutation.mutate({ type: 'requestChanges', reason, comment })
  }

  const handleBackToList = () => {
    navigate('/list')
  }

  const handlePrev = () => {
    if (adId > 1) {
      navigate(`/item/${adId - 1}`)
      setActiveImageIndex(0)
      setFormError(null)
    }
  }

  const handleNext = () => {
    navigate(`/item/${adId + 1}`)
    setActiveImageIndex(0)
    setFormError(null)
  }

  //ВСЕ ХУКИ УЖЕ ВЫЗВАЛИ — ТЕПЕРЬ МОЖНО ДЕЛАТЬ RETURN

  if (isInvalidId) {
    return (
      <Typography color="error">
        Некорректный идентификатор объявления
      </Typography>
    )
  }

  if (isLoading && !data) {
    return <Typography>Загрузка объявления…</Typography>
  }

  if (isError || !data) {
    return (
      <Typography color="error">
        Не удалось загрузить объявление
      </Typography>
    )
  }

  const ad = data
  const images = ad.images && ad.images.length > 0 ? ad.images : []
  const activeImage =
    images[activeImageIndex] ||
    'https://via.placeholder.com/600x400?text=No+Image'

  const createdAt = new Date(ad.createdAt).toLocaleString('ru-RU')
  const registeredAt = new Date(
    ad.seller?.registeredAt ?? ad.createdAt
  ).toLocaleDateString('ru-RU')

  const priorityLabel = ad.priority === 'urgent' ? 'Срочное' : 'Обычное'

  return (
    <Stack spacing={2}>
      {/* Навигация */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Button variant="outlined" onClick={handleBackToList}>
          Назад к списку
        </Button>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={handlePrev}
            disabled={adId <= 1}
          >
            Предыдущее
          </Button>
          <Button variant="outlined" onClick={handleNext}>
            Следующее
          </Button>
        </Stack>
      </Stack>

      {/* Верхний блок: галерея + краткая инфа */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
      >
        {/* Галерея изображений */}
        <Paper sx={{ p: 2, flex: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Фотографии
          </Typography>

          <Box
            component="img"
            src={activeImage}
            alt={ad.title}
            sx={{
              width: '100%',
              maxHeight: 400,
              objectFit: 'cover',
              borderRadius: 2,
              mb: 2,
              bgcolor: 'grey.200',
            }}
          />

          <Stack direction="row" spacing={1}>
            {images.map((img, idx) => (
              <Box
                key={img}
                component="img"
                src={img}
                alt={`${ad.title} ${idx + 1}`}
                onClick={() => setActiveImageIndex(idx)}
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  border:
                    idx === activeImageIndex
                      ? '2px solid #1976d2'
                      : '1px solid rgba(0,0,0,0.12)',
                }}
              />
            ))}
            {images.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Изображения отсутствуют
              </Typography>
            )}
          </Stack>
        </Paper>

        {/* Основная информация */}
        <Paper sx={{ p: 2, flex: 1, minWidth: 280 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {ad.title}
          </Typography>

          <Typography variant="h5" sx={{ mb: 1 }}>
            {ad.price.toLocaleString('ru-RU')} ₽
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
            <Chip label={ad.category} size="small" />
            <Chip
              label={priorityLabel}
              size="small"
              color={ad.priority === 'urgent' ? 'error' : 'default'}
            />
            <Chip
              label={statusMap[ad.status] ?? ad.status}
              size="small"
              color={
                ad.status === 'approved'
                  ? 'success'
                  : ad.status === 'rejected'
                    ? 'error'
                    : 'warning'
              }
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Создано: {createdAt}
          </Typography>
        </Paper>
      </Stack>

      {/* Описание + характеристики */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems="flex-start"
      >
        <Paper sx={{ p: 2, flex: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Описание
          </Typography>
          <Typography variant="body2">{ad.description}</Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, minWidth: 280 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Характеристики
          </Typography>
          {characteristicsEntries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Нет дополнительных характеристик
            </Typography>
          ) : (
            <Table size="small">
              <TableBody>
                {characteristicsEntries.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell
                      sx={{ fontWeight: 500, width: '40%' }}
                    >
                      {key}
                    </TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Stack>

      {/* Продавец + история модерации + панель действий */}
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        alignItems="flex-start"
      >
        {/* Продавец */}
        <Paper sx={{ p: 2, flex: 1, minWidth: 280 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Продавец
          </Typography>
          <Typography variant="body1">{ad.seller.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Рейтинг: {ad.seller.rating} / 5
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Объявлений: {ad.seller.totalAds}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            На платформе с: {registeredAt}
          </Typography>
        </Paper>

        {/* История модерации */}
        <Paper sx={{ p: 2, flex: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            История модерации
          </Typography>

          {ad.moderationHistory && ad.moderationHistory.length > 0 ? (
            <Stack spacing={1}>
              {ad.moderationHistory.map((item) => {
                const dt = new Date(item.createdAt).toLocaleString(
                  'ru-RU'
                )
                return (
                  <Box key={item.id}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography variant="body2">
                        {item.moderatorName}
                      </Typography>
                      <Chip
                        size="small"
                        label={actionLabels[item.action]}
                        color={
                          item.action === 'approved'
                            ? 'success'
                            : item.action === 'rejected'
                              ? 'error'
                              : 'warning'
                        }
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {dt}
                      </Typography>
                    </Stack>
                    {item.reason && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Причина: {item.reason}
                      </Typography>
                    )}
                    {item.comment && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        Комментарий: {item.comment}
                      </Typography>
                    )}
                    <Divider sx={{ my: 1 }} />
                  </Box>
                )
              })}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              История модерации пока пустая
            </Typography>
          )}
        </Paper>

        {/* Панель действий модератора */}
        <Paper sx={{ p: 2, flex: 1, minWidth: 280 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Действия модератора
          </Typography>

          <Stack spacing={1} sx={{ mb: 2 }}>
            <FormControl size="small">
              <InputLabel id="reason-label">
                Причина решения
              </InputLabel>
              <Select
                labelId="reason-label"
                label="Причина решения"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setFormError(null)
                }}
              >
                {REJECTION_REASONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Комментарий"
              multiline
              minRows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Stack>

          {formError && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 1 }}
            >
              {formError}
            </Typography>
          )}

          <Stack spacing={1}>
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              disabled={mutation.isPending}
            >
              Одобрить
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={mutation.isPending}
            >
              Отклонить
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleRequestChanges}
              disabled={mutation.isPending}
            >
              Вернуть на доработку
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  )
}

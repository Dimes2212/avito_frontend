import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type ModerationFilter = 'all' | 'pending' | 'approved' | 'rejected'

interface UiState {
  filter: ModerationFilter
  page: number
  perPage: number
  search: string
}

const initialState: UiState = {
  filter: 'pending',
  page: 1,
  perPage: 20,
  search: '',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFilter: (s, a: PayloadAction<ModerationFilter>) => {
      s.filter = a.payload
      s.page = 1
    },
    setPage: (s, a: PayloadAction<number>) => {
      s.page = a.payload
    },
    setPerPage: (s, a: PayloadAction<number>) => {
      s.perPage = a.payload
      s.page = 1
    },
    setSearch: (s, a: PayloadAction<string>) => {
      s.search = a.payload
      s.page = 1
    },
  },
})

export const { setFilter, setPage, setPerPage, setSearch } = uiSlice.actions
export default uiSlice.reducer

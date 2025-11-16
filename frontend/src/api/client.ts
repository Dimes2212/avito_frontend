import axios from 'axios'

const BASE_URL = '/api/v1'

console.log('API base URL =', BASE_URL)

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

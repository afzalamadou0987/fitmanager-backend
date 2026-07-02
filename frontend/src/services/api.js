import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('fm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fm_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
  me: () => api.get('/auth/me')
}

export const membersAPI = {
  getAll: p => api.get('/members', { params: p }),
  getById: id => api.get(`/members/${id}`),
  create: d => api.post('/members', d),
  update: (id, d) => api.put(`/members/${id}`, d),
  remove: id => api.delete(`/members/${id}`),
  getStats: () => api.get('/members/stats/summary'),
  getByQR: qr => api.get(`/members/qr/${qr}`)
}

export const subscriptionsAPI = {
  create: d => api.post('/subscriptions', d),
  getExpiring: days => api.get('/subscriptions/expiring', { params: { days } }),
  getMemberHistory: id => api.get(`/subscriptions/member/${id}`),
  cancel: id => api.patch(`/subscriptions/${id}/cancel`)
}

export const plansAPI = {
  getAll: () => api.get('/plans'),
  create: d => api.post('/plans', d),
  update: (id, d) => api.put(`/plans/${id}`, d),
  remove: id => api.delete(`/plans/${id}`)
}

export default api

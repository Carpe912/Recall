import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data?.message || '请求失败'),
)

export const authApi = {
  login: (username: string, password: string) =>
    http.post('/auth/login', { username, password }),
}

export const foldersApi = {
  list: ()                          => http.get('/folders'),
  create: (name: string, parentId?: string) => http.post('/folders', { name, parentId }),
  update: (id: string, data: any)   => http.put(`/folders/${id}`, data),
  remove: (id: string)              => http.delete(`/folders/${id}`),
}

export const documentsApi = {
  list: (folderId?: string) =>
    http.get('/documents', { params: folderId !== undefined ? { folderId } : {} }),
  get: (id: string)                 => http.get(`/documents/${id}`),
  create: (data: any)               => http.post('/documents', data),
  update: (id: string, data: any)   => http.put(`/documents/${id}`, data),
  remove: (id: string)              => http.delete(`/documents/${id}`),
}

export const filesApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post('/files/upload', form)
  },
}

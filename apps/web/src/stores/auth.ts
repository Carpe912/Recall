import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')

  const isLoggedIn = () => !!token.value

  async function login(u: string, p: string) {
    const res: any = await authApi.login(u, p)
    token.value = res.access_token
    username.value = res.username
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('username', res.username)
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  return { token, username, isLoggedIn, login, logout }
})

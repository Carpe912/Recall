<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo">
        <span class="logo-icon">✦</span>
        <span class="logo-text">Recall</span>
      </div>
      <p class="subtitle">你的个人知识空间</p>

      <form @submit.prevent="handleLogin" class="form">
        <div class="field">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="输入用户名" autocomplete="username" />
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="输入密码" autocomplete="current-password" />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn-login">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const username = ref('admin')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) { error.value = '请填写用户名和密码'; return }
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = typeof e === 'string' ? e : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.login-card {
  width: 360px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.logo-icon {
  font-size: 22px;
  color: #2563eb;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.03em;
}

.subtitle {
  font-size: 13.5px;
  color: #6b7280;
  margin-bottom: 28px;
}

.form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }

.field label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.field input {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus { border-color: #2563eb; }

.error {
  font-size: 13px;
  color: #ef4444;
  margin-top: -6px;
}

.btn-login {
  margin-top: 4px;
  padding: 10px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-login:hover { background: #1d4ed8; }
.btn-login:disabled { background: #93c5fd; cursor: not-allowed; }
</style>

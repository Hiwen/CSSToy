<template>
  <div class="login-container">
    <div class="login-form card">
      <h2>用户登录</h2>
      
      <div v-if="error" class="form-error">{{ error }}</div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            class="form-input" 
            v-model="form.email"
            placeholder="请输入邮箱地址"
            required
          >
        </div>
        
        <div class="form-group">
          <label class="form-label" for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            class="form-input" 
            v-model="form.password"
            placeholder="请输入密码"
            required
          >
        </div>
        
        <div class="form-group checkbox">
          <input 
            type="checkbox" 
            id="remember" 
            v-model="form.remember"
          >
          <label for="remember">记住登录状态</label>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary full-width"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      
      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
      
      <div class="forgot-password">
        <a href="#" class="link" @click.prevent="showForgotPassword = true">忘记密码？</a>
      </div>
    </div>
    
    <!-- 忘记密码弹窗 -->
    <div v-if="showForgotPassword" class="modal-overlay" @click="closeForgotPassword">
      <div class="modal-content card" @click.stop>
        <h3>找回密码</h3>
        
        <div v-if="resetError" class="form-error">{{ resetError }}</div>
        <div v-if="resetSuccess" class="form-success">{{ resetSuccess }}</div>
        
        <form @submit.prevent="handlePasswordReset">
          <div class="form-group">
            <label class="form-label" for="resetEmail">邮箱</label>
            <input 
              type="email" 
              id="resetEmail" 
              class="form-input" 
              v-model="resetForm.email"
              placeholder="请输入注册时的邮箱"
              required
            >
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary full-width"
            :disabled="resetLoading"
          >
            {{ resetLoading ? '处理中...' : '发送重置链接' }}
          </button>
        </form>
        
        <button class="btn btn-secondary full-width mt-2" @click="closeForgotPassword">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  email: '',
  password: '',
  remember: false
})

const resetForm = ref({
  email: ''
})

const loading = ref(false)
const error = ref('')
const showForgotPassword = ref(false)
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref('')

const handleSubmit = async () => {
  error.value = ''
  
  try {
    loading.value = true
    await userStore.login(form.value.email, form.value.password, form.value.remember)
    router.push('/')
  } catch (err) {
    error.value = userStore.error || '登录失败，请检查邮箱和密码'
  } finally {
    loading.value = false
  }
}

const handlePasswordReset = async () => {
  resetError.value = ''
  resetSuccess.value = ''
  
  try {
    resetLoading.value = true
    // 这里可以添加密码重置的API调用
    // await axios.post('/api/auth/reset-password', { email: resetForm.value.email })
    
    resetSuccess.value = '密码重置链接已发送到您的邮箱'
    
    // 3秒后关闭弹窗
    setTimeout(() => {
      closeForgotPassword()
    }, 3000)
  } catch (err) {
    resetError.value = '发送失败，请稍后重试'
  } finally {
    resetLoading.value = false
  }
}

const closeForgotPassword = () => {
  showForgotPassword.value = false
  resetForm.value.email = ''
  resetError.value = ''
  resetSuccess.value = ''
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group.checkbox input {
  width: auto;
}

.full-width {
  width: 100%;
}

.login-footer {
  margin-top: 20px;
  text-align: center;
}

.forgot-password {
  text-align: center;
  margin-top: 15px;
}

.link {
  color: #3498db;
  text-decoration: none;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.form-success {
  color: #2ecc71;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #d4edda;
  border-radius: 4px;
  text-align: center;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 20px;
  text-align: center;
}

.mt-2 {
  margin-top: 10px;
}
</style>
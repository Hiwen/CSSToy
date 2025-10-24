<template>
  <div class="register-container">
    <div class="register-form card">
      <h2>用户注册</h2>
      
      <div v-if="error" class="form-error">{{ error }}</div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            class="form-input" 
            v-model="form.username"
            placeholder="请输入用户名"
            required
          >
          <div v-if="errors.username" class="form-error">{{ errors.username }}</div>
        </div>
        
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
          <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            class="form-input" 
            v-model="form.password"
            placeholder="请设置密码（至少8位，包含字母和数字）"
            required
          >
          <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            class="form-input" 
            v-model="form.confirmPassword"
            placeholder="请再次输入密码"
            required
          >
          <div v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="resetQuestion">找回密码问题（选填）</label>
          <input 
            type="text" 
            id="resetQuestion" 
            class="form-input" 
            v-model="form.resetQuestion"
            placeholder="例如：您的第一个宠物名字是？"
          >
        </div>
        
        <div class="form-group">
          <label class="form-label" for="resetAnswer">找回密码答案（选填）</label>
          <input 
            type="text" 
            id="resetAnswer" 
            class="form-input" 
            v-model="form.resetAnswer"
            placeholder="请输入答案"
          >
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary full-width"
          :disabled="loading"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="register-footer">
        <span>已有账号？</span>
        <router-link to="/login" class="link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

export default {
  name: 'Register',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    
    const form = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      resetQuestion: '',
      resetAnswer: ''
    })
    
    const errors = reactive({})
    const loading = ref(false)
    const error = ref('')
    
    const validateForm = () => {
      let isValid = true
      errors.username = ''
      errors.email = ''
      errors.password = ''
      errors.confirmPassword = ''
      
      // 验证用户名
      if (!form.username.trim()) {
        errors.username = '用户名不能为空'
        isValid = false
      } else if (form.username.length < 3 || form.username.length > 20) {
        errors.username = '用户名长度应在3-20个字符之间'
        isValid = false
      }
      
      // 验证邮箱
      if (!form.email.trim()) {
        errors.email = '邮箱不能为空'
        isValid = false
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
          errors.email = '请输入有效的邮箱地址'
          isValid = false
        }
      }
      
      // 验证密码
      if (!form.password) {
        errors.password = '密码不能为空'
        isValid = false
      } else if (form.password.length < 8) {
        errors.password = '密码长度至少为8位'
        isValid = false
      } else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
        errors.password = '密码必须包含字母和数字'
        isValid = false
      }
      
      // 验证确认密码
      if (!form.confirmPassword) {
        errors.confirmPassword = '请确认密码'
        isValid = false
      } else if (form.confirmPassword !== form.password) {
        errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }
      
      return isValid
    }
    
    const handleSubmit = async () => {
      // 先进行前端验证
      if (!validateForm()) {
        return
      }
      
      error.value = ''
      
      try {
        loading.value = true
        await userStore.register(
          form.username,
          form.email,
          form.password,
          form.confirmPassword,
          form.resetQuestion,
          form.resetAnswer
        )
        router.push('/')
      } catch (err) {
        error.value = userStore.error || '注册失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }
    
    return {
      form,
      errors,
      loading,
      error,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 50px auto;
}

.register-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.full-width {
  width: 100%;
}

.register-footer {
  margin-top: 20px;
  text-align: center;
}

.link {
  color: #3498db;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
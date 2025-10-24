import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),
  
  actions: {
    async login(email, password, remember) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/login', { email, password, remember })
        const { token, user } = response.data
        
        // 保存token
        localStorage.setItem('token', token)
        
        // 设置axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        this.user = user
        return user
      } catch (error) {
        this.error = error.response?.data?.error || '登录失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async register(username, email, password, confirmPassword, resetQuestion, resetAnswer) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/auth/register', {
          username,
          email,
          password,
          confirmPassword,
          resetQuestion,
          resetAnswer
        })
        
        const { token, user } = response.data
        
        // 保存token
        localStorage.setItem('token', token)
        
        // 设置axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        this.user = user
        return user
      } catch (error) {
        this.error = error.response?.data?.error || '注册失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchUserInfo() {
      const token = localStorage.getItem('token')
      if (!token) return
      
      this.loading = true
      this.error = null
      
      try {
        // 设置axios默认请求头
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        const response = await axios.get('/api/users/profile')
        this.user = response.data
        return this.user
      } catch (error) {
        // token无效，清除本地存储
        this.logout()
        throw error
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      this.user = null
    },
    
    async updateProfile(username, avatar) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put('/api/users/profile', { username, avatar })
        this.user = response.data
        return this.user
      } catch (error) {
        this.error = error.response?.data?.error || '更新失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async changePassword(oldPassword, newPassword, confirmPassword) {
      this.loading = true
      this.error = null
      
      try {
        await axios.put('/api/users/password', {
          oldPassword,
          newPassword,
          confirmPassword
        })
        return true
      } catch (error) {
        this.error = error.response?.data?.error || '修改密码失败'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
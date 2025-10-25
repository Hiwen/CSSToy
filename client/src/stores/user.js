import { defineStore } from 'pinia'
import axios from 'axios'

// 配置axios基础URL
axios.defaults.baseURL = 'http://localhost:3000'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
    error: null
  }),
  
  getters: {
    isLoggedIn: (state) => {
      return !!state.user
    }
  },
  
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
    },

    // 获取用户统计数据
    async getUserStats() {
      try {
        // 由于后端没有专门的统计API，这里返回一个模拟对象
        // 实际项目中应该有一个专门的API端点来获取这些统计数据
        return {
          total_snippets: 0,
          total_likes: 0,
          total_favorites: 0,
          total_comments: 0
        }
      } catch (error) {
        this.error = error.response?.data?.error || '获取统计数据失败'
        throw error
      }
    },

    // 获取用户的代码段
    async getUserSnippets(page = 1, limit = 12) {
      try {
        const response = await axios.get('/api/users/my-cssnippets', {
          params: { page, limit }
        })
        return {
          results: response.data.cssnippets || [],
          total: response.data.pagination?.total || 0
        }
      } catch (error) {
        this.error = error.response?.data?.error || '获取代码段失败'
        throw error
      }
    },

    // 获取用户点赞的代码段
    async getLikedSnippets(page = 1, limit = 12) {
      try {
        const response = await axios.get('/api/users/liked-cssnippets', {
          params: { page, limit }
        })
        return {
          results: response.data.cssnippets || [],
          total: response.data.pagination?.total || 0
        }
      } catch (error) {
        this.error = error.response?.data?.error || '获取点赞代码段失败'
        throw error
      }
    },

    // 获取用户收藏的代码段
    async getFavoritedSnippets(page = 1, limit = 12) {
      try {
        const response = await axios.get('/api/users/collected-cssnippets', {
          params: { page, limit }
        })
        return {
          results: response.data.cssnippets || [],
          total: response.data.pagination?.total || 0
        }
      } catch (error) {
        this.error = error.response?.data?.error || '获取收藏代码段失败'
        throw error
      }
    },

    // 获取用户的评论
    async getUserComments(page = 1, limit = 12) {
      try {
        // 这里暂时返回空数据，因为后端可能没有专门的评论API
        // 实际项目中应该有一个专门的API端点来获取用户的评论
        return {
          results: [],
          total: 0
        }
      } catch (error) {
        this.error = error.response?.data?.error || '获取评论失败'
        throw error
      }
    }
  }
})
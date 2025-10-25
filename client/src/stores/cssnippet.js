import { defineStore } from 'pinia'
import axios from 'axios'

// 配置axios基础URL
axios.defaults.baseURL = 'http://localhost:3000'

const cssnippetStore = defineStore('cssnippet', {
  state: () => ({
    popular: [],
    latest: [],
    current: null,
    loading: false,
    error: null,
    pagination: {
      popular: { page: 1, total: 0, pages: 0 },
      latest: { page: 1, total: 0, pages: 0 }
    }
  }),
  
  actions: {
    async fetchPopular(page = 1, limit = 12) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/cssnippets/popular', {
          params: { page, limit }
        })
        
        this.popular = response.data.cssnippets
        this.pagination.popular = response.data.pagination
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || '获取热门代码段失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchLatest(page = 1, limit = 12) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get('/api/cssnippets/latest', {
          params: { page, limit }
        })
        
        this.latest = response.data.cssnippets
        this.pagination.latest = response.data.pagination
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || '获取最新代码段失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchById(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`/api/cssnippets/${id}`)
        this.current = response.data
        return this.current
      } catch (error) {
        this.error = error.response?.data?.error || '获取代码段详情失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async create(data) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/api/cssnippets', data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || '创建代码段失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async update(id, data) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put(`/api/cssnippets/${id}`, data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || '更新代码段失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async delete(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.delete(`/api/cssnippets/${id}`)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || '删除代码段失败'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 为兼容组件调用添加的别名方法
    async deleteCssnippet(id) {
      return this.delete(id)
    },
    
    async toggleLike(id) {
      try {
        // 先检查当前状态
        const isCurrentlyLiked = this.current && this.current.isLiked
        
        if (isCurrentlyLiked) {
          await axios.delete(`/api/cssnippets/${id}/like`)
          if (this.current) {
            this.current.isLiked = false
            this.current.likes_count = Math.max(0, this.current.likes_count - 1)
          }
        } else {
          await axios.post(`/api/cssnippets/${id}/like`)
          if (this.current) {
            this.current.isLiked = true
            this.current.likes_count += 1
          }
        }
        
        // 更新列表中的数据
        this.updateListEntry(id, 'likes_count', this.current ? this.current.likes_count : 0)
        
        return !isCurrentlyLiked
      } catch (error) {
        throw error
      }
    },
    
    async toggleCollect(id) {
      try {
        // 先检查当前状态
        const isCurrentlyCollected = this.current && this.current.isCollected
        
        if (isCurrentlyCollected) {
          await axios.delete(`/api/cssnippets/${id}/collect`)
          if (this.current) {
            this.current.isCollected = false
            this.current.collections_count = Math.max(0, this.current.collections_count - 1)
          }
        } else {
          await axios.post(`/api/cssnippets/${id}/collect`)
          if (this.current) {
            this.current.isCollected = true
            this.current.collections_count += 1
          }
        }
        
        // 更新列表中的数据
        this.updateListEntry(id, 'collections_count', this.current ? this.current.collections_count : 0)
        
        return !isCurrentlyCollected
      } catch (error) {
        throw error
      }
    },
    
    async fetchVersions(id) {
      try {
        const response = await axios.get(`/api/cssnippets/${id}/versions`)
        return response.data
      } catch (error) {
        throw error
      }
    },
    
    // 辅助方法：更新列表中的条目
    updateListEntry(id, field, value) {
      const updateEntry = (list) => {
        const index = list.findIndex(item => item.id === id)
        if (index !== -1) {
          list[index][field] = value
        }
      }
      
      updateEntry(this.popular)
      updateEntry(this.latest)
    },
    
    // 获取代码段详情（与fetchById功能相同，为兼容组件调用）
    async getCssnippetDetail(id) {
      return this.fetchById(id)
    },
    
    // 添加评论
    async addComment(commentData) {
      try {
        const response = await axios.post('/api/comments', {
          cssnippetId: commentData.cssnippet_id,
          content: commentData.content,
          parentId: commentData.parent_id
        })
        return response.data
      } catch (error) {
        throw error
      }
    },
    
    // 加载评论
    async fetchComments(cssnippetId) {
      try {
        const response = await axios.get(`/api/comments/cssnippet/${cssnippetId}`)
        return response.data
      } catch (error) {
        throw error
      }
    },
    
    // 删除评论
    async deleteComment(commentId) {
      try {
        const response = await axios.delete(`/api/comments/${commentId}`)
        return response.data
      } catch (error) {
        throw error
      }
    }
  }
})

export const useCSSnippetStore = cssnippetStore
export const useCssnippetStore = cssnippetStore
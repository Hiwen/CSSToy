import { defineStore } from 'pinia'
import axios from 'axios'


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
        
        // 从本地store中移除删除的代码段
        this.popular = this.popular.filter(item => item.id !== id)
        this.latest = this.latest.filter(item => item.id !== id)
        
        // 如果当前正在查看的是被删除的代码段，清空current
        if (this.current && this.current.id === id) {
          this.current = null
        }
        
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
        // 尝试从当前列表或详情中获取当前状态
        let isCurrentlyLiked = false
        let currentLikesCount = 0
        
        // 先检查当前列表中的状态
        let foundInList = false
        for (const list of [this.popular, this.latest]) {
          const item = list.find(i => i.id === id)
          if (item) {
            isCurrentlyLiked = item.isLiked || false
            currentLikesCount = item.likes_count || 0
            foundInList = true
            break
          }
        }
        
        // 如果列表中没有，检查详情
        if (!foundInList && this.current && this.current.id === id) {
          isCurrentlyLiked = this.current.isLiked || false
          currentLikesCount = this.current.likes_count || 0
        }
        
        // 执行API调用
        try {
          if (isCurrentlyLiked) {
            await axios.delete(`/api/cssnippets/${id}/like`)
          } else {
            await axios.post(`/api/cssnippets/${id}/like`)
          }
          
          // 计算新的状态
          const newLikeStatus = !isCurrentlyLiked
          const newLikesCount = newLikeStatus 
            ? currentLikesCount + 1 
            : Math.max(0, currentLikesCount - 1)
          
          // 更新详情中的状态
          if (this.current && this.current.id === id) {
            this.current.isLiked = newLikeStatus
            this.current.likes_count = newLikesCount
          }
          
          // 更新列表中的数据 - 更新likes_count和isLiked
          this.updateListEntry(id, 'likes_count', newLikesCount)
          this.updateListEntry(id, 'isLiked', newLikeStatus)
          
          return newLikeStatus
        } catch (apiError) {
          // 处理API特定错误
          if (apiError.response) {
            // 检查是否是已点赞错误
            if (apiError.response.data?.error === '已经点过赞了' && !isCurrentlyLiked) {
              // 后端显示已点赞，但前端认为未点赞，需要同步状态
              console.log('同步点赞状态：将UI更新为已点赞')
              const newLikeStatus = true
              const newLikesCount = currentLikesCount + 1
              
              // 更新状态
              if (this.current && this.current.id === id) {
                this.current.isLiked = newLikeStatus
                this.current.likes_count = newLikesCount
              }
              
              this.updateListEntry(id, 'likes_count', newLikesCount)
              this.updateListEntry(id, 'isLiked', newLikeStatus)
              
              return newLikeStatus
            }
            // 检查是否是未点赞错误
            else if (apiError.response.data?.error === '未点赞' && isCurrentlyLiked) {
              // 后端显示未点赞，但前端认为已点赞，需要同步状态
              console.log('同步点赞状态：将UI更新为未点赞')
              const newLikeStatus = false
              const newLikesCount = Math.max(0, currentLikesCount - 1)
              
              // 更新状态
              if (this.current && this.current.id === id) {
                this.current.isLiked = newLikeStatus
                this.current.likes_count = newLikesCount
              }
              
              this.updateListEntry(id, 'likes_count', newLikesCount)
              this.updateListEntry(id, 'isLiked', newLikeStatus)
              
              return newLikeStatus
            }
          }
          // 如果不是已知的状态同步错误，重新抛出
          throw apiError
        }
      } catch (error) {
        console.error('Failed to toggle like:', error)
        throw error
      }
    },
    
    async toggleCollect(id) {
      try {
        // 尝试从当前列表或详情中获取当前状态
        let isCurrentlyCollected = false
        let currentFavoriteCount = 0
        
        // 先检查当前列表中的状态
        let foundInList = false
        for (const list of [this.popular, this.latest]) {
          const item = list.find(i => i.id === id)
          if (item) {
            isCurrentlyCollected = item.isCollected || false
            currentFavoriteCount = item.favorite_count || item.collections_count || 0
            foundInList = true
            break
          }
        }
        
        // 如果列表中没有，检查详情
        if (!foundInList && this.current && this.current.id === id) {
          isCurrentlyCollected = this.current.isCollected || false
          currentFavoriteCount = this.current.favorite_count || this.current.collections_count || 0
        }
        
        // 执行API调用
        try {
          if (isCurrentlyCollected) {
            await axios.delete(`/api/cssnippets/${id}/collect`)
          } else {
            await axios.post(`/api/cssnippets/${id}/collect`)
          }
          
          // 计算新的状态
          const newCollectStatus = !isCurrentlyCollected
          const newFavoriteCount = newCollectStatus 
            ? currentFavoriteCount + 1 
            : Math.max(0, currentFavoriteCount - 1)
          
          // 更新详情中的状态
          if (this.current && this.current.id === id) {
            this.current.isCollected = newCollectStatus
            this.current.favorite_count = newFavoriteCount
            this.current.collections_count = newFavoriteCount // 保持兼容
          }
          
          // 更新列表中的数据 - 更新favorite_count、collections_count和isCollected
          this.updateListEntry(id, 'favorite_count', newFavoriteCount)
          this.updateListEntry(id, 'collections_count', newFavoriteCount) // 保持兼容
          this.updateListEntry(id, 'isCollected', newCollectStatus)
          
          return newCollectStatus
        } catch (apiError) {
          // 处理API特定错误
          if (apiError.response) {
            // 检查是否是已收藏错误
            if (apiError.response.data?.error === '已经收藏过了' && !isCurrentlyCollected) {
              // 后端显示已收藏，但前端认为未收藏，需要同步状态
              console.log('同步收藏状态：将UI更新为已收藏')
              const newCollectStatus = true
              const newFavoriteCount = currentFavoriteCount + 1
              
              // 更新状态
              if (this.current && this.current.id === id) {
                this.current.isCollected = newCollectStatus
                this.current.favorite_count = newFavoriteCount
                this.current.collections_count = newFavoriteCount
              }
              
              this.updateListEntry(id, 'favorite_count', newFavoriteCount)
              this.updateListEntry(id, 'collections_count', newFavoriteCount)
              this.updateListEntry(id, 'isCollected', newCollectStatus)
              
              return newCollectStatus
            }
            // 检查是否是未收藏错误
            else if (apiError.response.data?.error === '未收藏' && isCurrentlyCollected) {
              // 后端显示未收藏，但前端认为已收藏，需要同步状态
              console.log('同步收藏状态：将UI更新为未收藏')
              const newCollectStatus = false
              const newFavoriteCount = Math.max(0, currentFavoriteCount - 1)
              
              // 更新状态
              if (this.current && this.current.id === id) {
                this.current.isCollected = newCollectStatus
                this.current.favorite_count = newFavoriteCount
                this.current.collections_count = newFavoriteCount
              }
              
              this.updateListEntry(id, 'favorite_count', newFavoriteCount)
              this.updateListEntry(id, 'collections_count', newFavoriteCount)
              this.updateListEntry(id, 'isCollected', newCollectStatus)
              
              return newCollectStatus
            }
          }
          // 如果不是已知的状态同步错误，重新抛出
          throw apiError
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error)
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
    },
    
    // 切换代码段可见性（公开/私密）
    async toggleVisibility(id) {
      this.loading = true
      
      try {
        // 先获取当前状态
        let currentVisibility = null
        
        // 从列表中查找当前状态
        for (const list of [this.popular, this.latest]) {
          const item = list.find(i => i.id === id)
          if (item) {
            currentVisibility = item.is_public
            break
          }
        }
        
        // 如果列表中没有，从详情中查找
        if (currentVisibility === null && this.current && this.current.id === id) {
          currentVisibility = this.current.is_public
        }
        
        // 执行API调用
        const response = await axios.patch(`/api/cssnippets/${id}/visibility`)
        
        // 计算新的可见性状态
        const newVisibility = currentVisibility !== null ? !currentVisibility : !response.data.is_public
        
        // 更新详情中的状态
        if (this.current && this.current.id === id) {
          this.current.is_public = newVisibility
        }
        
        // 更新列表中的数据
        this.updateListEntry(id, 'is_public', newVisibility)
        
        return response.data
      } catch (error) {
        // 移除对store error状态的设置，让组件通过Notification显示错误
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})

export const useCSSnippetStore = cssnippetStore
export const useCssnippetStore = cssnippetStore
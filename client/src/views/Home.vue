<template>
  <div class="home">
    <div class="home-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'popular' }]" 
        @click="activeTab = 'popular'"
      >
        每周热门
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'latest' }]" 
        @click="activeTab = 'latest'"
      >
        最新上传
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else class="cssnippet-grid">
      <div v-for="cssnippet in currentList" :key="cssnippet.id" class="cssnippet-card card">
        <div class="cssnippet-preview" v-html="getPreviewHTML(cssnippet)"></div>
        <h3 class="cssnippet-title">{{ cssnippet.title }}</h3>
        <p class="cssnippet-description">{{ truncateText(cssnippet.description, 100) }}</p>
        
        <div class="cssnippet-tags">
          <router-link 
            v-for="tag in cssnippet.tags || []" 
            :key="tag.id" 
            :to="{ name: 'Tag', params: { name: tag.name } }"
            class="tag"
          >
            {{ tag.name }}
          </router-link>
        </div>
        
        <div class="cssnippet-info">
          <div class="author-info">
            <img :src="cssnippet.avatar || '/default-avatar.png'" :alt="cssnippet.username" class="avatar small">
            <span>{{ cssnippet.username }}</span>
          </div>
          
          <div class="cssnippet-meta">
            <button class="meta-item btn-icon" @click="toggleLike($event, cssnippet)" :class="{ 'active': cssnippet.isLiked }">
              <span class="icon">{{ cssnippet.isLiked ? '❤️' : '🤍' }}</span>
              <span>{{ cssnippet.likes_count || 0 }}</span>
            </button>
            <button class="meta-item btn-icon" @click="toggleFavorite($event, cssnippet)" :class="{ 'active': cssnippet.isCollected }">
              <span class="icon">{{ cssnippet.isCollected ? '⭐' : '☆' }}</span>
              <span>{{ cssnippet.favorite_count || cssnippet.collections_count || 0 }}</span>
            </button>
            <span class="meta-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 4h14v9H1V4zm12 1H3v7h10V5z"/>
                <circle cx="5" cy="3" r="1"/>
                <circle cx="11" cy="3" r="1"/>
              </svg>
              {{ cssnippet.comments_count || 0 }}
            </span>
          </div>
        </div>
        
        <router-link :to="{ name: 'CSSnippetDetail', params: { id: cssnippet.id } }" class="btn btn-primary full-width">
          查看详情
        </router-link>
      </div>
    </div>
    
    <div v-if="!loading && currentList.length > 0" class="pagination">
      <button 
        class="pagination-btn" 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        上一页
      </button>
      
      <button 
        v-for="page in pageRange" 
        :key="page"
        class="pagination-btn"
        :class="{ active: currentPage === page }"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
      
      <button 
        class="pagination-btn" 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        下一页
      </button>
    </div>
    
    <div v-if="!loading && currentList.length === 0" class="empty-state">
      <p>暂无CSS代码段</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useCSSnippetStore } from '../stores/cssnippet'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

export default {
  name: 'Home',
  setup() {
    const cssnippetStore = useCSSnippetStore()
    const userStore = useUserStore()
    const router = useRouter()
    const activeTab = ref('popular')
    const currentPage = ref(1)
    
    const loading = computed(() => cssnippetStore.loading)
    const error = computed(() => cssnippetStore.error)
    const currentList = computed(() => {
      return activeTab.value === 'popular' ? cssnippetStore.popular : cssnippetStore.latest
    })
    
    const currentPagination = computed(() => {
      return activeTab.value === 'popular' 
        ? cssnippetStore.pagination.popular 
        : cssnippetStore.pagination.latest
    })
    
    const totalPages = computed(() => currentPagination.value.pages || 1)
    
    const pageRange = computed(() => {
      const range = []
      const maxVisible = 5
      let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
      let end = Math.min(totalPages.value, start + maxVisible - 1)
      
      // 调整起始页，确保显示足够的页数
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        range.push(i)
      }
      
      return range
    })
    
    const fetchData = async (page) => {
      if (activeTab.value === 'popular') {
        await cssnippetStore.fetchPopular(page)
      } else {
        await cssnippetStore.fetchLatest(page)
      }
    }
    
    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
        fetchData(page)
      }
    }
    
    const getPreviewHTML = (cssnippet) => {
      // 创建简单的预览HTML结构
      const html = cssnippet.html_content || '<div class="preview-element">示例元素</div>'
      const css = cssnippet.css_content
      
      return `
        <div class="preview-wrapper">
          ${html}
          <style scoped>
            ${css}
          </style>
        </div>
      `
    }
    
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
    
    const toggleLike = async (event, cssnippet) => {
      // 阻止事件冒泡，避免触发卡片点击
      event.stopPropagation()
      event.preventDefault()
      
      if (!userStore.isLoggedIn) {
        // 保存当前页面，以便登录后返回
        localStorage.setItem('redirectAfterLogin', window.location.pathname)
        router.push({ name: 'Login' })
        return
      }

      try {
        // 调用store方法，store会自动处理状态更新
        await cssnippetStore.toggleLike(cssnippet.id)
      } catch (err) {
        console.error('Failed to toggle like:', err)
        // 可以在这里添加用户友好的错误提示
      }
    }
    
    const toggleFavorite = async (event, cssnippet) => {
      // 阻止事件冒泡，避免触发卡片点击
      event.stopPropagation()
      event.preventDefault()
      
      if (!userStore.isLoggedIn) {
        // 保存当前页面，以便登录后返回
        localStorage.setItem('redirectAfterLogin', window.location.pathname)
        router.push({ name: 'Login' })
        return
      }

      try {
        // 调用store方法，store会自动处理状态更新
        await cssnippetStore.toggleCollect(cssnippet.id)
      } catch (err) {
        console.error('Failed to toggle favorite:', err)
        // 可以在这里添加用户友好的错误提示
      }
    }
    
    // 监听标签切换
    watch(activeTab, () => {
      currentPage.value = 1
      fetchData(1)
    })
    
    onMounted(() => {
      fetchData(1)
    })
    
    return {
      activeTab,
      loading,
      error,
      currentList,
      currentPage,
      totalPages,
      pageRange,
      changePage,
      getPreviewHTML,
      truncateText,
      toggleLike,
      toggleFavorite,
      userStore
    }
  }
}
</script>

<style scoped>
.home-tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
}

.tab-btn:hover {
  color: #3498db;
}

.cssnippet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.cssnippet-card {
  display: flex;
  flex-direction: column;
}

.cssnippet-title {
  margin: 15px 0 10px;
  font-size: 18px;
}

.cssnippet-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  flex: 1;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
}

.avatar.small {
  width: 24px;
  height: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  padding: 5px;
  cursor: pointer;
  color: inherit;
  font-size: inherit;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.btn-icon.active {
  color: #3498db;
}

/* 确保卡片可以点击，除了按钮部分 */
.cssnippet-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cssnippet-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.full-width {
  width: 100%;
  margin-top: 15px;
}

.loading,
.error,
.empty-state {
  text-align: center;
  padding: 50px;
  color: #666;
}

.error {
  color: #e74c3c;
}
</style>
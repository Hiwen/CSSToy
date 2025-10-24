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
            <span class="meta-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 14s-6.5-4.5-6.5-9.5c0-1.5 1-2.5 2.5-2.5.8 0 1.5.4 2 1.2.5-.8 1.2-1.2 2-1.2 1.5 0 2.5 1 2.5 2.5 0 5-6.5 9.5-6.5 9.5z"/>
              </svg>
              {{ cssnippet.likes_count }}
            </span>
            <span class="meta-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm7.5 11.5l4.5-4.5-1.5-1.5L9.5 10.5l-3.5-3.5L6 7l3.5 3.5z"/>
              </svg>
              {{ cssnippet.collections_count }}
            </span>
            <span class="meta-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 4h14v9H1V4zm12 1H3v7h10V5z"/>
                <circle cx="5" cy="3" r="1"/>
                <circle cx="11" cy="3" r="1"/>
              </svg>
              {{ cssnippet.comments_count }}
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

export default {
  name: 'Home',
  setup() {
    const cssnippetStore = useCSSnippetStore()
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
      truncateText
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
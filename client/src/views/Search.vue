<template>
  <div class="search-container">
    <div class="search-header">
      <h1>搜索 CSS 代码段</h1>
      
      <form class="search-form" @submit.prevent="handleSearch">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="搜索 CSS 代码、标题或标签..."
            class="search-input"
            @input="handleInput"
          >
          <button type="submit" class="search-button">
            🔍
          </button>
        </div>
        
        <div class="search-options">
          <label class="radio">
            <input 
              type="radio" 
              value="all" 
              v-model="searchType"
              @change="handleSearch"
            >
            <span>全部</span>
          </label>
          
          <label class="radio">
            <input 
              type="radio" 
              value="title" 
              v-model="searchType"
              @change="handleSearch"
            >
            <span>标题</span>
          </label>
          
          <label class="radio">
            <input 
              type="radio" 
              value="content" 
              v-model="searchType"
              @change="handleSearch"
            >
            <span>内容</span>
          </label>
          
          <label class="radio">
            <input 
              type="radio" 
              value="tag" 
              v-model="searchType"
              @change="handleSearch"
            >
            <span>标签</span>
          </label>
        </div>
      </form>
      
      <div class="filter-sort-options">
        <div class="filter-wrapper">
          <label for="filter">筛选：</label>
          <select id="filter" v-model="filterBy" @change="handleSearch">
            <option value="all">全部</option>
            <option value="latest">最新</option>
            <option value="popular">热门</option>
            <option value="most_liked">最多点赞</option>
            <option value="most_favorited">最多收藏</option>
          </select>
        </div>
        
        <div class="sort-wrapper">
          <label for="sort">排序：</label>
          <select id="sort" v-model="sortBy" @change="handleSearch">
            <option value="relevance">相关性</option>
            <option value="newest">最新</option>
            <option value="oldest">最早</option>
            <option value="likes">点赞数</option>
            <option value="favorites">收藏数</option>
            <option value="comments">评论数</option>
          </select>
        </div>
      </div>
      
      <div v-if="searchQuery" class="search-summary">
        搜索结果："{{ searchQuery }}"，找到 {{ totalResults }} 个相关代码段
      </div>
    </div>
    
    <div class="search-results">
      <div v-if="loading" class="loading">搜索中...</div>
      
      <div v-else-if="results && results.length > 0" class="snippets-grid">
            <div 
              v-for="snippet in results" 
              :key="snippet.id"
              class="snippet-card"
              @click="goToDetail(snippet.id)"
            >
            <CssPreview :cssnippet="snippet" class="snippet-preview" />
          
          <div class="snippet-info">
            <h3 class="snippet-title">{{ snippet.title }}</h3>
            
            <p class="snippet-description">{{ snippet.description }}</p>
            
            <div class="snippet-tags">
            <span 
              v-for="tag in (snippet.tags || []).slice(0, 3)" 
              :key="tag.id"
              class="tag"
            >
                {{ tag.name }}
              </span>
              <span v-if="snippet.tags.length > 3" class="tag-more">+{{ snippet.tags.length - 3 }}</span>
            </div>
            
            <div class="snippet-meta">
              <div class="author-info">
                <img :src="getAvatar(snippet.user_id)" alt="作者头像" class="avatar">
                <span>{{ snippet.username }}</span>
              </div>
              
              <div class="stats">
                <span class="stat-item">❤️ {{ snippet.like_count }}</span>
                <span class="stat-item">⭐ {{ snippet.favorite_count }}</span>
                <span class="stat-item">💬 {{ snippet.comment_count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-results">
        <p v-if="searchQuery">没有找到相关的 CSS 代码段</p>
        <p v-else>请输入关键词进行搜索</p>
        
        <div v-if="searchQuery" class="suggestions">
          <h4>您可以尝试：</h4>
          <ul>
            <li>使用更一般的关键词</li>
            <li>检查拼写是否正确</li>
            <li>尝试不同的搜索类型</li>
          </ul>
        </div>
        
        <div v-else class="popular-tags">
          <h4>热门标签：</h4>
          <div class="tags-list">
            <span 
              v-for="tag in popularTags" 
              :key="tag.name"
              class="tag"
              @click="searchByTag(tag.name)"
            >
              {{ tag.name }} ({{ tag.count }})
            </span>
          </div>
        </div>
      </div>
      
      <!-- 分页控件 -->
      <div v-if="(results || []).length > 0" class="pagination">
        <button 
          class="pagination-button" 
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          上一页
        </button>
        
        <span class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </span>
        
        <button 
          class="pagination-button" 
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCssnippetStore } from '../stores/cssnippet'
import CssPreview from '../components/CssPreview.vue'

export default {
  name: 'Search',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const cssnippetStore = useCssnippetStore()
    
    const searchQuery = ref('')
    const searchType = ref('all')
    const filterBy = ref('all')
    const sortBy = ref('relevance')
    const currentPage = ref(1)
    const pageSize = ref(12)
    const loading = ref(false)
    const results = ref([]) // 初始化为空数组，避免undefined错误
    const totalResults = ref(0)
    const popularTags = ref([
      { name: '动画', count: 152 },
      { name: '响应式', count: 138 },
      { name: '按钮', count: 125 },
      { name: '卡片', count: 98 },
      { name: '表单', count: 87 },
      { name: '导航', count: 76 },
      { name: '字体', count: 65 },
      { name: '布局', count: 54 }
    ])
    
    const totalPages = computed(() => {
      return Math.ceil(totalResults.value / pageSize.value)
    })
    
    const handleSearch = async () => {
      // 重置页码
      currentPage.value = 1
      await performSearch()
    }
    
    const handleInput = () => {
      // 防抖处理，避免频繁搜索
      clearTimeout(window.searchTimeout)
      window.searchTimeout = setTimeout(() => {
        if (searchQuery.value.length > 1 || searchQuery.value.length === 0) {
          handleSearch()
        }
      }, 300)
    }
    
    const performSearch = async () => {
      if (!searchQuery.value && searchType.value !== 'all') {
        results.value = []
        totalResults.value = 0
        return
      }
      
      try {
        loading.value = true
        
        // 调用搜索API
        const response = await cssnippetStore.searchCssnippets({
          query: searchQuery.value,
          type: searchType.value,
          filter: filterBy.value,
          sort: sortBy.value,
          page: currentPage.value,
          pageSize: pageSize.value
        })
        
        results.value = response.results
        totalResults.value = response.total
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        loading.value = false
      }
    }
    
    const goToPage = async (page) => {
      if (page < 1 || page > totalPages.value) return
      
      currentPage.value = page
      await performSearch()
      
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    const goToDetail = (id) => {
      router.push(`/detail/${id}`)
    }
    
    const searchByTag = (tagName) => {
      searchQuery.value = tagName
      searchType.value = 'tag'
      handleSearch()
    }
    
    // 移除了原有的getPreviewStyle方法，使用CssPreview组件代替
    
    const getAvatar = (userId) => {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    }
    
    // 初始化时，检查URL参数
    const initFromUrl = () => {
      const query = route.query.q
      const type = route.query.type
      
      if (query) {
        searchQuery.value = query
        if (type && ['all', 'title', 'content', 'tag'].includes(type)) {
          searchType.value = type
        }
        handleSearch()
      }
    }
    
    // 监听路由参数变化
    watch(() => route.query, () => {
      initFromUrl()
    }, { deep: true })
    
    onMounted(() => {
      initFromUrl()
      
      // 如果没有搜索参数，加载默认推荐内容
      if (!searchQuery.value) {
        loadDefaultContent()
      }
    })
    
    const loadDefaultContent = async () => {
      try {
        loading.value = true
        // 加载热门代码段作为默认内容
        await cssnippetStore.fetchPopular(1)
        // 使用store中的数据
        results.value = cssnippetStore.popular
        // 假设total可以从pagination中获取
        totalResults.value = cssnippetStore.pagination?.popular?.total || 0
      } catch (err) {
        console.error('Failed to load default content:', err)
      } finally {
        loading.value = false
      }
    }
    
    return {
      searchQuery,
      searchType,
      filterBy,
      sortBy,
      currentPage,
      loading,
      results,
      totalResults,
      totalPages,
      popularTags,
      handleSearch,
      handleInput,
      goToPage,
      goToDetail,
      searchByTag,
      getAvatar
    }
  }
}
</script>

<style scoped>
.search-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-header {
  margin-bottom: 30px;
}

.search-header h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.search-form {
  margin-bottom: 20px;
}

.search-input-wrapper {
  display: flex;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 12px 15px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-right: none;
  border-radius: 8px 0 0 8px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #3498db;
}

.search-button {
  padding: 12px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.search-button:hover {
  background-color: #2980b9;
}

.search-options {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.radio {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio input {
  width: auto;
}

.filter-sort-options {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filter-wrapper, .sort-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-wrapper select, .sort-wrapper select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.search-summary {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.snippets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.snippet-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.snippet-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.snippet-preview {
  height: 150px;
  background-color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eee;
  min-height: 150px;
}

.snippet-info {
  padding: 15px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.snippet-title {
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.snippet-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.snippet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.tag-more {
  background-color: #f5f5f5;
  color: #999;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.snippet-meta {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.stats {
  display: flex;
  gap: 10px;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 3px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-results p {
  font-size: 18px;
  margin-bottom: 20px;
}

.suggestions, .popular-tags {
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
}

.suggestions h4, .popular-tags h4 {
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}

.suggestions ul {
  padding-left: 20px;
}

.suggestions li {
  margin-bottom: 8px;
  color: #666;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tags-list .tag {
  cursor: pointer;
  transition: all 0.3s;
}

.tags-list .tag:hover {
  background-color: #1976d2;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
}

.pagination-button {
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-button:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-options {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-sort-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .snippets-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
  
  .pagination-button {
    width: 100%;
    max-width: 200px;
  }
}
</style>
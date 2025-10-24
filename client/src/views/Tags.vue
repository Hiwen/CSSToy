<template>
  <div class="tags-container">
    <div class="page-header">
      <h1>探索标签</h1>
      <p>按标签浏览 CSS 代码段，发现精彩创意</p>
    </div>
    
    <div class="tags-content">
      <!-- 热门标签云 -->
      <div class="tags-cloud-section">
        <h2>热门标签</h2>
        <div class="tags-cloud">
          <button 
            v-for="tag in popularTags" 
            :key="tag.id"
            class="tag-cloud-item"
            :style="{ fontSize: getTagSize(tag.count), opacity: getTagOpacity(tag.count) }"
            @click="filterByTag(tag)"
          >
            {{ tag.name }}
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
      
      <!-- 搜索和筛选 -->
      <div class="search-filter-section">
        <div class="search-bar">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索标签..."
            class="search-input"
            @input="handleSearch"
          >
          <button class="search-button">
            <span class="icon">🔍</span>
          </button>
        </div>
        
        <div class="filter-options">
          <select v-model="sortOrder" class="filter-select" @change="loadSnippets">
            <option value="popular">按热度排序</option>
            <option value="latest">按最新排序</option>
            <option value="trending">按趋势排序</option>
          </select>
        </div>
      </div>
      
      <!-- 选中标签展示 -->
      <div v-if="selectedTag" class="selected-tag-section">
        <div class="selected-tag-header">
          <div>
            <h2>标签: <span class="highlight">{{ selectedTag.name }}</span></h2>
            <p>相关 CSS 代码段</p>
          </div>
          <button class="btn btn-outline" @click="clearTagFilter">
            清除筛选
          </button>
        </div>
      </div>
      
      <!-- 搜索结果标签列表 -->
      <div v-if="searchResults.length > 0 && !selectedTag" class="search-results-section">
        <h2>搜索结果</h2>
        <div class="tags-list">
          <button 
            v-for="tag in searchResults" 
            :key="tag.id"
            class="tag-item"
            @click="filterByTag(tag)"
          >
            {{ tag.name }}
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
      
      <!-- 所有标签分类展示 -->
      <div v-if="!selectedTag && searchQuery === ''" class="all-tags-section">
        <h2>所有标签</h2>
        
        <div class="tags-alphabet">
          <button 
            v-for="letter in alphabetLetters" 
            :key="letter"
            class="alphabet-button"
            :class="{ active: selectedLetter === letter }"
            @click="filterByLetter(letter)"
          >
            {{ letter === '#' ? '0-9' : letter }}
          </button>
        </div>
        
        <div class="tags-list">
          <button 
            v-for="tag in filteredTags" 
            :key="tag.id"
            class="tag-item"
            @click="filterByTag(tag)"
          >
            {{ tag.name }}
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
      
      <!-- 代码段展示 -->
      <div v-if="selectedTag" class="snippets-section">
        <div v-if="loading" class="loading">加载中...</div>
        
        <div v-else-if="snippets.length > 0" class="snippets-grid">
          <div 
            v-for="snippet in snippets" 
            :key="snippet.id"
            class="snippet-card"
            @click="goToDetail(snippet.id)"
          >
            <div class="snippet-preview" :style="getPreviewStyle(snippet.css_code)"></div>
            
            <div class="snippet-info">
              <h3 class="snippet-title">{{ snippet.title }}</h3>
              
              <div class="author-info">
                <img :src="getAvatar(snippet.user_id)" alt="作者头像" class="avatar">
                <span>{{ snippet.username }}</span>
              </div>
              
              <div class="snippet-description">{{ snippet.description }}</div>
              
              <div class="snippet-tags">
                <span 
                  v-for="tag in snippet.tags.slice(0, 3)" 
                  :key="tag.id"
                  class="tag"
                  @click.stop="filterByTag(tag)"
                >
                  {{ tag.name }}
                </span>
              </div>
              
              <div class="snippet-meta">
                <span class="publish-date">{{ formatDate(snippet.created_at) }}</span>
                
                <div class="snippet-stats">
                  <span class="stat-item">❤️ {{ snippet.like_count }}</span>
                  <span class="stat-item">⭐ {{ snippet.favorite_count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state">
          <p>该标签下暂无 CSS 代码段</p>
        </div>
        
        <!-- 分页 -->
        <div v-if="snippets.length > 0" class="pagination">
          <button 
            class="pagination-button" 
            :disabled="currentPage === 1"
            @click="loadSnippets(currentPage - 1)"
          >
            上一页
          </button>
          
          <span class="pagination-info">
            第 {{ currentPage }} 页，共 {{ Math.ceil(totalSnippets / pageSize) }} 页
          </span>
          
          <button 
            class="pagination-button" 
            :disabled="currentPage >= Math.ceil(totalSnippets / pageSize)"
            @click="loadSnippets(currentPage + 1)"
          >
            下一页
          </button>
        </div>
      </div>
      
      <!-- 标签推荐 -->
      <div v-if="!selectedTag && searchQuery === ''" class="tag-recommendations">
        <h2>推荐标签组合</h2>
        <div class="recommended-combinations">
          <div 
            v-for="(combination, index) in tagCombinations" 
            :key="index"
            class="combination-card"
          >
            <div class="combination-tags">
              <span 
                v-for="tag in combination.tags" 
                :key="tag.id"
                class="combination-tag"
                @click="filterByTag(tag)"
              >
                {{ tag.name }}
              </span>
            </div>
            <p class="combination-description">{{ combination.description }}</p>
          </div>
        </div>
      </div>
      
      <!-- 标签统计信息 -->
      <div class="tags-stats">
        <div class="stat-card">
          <div class="stat-number">{{ totalTags }}</div>
          <div class="stat-label">总标签数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">{{ totalSnippetsWithTags }}</div>
          <div class="stat-label">带标签代码段</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">{{ mostUsedTag?.count || 0 }}</div>
          <div class="stat-label">{{ mostUsedTag?.name || '暂无' }} 使用次数</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCssnippetStore } from '../stores/cssnippet'

export default {
  name: 'Tags',
  setup() {
    const router = useRouter()
    const cssnippetStore = useCssnippetStore()
    
    const popularTags = ref([])
    const allTags = ref([])
    const searchResults = ref([])
    const snippets = ref([])
    
    const searchQuery = ref('')
    const selectedTag = ref(null)
    const selectedLetter = ref('')
    const sortOrder = ref('popular')
    
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(6)
    const totalSnippets = ref(0)
    
    // 标签统计
    const totalTags = ref(0)
    const totalSnippetsWithTags = ref(0)
    const mostUsedTag = ref(null)
    
    // 字母表用于分类
    const alphabetLetters = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
    
    // 推荐标签组合
    const tagCombinations = ref([
      {
        tags: [], // 将在加载后填充
        description: '响应式设计与动画效果结合'
      },
      {
        tags: [], // 将在加载后填充
        description: '渐变与阴影创造深度'
      },
      {
        tags: [], // 将在加载后填充
        description: '现代UI组件样式'
      }
    ])
    
    // 根据选中的字母筛选标签
    const filteredTags = computed(() => {
      if (!selectedLetter.value) return allTags.value
      
      if (selectedLetter.value === '#') {
        // 数字和其他字符
        return allTags.value.filter(tag => /^\d/.test(tag.name))
      } else {
        // 特定字母开头
        return allTags.value.filter(tag => 
          tag.name.toLowerCase().startsWith(selectedLetter.value.toLowerCase())
        )
      }
    })
    
    const loadPopularTags = async () => {
      try {
        const tags = await cssnippetStore.getPopularTags()
        popularTags.value = tags
      } catch (err) {
        console.error('Failed to load popular tags:', err)
      }
    }
    
    const loadAllTags = async () => {
      try {
        const tags = await cssnippetStore.getAllTags()
        allTags.value = tags
        totalTags.value = tags.length
        
        // 获取统计信息
        totalSnippetsWithTags.value = tags.reduce((sum, tag) => sum + tag.count, 0)
        mostUsedTag.value = [...tags].sort((a, b) => b.count - a.count)[0] || null
        
        // 填充推荐标签组合
        if (tags.length > 0) {
          tagCombinations.value[0].tags = tags.slice(0, 2)
          tagCombinations.value[1].tags = tags.slice(2, 4)
          tagCombinations.value[2].tags = tags.slice(4, 6)
        }
      } catch (err) {
        console.error('Failed to load all tags:', err)
      }
    }
    
    const loadSnippets = async (page = 1) => {
      if (!selectedTag.value) return
      
      try {
        loading.value = true
        currentPage.value = page
        
        const response = await cssnippetStore.getSnippetsByTag(
          selectedTag.value.id,
          page,
          pageSize.value,
          sortOrder.value
        )
        
        snippets.value = response.results
        totalSnippets.value = response.total
      } catch (err) {
        console.error('Failed to load snippets by tag:', err)
      } finally {
        loading.value = false
      }
    }
    
    const handleSearch = async () => {
      if (!searchQuery.value.trim()) {
        searchResults.value = []
        return
      }
      
      try {
        const results = await cssnippetStore.searchTags(searchQuery.value)
        searchResults.value = results
      } catch (err) {
        console.error('Failed to search tags:', err)
      }
    }
    
    const filterByTag = (tag) => {
      selectedTag.value = tag
      searchResults.value = []
      searchQuery.value = ''
      loadSnippets(1)
    }
    
    const clearTagFilter = () => {
      selectedTag.value = null
      snippets.value = []
    }
    
    const filterByLetter = (letter) => {
      selectedLetter.value = selectedLetter.value === letter ? '' : letter
    }
    
    const goToDetail = (id) => {
      router.push(`/detail/${id}`)
    }
    
    // 标签云大小计算
    const getTagSize = (count) => {
      if (!popularTags.value.length) return '16px'
      
      const minCount = Math.min(...popularTags.value.map(tag => tag.count))
      const maxCount = Math.max(...popularTags.value.map(tag => tag.count))
      
      if (minCount === maxCount) return '16px'
      
      // 14px 到 24px 的范围
      const size = 14 + ((count - minCount) / (maxCount - minCount)) * 10
      return `${size}px`
    }
    
    // 标签云透明度计算
    const getTagOpacity = (count) => {
      if (!popularTags.value.length) return 0.7
      
      const minCount = Math.min(...popularTags.value.map(tag => tag.count))
      const maxCount = Math.max(...popularTags.value.map(tag => tag.count))
      
      if (minCount === maxCount) return 0.7
      
      // 0.6 到 1.0 的范围
      const opacity = 0.6 + ((count - minCount) / (maxCount - minCount)) * 0.4
      return opacity
    }
    
    const getPreviewStyle = (cssCode) => {
      return { raw: cssCode.substring(0, 200) }
    }
    
    const getAvatar = (userId) => {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    }
    
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    }
    
    onMounted(() => {
      loadPopularTags()
      loadAllTags()
    })
    
    return {
      popularTags,
      allTags,
      searchResults,
      snippets,
      searchQuery,
      selectedTag,
      selectedLetter,
      sortOrder,
      loading,
      currentPage,
      pageSize,
      totalSnippets,
      totalTags,
      totalSnippetsWithTags,
      mostUsedTag,
      alphabetLetters,
      tagCombinations,
      filteredTags,
      loadSnippets,
      handleSearch,
      filterByTag,
      clearTagFilter,
      filterByLetter,
      goToDetail,
      getTagSize,
      getTagOpacity,
      getPreviewStyle,
      getAvatar,
      formatDate
    }
  }
}
</script>

<style scoped>
.tags-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 42px;
  margin-bottom: 15px;
  color: #333;
}

.page-header p {
  font-size: 18px;
  color: #666;
}

.tags-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* 热门标签云 */
.tags-cloud-section {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tags-cloud-section h2 {
  margin-bottom: 25px;
  color: #333;
  font-size: 24px;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

.tag-cloud-item {
  background-color: #f0f7ff;
  border: 1px solid #d0e3ff;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1976d2;
}

.tag-cloud-item:hover {
  background-color: #e3f2fd;
  transform: translateY(-2px);
}

.tag-count {
  background-color: rgba(25, 118, 210, 0.1);
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.8em;
  color: #1565c0;
}

/* 搜索和筛选 */
.search-filter-section {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-bar {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #666;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-select {
  padding: 12px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
}

/* 选中标签展示 */
.selected-tag-section {
  background-color: #e3f2fd;
  border-radius: 12px;
  padding: 20px 30px;
}

.selected-tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-tag-header h2 {
  margin: 0 0 5px 0;
  color: #333;
}

.selected-tag-header p {
  margin: 0;
  color: #666;
}

.highlight {
  color: #1976d2;
  font-weight: bold;
}

/* 搜索结果标签列表 */
.search-results-section {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-results-section h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

/* 所有标签分类展示 */
.all-tags-section {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.all-tags-section h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

.tags-alphabet {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.alphabet-button {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.3s;
}

.alphabet-button:hover {
  background-color: #f0f0f0;
}

.alphabet-button.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.tags-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.tag-item:hover {
  background-color: #e3f2fd;
  border-color: #1976d2;
}

/* 代码段展示 */
.snippets-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.snippets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  padding: 30px;
}

.snippet-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.snippet-card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.snippet-preview {
  height: 180px;
  background-color: #fafafa;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.snippet-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.snippet-title {
  font-size: 18px;
  margin-bottom: 10px;
  color: #333;
  line-height: 1.4;
}

.snippet-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
  flex: 1;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.snippet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 15px;
}

.tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.tag:hover {
  background-color: #bbdefb;
}

.snippet-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #999;
}

.publish-date {
  font-size: 12px;
}

.snippet-stats {
  display: flex;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 30px;
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
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

/* 标签推荐 */
.tag-recommendations {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tag-recommendations h2 {
  margin-bottom: 25px;
  color: #333;
  font-size: 24px;
}

.recommended-combinations {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.combination-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #3498db;
}

.combination-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.combination-tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.combination-tag:hover {
  background-color: #bbdefb;
}

.combination-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* 标签统计信息 */
.tags-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 32px;
  }
  
  .page-header p {
    font-size: 16px;
  }
  
  .search-filter-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    min-width: auto;
  }
  
  .tags-cloud {
    gap: 10px;
  }
  
  .tag-cloud-item {
    padding: 6px 12px;
  }
  
  .tags-list {
    grid-template-columns: 1fr;
  }
  
  .snippets-grid {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  
  .selected-tag-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .recommended-combinations {
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
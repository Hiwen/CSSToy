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
      <SnippetCard 
        v-for="cssnippet in currentList" 
        :key="cssnippet.id"
        :cssnippet="cssnippet"
        :is-owner="cssnippet.user_id === userStore.user?.id"
        @like="toggleLike($event, cssnippet)"
        @favorite="toggleFavorite($event, cssnippet)"
      />
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

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCSSnippetStore } from '../stores/cssnippet'
import SnippetCard from '../components/SnippetCard.vue'

// 组件状态和逻辑
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

.cssnippet-preview {
  width: 100%;
  height: 150px;
  background-color: #f9f9f9;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
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
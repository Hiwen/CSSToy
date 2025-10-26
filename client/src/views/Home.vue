<template>
  <div class="page-container">
    <div class="page-tabs">
      <button 
        :class="['tab-button', { active: activeTab === 'popular' }]" 
        @click="activeTab = 'popular'"
      >
        每周热门
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'latest' }]" 
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
    
    <div v-else class="content-grid">
      <SnippetCard 
        v-for="cssnippet in currentList" 
        :key="cssnippet.id"
        :cssnippet="cssnippet"
        :is-owner="cssnippet.user_id === userStore.user?.id"
        @like="toggleLike($event, cssnippet)"
        @favorite="toggleFavorite($event, cssnippet)"
      />
    </div>
    
    <div v-if="!loading && currentList.length > 0">
      <Pagination 
        :current-page="currentPage"
        :total-pages="totalPages"
        @page-change="changePage"
      />
    </div>
    
    <div v-if="!loading && currentList.length === 0" class="empty-state">
      <p>暂无CSS代码段</p>
      <router-link to="/create" class="btn btn-primary">创建一个</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCSSnippetStore } from '../stores/cssnippet'
import SnippetCard from '../components/SnippetCard.vue'
import Pagination from '../components/Pagination.vue'

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
/* 使用通用样式，保留特定页面的额外样式 */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.error {
  text-align: center;
  padding: 60px 20px;
  color: #e74c3c;
}
</style>
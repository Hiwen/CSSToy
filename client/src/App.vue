<template>
  <div class="app">
    <header class="header">
      <div class="container nav">
        <router-link to="/" class="nav-logo">CSSToy</router-link>
        
        <div class="nav-search">
          <input 
            type="text" 
            class="search-input" 
            placeholder="搜索CSS代码段..."
            v-model="searchQuery"
            @keyup.enter="handleSearch"
          >
        </div>
        
        <div v-if="!user" class="nav-auth">
          <router-link to="/login" class="btn btn-secondary">登录</router-link>
          <router-link to="/register" class="btn btn-primary">注册</router-link>
        </div>
        
        <div v-else class="nav-user">
          <router-link 
            v-if="!isCreateOrEditPage" 
            to="/create" 
            class="btn btn-primary btn-create"
          >新建CSS</router-link>
          <router-link to="/profile" class="avatar-link">
            <img :src="user.avatar || '/default-avatar.png'" :alt="user.username" class="avatar">
          </router-link>
          <span>{{ user.username }}</span>
        </div>
      </div>
    </header>
    
    <main class="container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <footer class="footer">
      <div class="container">
        <p>&copy; 2023 CSSToy. 分享和学习CSS技巧的平台。</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from './stores/user'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const searchQuery = ref('')
    
    const user = computed(() => userStore.user)
    
    // 判断是否在新建或编辑页面
    const isCreateOrEditPage = computed(() => {
      // 根据实际路由路径修改匹配逻辑
      const currentPath = route.path
      return currentPath === '/cssnippet/new' || 
             currentPath.includes('/cssnippet/') && currentPath.includes('/edit')
    })
    
    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        router.push({ path: '/search', query: { q: searchQuery.value } })
      }
    }
    
    onMounted(() => {
      // 从localStorage恢复登录状态
      const token = localStorage.getItem('token')
      if (token) {
        userStore.fetchUserInfo()
      }
    })
    
    return {
      user,
      searchQuery,
      handleSearch,
      isCreateOrEditPage
    }
  }
}
</script>

<style>
/* 重置基础样式，确保页面占满整个视口 */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 防止页面级滚动条 */
}

/* 应用容器设置为flex布局，垂直方向 */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

/* 过渡动画样式 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 主体内容区域 */
main.container {
  flex: 1;
  overflow-y: auto; /* 只在主体内容区域显示滚动条 */
  padding-bottom: 20px; /* 适当的底部内边距 */
  -ms-overflow-style: none; /* 隐藏IE/Edge滚动条 */
  scrollbar-width: none; /* 隐藏Firefox滚动条 */
}

/* 隐藏Chrome等浏览器的滚动条 */
main.container::-webkit-scrollbar {
  display: none;
}

/* 页脚样式 */
.footer {
  background-color: rgba(16, 23, 42, 0.95);
  padding: 20px 0;
  text-align: center;
  border-top: 1px solid rgba(56, 189, 248, 0.3);
  position: sticky;
  bottom: 0;
  z-index: 90;
  backdrop-filter: blur(10px);
}

.footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
}
</style>
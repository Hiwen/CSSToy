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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.footer {
  background-color: #fff;
  padding: 20px 0;
  margin-top: 40px;
  text-align: center;
  border-top: 1px solid #eee;
}
</style>
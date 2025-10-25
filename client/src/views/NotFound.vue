<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="number-404">404</div>
      <h1>页面不存在</h1>
      <p>很抱歉，您访问的页面不存在或已被移除</p>
      
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="搜索CSS代码段..."
          class="search-input"
          @keyup.enter="search"
        >
        <button class="search-button" @click="search">
          <span class="icon">🔍</span>
          搜索
        </button>
      </div>
      
      <div class="action-buttons">
        <router-link to="/" class="btn btn-primary">
          返回首页
        </router-link>
        <router-link to="/create" class="btn btn-outline">
          创建代码段
        </router-link>
      </div>
      
      <div class="popular-tags">
        <h3>热门标签</h3>
        <div class="tags-list">
          <router-link 
            v-for="tag in popularTags" 
            :key="tag.id"
            :to="`/tags?tag=${tag.name}`"
            class="tag"
          >
            {{ tag.name }}
          </router-link>
        </div>
      </div>
      
      <div class="suggestions">
        <h3>您可能想要访问...</h3>
        <ul>
          <li>
            <router-link to="/">
              <span class="icon">🏠</span>
              首页 - 发现热门 CSS 代码段
            </router-link>
          </li>
          <li>
            <router-link to="/tags">
              <span class="icon">🏷️</span>
              标签页 - 按标签浏览
            </router-link>
          </li>
          <li v-if="!userStore.isLoggedIn">
            <router-link to="/login">
              <span class="icon">🔐</span>
              登录 - 管理您的代码段
            </router-link>
          </li>
          <li v-else>
            <router-link to="/profile">
              <span class="icon">👤</span>
              个人中心 - 查看您的收藏和创建
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCssnippetStore } from '../stores/cssnippet'
    const router = useRouter()
    const userStore = useUserStore()
    const cssnippetStore = useCssnippetStore()
    
    const searchQuery = ref('')
    const popularTags = ref([])
    
    const search = () => {
      if (searchQuery.value.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
      }
    }
    
    const loadPopularTags = async () => {
      try {
        // 加载前10个热门标签
        const tags = await cssnippetStore.getPopularTags(10)
        popularTags.value = tags
      } catch (err) {
        console.error('Failed to load popular tags:', err)
      }
    }
    
    onMounted(() => {
      loadPopularTags()
    })
    
// 所有变量和函数自动暴露给模板
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.not-found-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 60px;
  text-align: center;
  max-width: 800px;
  width: 100%;
}

.number-404 {
  font-size: 120px;
  font-weight: 900;
  color: #3498db;
  margin-bottom: 20px;
  text-shadow: 3px 3px 0 rgba(52, 152, 219, 0.2);
  line-height: 1;
}

.not-found-content h1 {
  font-size: 36px;
  margin-bottom: 15px;
  color: #333;
}

.not-found-content p {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}

/* 搜索容器 */
.search-container {
  display: flex;
  margin-bottom: 40px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.search-input {
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px 0 0 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-button:hover {
  background-color: #2980b9;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 50px;
}

.btn {
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: 2px solid #3498db;
}

.btn-primary:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-outline {
  background-color: white;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

/* 热门标签 */
.popular-tags {
  margin-bottom: 50px;
}

.popular-tags h3 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #333;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.tag {
  background-color: #f0f7ff;
  color: #1976d2;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s;
  border: 1px solid #e3f2fd;
}

.tag:hover {
  background-color: #e3f2fd;
  transform: translateY(-2px);
}

/* 建议链接 */
.suggestions {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 30px;
  text-align: left;
}

.suggestions h3 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.suggestions ul {
  list-style: none;
  padding: 0;
  max-width: 400px;
  margin: 0 auto;
}

.suggestions li {
  margin-bottom: 15px;
}

.suggestions li:last-child {
  margin-bottom: 0;
}

.suggestions a {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #333;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 8px;
  background-color: white;
  border: 1px solid #e0e0e0;
  transition: all 0.3s;
}

.suggestions a:hover {
  background-color: #f0f7ff;
  border-color: #3498db;
  transform: translateX(5px);
}

.suggestions .icon {
  font-size: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-content {
    padding: 40px 20px;
  }
  
  .number-404 {
    font-size: 80px;
  }
  
  .not-found-content h1 {
    font-size: 28px;
  }
  
  .not-found-content p {
    font-size: 16px;
  }
  
  .search-container {
    flex-direction: column;
  }
  
  .search-input {
    border-radius: 8px;
    margin-bottom: 10px;
  }
  
  .search-button {
    border-radius: 8px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }
  
  .suggestions {
    padding: 20px;
  }
  
  .suggestions a {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .number-404 {
    font-size: 60px;
  }
  
  .not-found-content h1 {
    font-size: 24px;
  }
  
  .tags-list {
    flex-direction: column;
    align-items: center;
  }
  
  .tag {
    width: 100%;
    max-width: 200px;
    text-align: center;
  }
}
</style>
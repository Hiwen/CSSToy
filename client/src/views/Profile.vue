<template>
  <div class="profile-container">
    <div v-if="!userStore.isLoggedIn" class="not-logged-in">
      <h2>请先登录</h2>
      <p>登录后可以查看和管理您的个人信息和CSS代码段</p>
      <router-link to="/login" class="btn btn-primary">去登录</router-link>
    </div>
    
    <div v-else>
      <!-- 用户信息卡片 -->
      <div class="profile-header card">
        <div class="profile-info">
          <img :src="getAvatar(userStore.user.id)" alt="用户头像" class="profile-avatar">
          
          <div class="user-details">
            <h2>{{ userStore.user.username }}</h2>
            <p class="user-email">{{ userStore.user.email }}</p>
            
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-number">{{ userStats.totalSnippets }}</span>
                <span class="stat-label">代码段</span>
              </div>
              
              <div class="stat-item">
                <span class="stat-number">{{ userStats.totalLikes }}</span>
                <span class="stat-label">获得点赞</span>
              </div>
              
              <div class="stat-item">
                <span class="stat-number">{{ userStats.totalFavorites }}</span>
                <span class="stat-label">获得收藏</span>
              </div>
              
              <div class="stat-item">
                <span class="stat-number">{{ userStats.totalComments }}</span>
                <span class="stat-label">评论</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="btn btn-outline" @click="showEditProfile = true">
            <span class="icon">✏️</span>
            编辑资料
          </button>
          
          <button class="btn btn-outline" @click="showChangePassword = true">
            <span class="icon">🔒</span>
            修改密码
          </button>
        </div>
      </div>
      
      <!-- 内容标签页 -->
      <div class="profile-tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'my-snippets' }"
          @click="switchTab('my-snippets')"
        >
          我的代码段
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'liked-snippets' }"
          @click="switchTab('liked-snippets')"
        >
          点赞的代码段
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'favorited-snippets' }"
          @click="switchTab('favorited-snippets')"
        >
          收藏的代码段
        </button>
        
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'my-comments' }"
          @click="switchTab('my-comments')"
        >
          我的评论
        </button>
      </div>
      
      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 我的代码段 -->
        <div v-if="activeTab === 'my-snippets'" class="snippets-tab">
          <div class="tab-header">
            <h3>我的 CSS 代码段</h3>
            <router-link to="/create" class="btn btn-primary">
              <span class="icon">+</span>
              创建代码段
            </router-link>
          </div>
          
          <div v-if="loading" class="loading">加载中...</div>
          
          <div v-else-if="mySnippets.length > 0" class="snippets-grid">
            <div 
              v-for="snippet in mySnippets" 
              :key="snippet.id"
              class="snippet-card"
            >
              <div class="snippet-preview" :style="getPreviewStyle(snippet.css_code)"></div>
              
              <div class="snippet-info">
                <h4 class="snippet-title">{{ snippet.title }}</h4>
                
                <p class="snippet-description">{{ snippet.description }}</p>
                
                <div class="snippet-meta">
                  <span class="publish-date">{{ formatDate(snippet.created_at) }}</span>
                  
                  <div class="snippet-stats">
                    <span class="stat-item">❤️ {{ snippet.like_count }}</span>
                    <span class="stat-item">⭐ {{ snippet.favorite_count }}</span>
                  </div>
                </div>
                
                <div class="snippet-actions">
                  <button class="btn btn-sm btn-outline" @click="goToDetail(snippet.id)">
                    查看
                  </button>
                  
                  <button class="btn btn-sm btn-primary" @click="editSnippet(snippet.id)">
                    编辑
                  </button>
                  
                  <button class="btn btn-sm btn-danger" @click="confirmDelete(snippet)">
                    删除
                  </button>
                  
                  <button 
                    class="btn btn-sm" 
                    :class="snippet.is_public ? 'btn-secondary' : 'btn-success'"
                    @click="toggleVisibility(snippet)"
                  >
                    {{ snippet.is_public ? '公开' : '私密' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>您还没有创建任何 CSS 代码段</p>
            <router-link to="/create" class="btn btn-primary">立即创建</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="mySnippets.length > 0" class="pagination">
            <button 
              class="pagination-button" 
              :disabled="mySnippetsPage === 1"
              @click="loadMySnippets(mySnippetsPage - 1)"
            >
              上一页
            </button>
            
            <span class="pagination-info">
              第 {{ mySnippetsPage }} 页，共 {{ Math.ceil(mySnippetsTotal / pageSize) }} 页
            </span>
            
            <button 
              class="pagination-button" 
              :disabled="mySnippetsPage >= Math.ceil(mySnippetsTotal / pageSize)"
              @click="loadMySnippets(mySnippetsPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
        
        <!-- 点赞的代码段 -->
        <div v-if="activeTab === 'liked-snippets'" class="liked-tab">
          <div class="tab-header">
            <h3>我点赞的 CSS 代码段</h3>
          </div>
          
          <div v-if="loading" class="loading">加载中...</div>
          
          <div v-else-if="likedSnippets.length > 0" class="snippets-grid">
            <div 
              v-for="snippet in likedSnippets" 
              :key="snippet.id"
              class="snippet-card"
              @click="goToDetail(snippet.id)"
            >
              <div class="snippet-preview" :style="getPreviewStyle(snippet.css_code)"></div>
              
              <div class="snippet-info">
                <h4 class="snippet-title">{{ snippet.title }}</h4>
                
                <div class="author-info">
                  <img :src="getAvatar(snippet.user_id)" alt="作者头像" class="avatar">
                  <span>{{ snippet.username }}</span>
                </div>
                
                <div class="snippet-tags">
                  <span 
                    v-for="tag in snippet.tags.slice(0, 3)" 
                    :key="tag.id"
                    class="tag"
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
            <p>您还没有点赞任何 CSS 代码段</p>
            <router-link to="/" class="btn btn-outline">去浏览</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="likedSnippets.length > 0" class="pagination">
            <button 
              class="pagination-button" 
              :disabled="likedSnippetsPage === 1"
              @click="loadLikedSnippets(likedSnippetsPage - 1)"
            >
              上一页
            </button>
            
            <span class="pagination-info">
              第 {{ likedSnippetsPage }} 页，共 {{ Math.ceil(likedSnippetsTotal / pageSize) }} 页
            </span>
            
            <button 
              class="pagination-button" 
              :disabled="likedSnippetsPage >= Math.ceil(likedSnippetsTotal / pageSize)"
              @click="loadLikedSnippets(likedSnippetsPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
        
        <!-- 收藏的代码段 -->
        <div v-if="activeTab === 'favorited-snippets'" class="favorited-tab">
          <div class="tab-header">
            <h3>我收藏的 CSS 代码段</h3>
          </div>
          
          <div v-if="loading" class="loading">加载中...</div>
          
          <div v-else-if="favoritedSnippets.length > 0" class="snippets-grid">
            <div 
              v-for="snippet in favoritedSnippets" 
              :key="snippet.id"
              class="snippet-card"
              @click="goToDetail(snippet.id)"
            >
              <div class="snippet-preview" :style="getPreviewStyle(snippet.css_code)"></div>
              
              <div class="snippet-info">
                <h4 class="snippet-title">{{ snippet.title }}</h4>
                
                <div class="author-info">
                  <img :src="getAvatar(snippet.user_id)" alt="作者头像" class="avatar">
                  <span>{{ snippet.username }}</span>
                </div>
                
                <div class="snippet-tags">
                  <span 
                    v-for="tag in snippet.tags.slice(0, 3)" 
                    :key="tag.id"
                    class="tag"
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
            <p>您还没有收藏任何 CSS 代码段</p>
            <router-link to="/" class="btn btn-outline">去浏览</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="favoritedSnippets.length > 0" class="pagination">
            <button 
              class="pagination-button" 
              :disabled="favoritedSnippetsPage === 1"
              @click="loadFavoritedSnippets(favoritedSnippetsPage - 1)"
            >
              上一页
            </button>
            
            <span class="pagination-info">
              第 {{ favoritedSnippetsPage }} 页，共 {{ Math.ceil(favoritedSnippetsTotal / pageSize) }} 页
            </span>
            
            <button 
              class="pagination-button" 
              :disabled="favoritedSnippetsPage >= Math.ceil(favoritedSnippetsTotal / pageSize)"
              @click="loadFavoritedSnippets(favoritedSnippetsPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
        
        <!-- 我的评论 -->
        <div v-if="activeTab === 'my-comments'" class="comments-tab">
          <div class="tab-header">
            <h3>我的评论</h3>
          </div>
          
          <div v-if="loading" class="loading">加载中...</div>
          
          <div v-else-if="myComments.length > 0" class="comments-list">
            <div 
              v-for="comment in myComments" 
              :key="comment.id"
              class="comment-item card"
            >
              <div class="comment-header">
                <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                <span class="comment-target">
                  评论于：
                  <a href="#" @click.prevent="goToDetail(comment.cssnippet_id)">
                    {{ comment.cssnippet_title }}
                  </a>
                </span>
              </div>
              
              <div class="comment-content">
                {{ comment.content }}
              </div>
              
              <div class="comment-actions">
                <button class="btn btn-sm btn-outline" @click="goToDetail(comment.cssnippet_id)">
                  查看代码段
                </button>
                
                <button class="btn btn-sm btn-danger" @click="deleteComment(comment.id)">
                  删除评论
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>您还没有发表任何评论</p>
            <router-link to="/" class="btn btn-outline">去浏览</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="myComments.length > 0" class="pagination">
            <button 
              class="pagination-button" 
              :disabled="myCommentsPage === 1"
              @click="loadMyComments(myCommentsPage - 1)"
            >
              上一页
            </button>
            
            <span class="pagination-info">
              第 {{ myCommentsPage }} 页，共 {{ Math.ceil(myCommentsTotal / pageSize) }} 页
            </span>
            
            <button 
              class="pagination-button" 
              :disabled="myCommentsPage >= Math.ceil(myCommentsTotal / pageSize)"
              @click="loadMyComments(myCommentsPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑资料弹窗 -->
    <div v-if="showEditProfile" class="modal-overlay" @click="showEditProfile = false">
      <div class="modal-content card" @click.stop>
        <h3>编辑个人资料</h3>
        
        <div v-if="editProfileError" class="form-error">{{ editProfileError }}</div>
        
        <form @submit.prevent="handleUpdateProfile">
          <div class="form-group">
            <label class="form-label" for="username">用户名</label>
            <input 
              type="text" 
              id="username" 
              class="form-input" 
              v-model="editProfileForm.username"
              required
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="bio">个人简介（选填）</label>
            <textarea 
              id="bio" 
              class="form-input" 
              v-model="editProfileForm.bio"
              rows="3"
              placeholder="介绍一下自己吧..."
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="updatingProfile"
            >
              {{ updatingProfile ? '保存中...' : '保存' }}
            </button>
            
            <button 
              type="button" 
              class="btn btn-outline"
              @click="showEditProfile = false"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 修改密码弹窗 -->
    <div v-if="showChangePassword" class="modal-overlay" @click="showChangePassword = false">
      <div class="modal-content card" @click.stop>
        <h3>修改密码</h3>
        
        <div v-if="changePasswordError" class="form-error">{{ changePasswordError }}</div>
        
        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label" for="currentPassword">当前密码</label>
            <input 
              type="password" 
              id="currentPassword" 
              class="form-input" 
              v-model="changePasswordForm.currentPassword"
              required
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="newPassword">新密码</label>
            <input 
              type="password" 
              id="newPassword" 
              class="form-input" 
              v-model="changePasswordForm.newPassword"
              placeholder="至少8位，包含字母和数字"
              required
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="confirmPassword">确认新密码</label>
            <input 
              type="password" 
              id="confirmPassword" 
              class="form-input" 
              v-model="changePasswordForm.confirmPassword"
              required
            >
          </div>
          
          <div class="modal-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="changingPassword"
            >
              {{ changingPassword ? '修改中...' : '修改密码' }}
            </button>
            
            <button 
              type="button" 
              class="btn btn-outline"
              @click="showChangePassword = false"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content card" @click.stop>
        <h3>确认删除</h3>
        <p>您确定要删除代码段「{{ deletingSnippet?.title }}」吗？此操作无法撤销。</p>
        
        <div class="modal-actions">
          <button 
            class="btn btn-danger"
            @click="deleteSnippet"
            :disabled="deleting"
          >
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
          
          <button class="btn btn-outline" @click="showDeleteConfirm = false">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCssnippetStore } from '../stores/cssnippet'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const cssnippetStore = useCssnippetStore()
    
    const activeTab = ref('my-snippets')
    const loading = ref(false)
    const pageSize = ref(6)
    
    // 用户统计数据
    const userStats = reactive({
      totalSnippets: 0,
      totalLikes: 0,
      totalFavorites: 0,
      totalComments: 0
    })
    
    // 代码段数据
    const mySnippets = ref([])
    const mySnippetsPage = ref(1)
    const mySnippetsTotal = ref(0)
    
    const likedSnippets = ref([])
    const likedSnippetsPage = ref(1)
    const likedSnippetsTotal = ref(0)
    
    const favoritedSnippets = ref([])
    const favoritedSnippetsPage = ref(1)
    const favoritedSnippetsTotal = ref(0)
    
    const myComments = ref([])
    const myCommentsPage = ref(1)
    const myCommentsTotal = ref(0)
    
    // 弹窗状态
    const showEditProfile = ref(false)
    const showChangePassword = ref(false)
    const showDeleteConfirm = ref(false)
    
    // 表单数据
    const editProfileForm = reactive({
      username: '',
      bio: ''
    })
    
    const changePasswordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    // 操作状态
    const updatingProfile = ref(false)
    const changingPassword = ref(false)
    const deleting = ref(false)
    const deletingSnippet = ref(null)
    
    // 错误信息
    const editProfileError = ref('')
    const changePasswordError = ref('')
    
    const switchTab = (tab) => {
      activeTab.value = tab
      
      // 切换标签时加载对应数据
      if (tab === 'my-snippets' && mySnippets.length === 0) {
        loadMySnippets(1)
      } else if (tab === 'liked-snippets' && likedSnippets.length === 0) {
        loadLikedSnippets(1)
      } else if (tab === 'favorited-snippets' && favoritedSnippets.length === 0) {
        loadFavoritedSnippets(1)
      } else if (tab === 'my-comments' && myComments.length === 0) {
        loadMyComments(1)
      }
    }
    
    const loadUserStats = async () => {
      try {
        const stats = await userStore.getUserStats()
        userStats.totalSnippets = stats.total_snippets || 0
        userStats.totalLikes = stats.total_likes || 0
        userStats.totalFavorites = stats.total_favorites || 0
        userStats.totalComments = stats.total_comments || 0
      } catch (err) {
        console.error('Failed to load user stats:', err)
      }
    }
    
    const loadMySnippets = async (page) => {
      try {
        loading.value = true
        mySnippetsPage.value = page
        const response = await userStore.getUserSnippets(page, pageSize.value)
        mySnippets.value = response.results
        mySnippetsTotal.value = response.total
      } catch (err) {
        console.error('Failed to load user snippets:', err)
      } finally {
        loading.value = false
      }
    }
    
    const loadLikedSnippets = async (page) => {
      try {
        loading.value = true
        likedSnippetsPage.value = page
        const response = await userStore.getLikedSnippets(page, pageSize.value)
        likedSnippets.value = response.results
        likedSnippetsTotal.value = response.total
      } catch (err) {
        console.error('Failed to load liked snippets:', err)
      } finally {
        loading.value = false
      }
    }
    
    const loadFavoritedSnippets = async (page) => {
      try {
        loading.value = true
        favoritedSnippetsPage.value = page
        const response = await userStore.getFavoritedSnippets(page, pageSize.value)
        favoritedSnippets.value = response.results
        favoritedSnippetsTotal.value = response.total
      } catch (err) {
        console.error('Failed to load favorited snippets:', err)
      } finally {
        loading.value = false
      }
    }
    
    const loadMyComments = async (page) => {
      try {
        loading.value = true
        myCommentsPage.value = page
        const response = await userStore.getUserComments(page, pageSize.value)
        myComments.value = response.results
        myCommentsTotal.value = response.total
      } catch (err) {
        console.error('Failed to load user comments:', err)
      } finally {
        loading.value = false
      }
    }
    
    const handleUpdateProfile = async () => {
      editProfileError.value = ''
      
      try {
        updatingProfile.value = true
        await userStore.updateProfile({
          username: editProfileForm.username,
          bio: editProfileForm.bio
        })
        
        showEditProfile.value = false
      } catch (err) {
        editProfileError.value = userStore.error || '更新失败，请稍后重试'
      } finally {
        updatingProfile.value = false
      }
    }
    
    const handleChangePassword = async () => {
      changePasswordError.value = ''
      
      if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
        changePasswordError.value = '两次输入的新密码不一致'
        return
      }
      
      try {
        changingPassword.value = true
        await userStore.changePassword(
          changePasswordForm.currentPassword,
          changePasswordForm.newPassword
        )
        
        showChangePassword.value = false
        // 清空表单
        changePasswordForm.currentPassword = ''
        changePasswordForm.newPassword = ''
        changePasswordForm.confirmPassword = ''
      } catch (err) {
        changePasswordError.value = userStore.error || '修改密码失败，请检查当前密码是否正确'
      } finally {
        changingPassword.value = false
      }
    }
    
    const confirmDelete = (snippet) => {
      deletingSnippet.value = snippet
      showDeleteConfirm.value = true
    }
    
    const deleteSnippet = async () => {
      try {
        deleting.value = true
        await cssnippetStore.deleteCssnippet(deletingSnippet.value.id)
        
        // 重新加载列表
        loadMySnippets(mySnippetsPage.value)
        showDeleteConfirm.value = false
      } catch (err) {
        console.error('Failed to delete snippet:', err)
      } finally {
        deleting.value = false
      }
    }
    
    const toggleVisibility = async (snippet) => {
      try {
        await cssnippetStore.toggleVisibility(snippet.id)
        snippet.is_public = !snippet.is_public
      } catch (err) {
        console.error('Failed to toggle visibility:', err)
      }
    }
    
    const deleteComment = async (commentId) => {
      try {
        await cssnippetStore.deleteComment(commentId)
        // 从列表中移除
        myComments.value = myComments.value.filter(c => c.id !== commentId)
      } catch (err) {
        console.error('Failed to delete comment:', err)
      }
    }
    
    const goToDetail = (id) => {
      router.push(`/detail/${id}`)
    }
    
    const editSnippet = (id) => {
      router.push(`/edit/${id}`)
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
    
    onMounted(() => {
      if (userStore.isLoggedIn) {
        loadUserStats()
        loadMySnippets(1)
        
        // 填充编辑资料表单
        editProfileForm.username = userStore.user.username || ''
        editProfileForm.bio = userStore.user.bio || ''
      }
    })
    
    return {
      userStore,
      activeTab,
      loading,
      userStats,
      mySnippets,
      mySnippetsPage,
      mySnippetsTotal,
      likedSnippets,
      likedSnippetsPage,
      likedSnippetsTotal,
      favoritedSnippets,
      favoritedSnippetsPage,
      favoritedSnippetsTotal,
      myComments,
      myCommentsPage,
      myCommentsTotal,
      showEditProfile,
      showChangePassword,
      showDeleteConfirm,
      editProfileForm,
      changePasswordForm,
      updatingProfile,
      changingPassword,
      deleting,
      deletingSnippet,
      editProfileError,
      changePasswordError,
      pageSize,
      switchTab,
      loadMySnippets,
      loadLikedSnippets,
      loadFavoritedSnippets,
      loadMyComments,
      handleUpdateProfile,
      handleChangePassword,
      confirmDelete,
      deleteSnippet,
      toggleVisibility,
      deleteComment,
      goToDetail,
      editSnippet,
      getPreviewStyle,
      getAvatar,
      formatDate
    }
  }
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.not-logged-in {
  text-align: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.not-logged-in h2 {
  margin-bottom: 15px;
  color: #333;
}

.not-logged-in p {
  margin-bottom: 25px;
  color: #666;
}

/* 个人信息卡片 */
.profile-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  margin-bottom: 30px;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 30px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f0f0f0;
}

.user-details h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #333;
}

.user-email {
  color: #666;
  margin-bottom: 20px;
}

.user-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #3498db;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.profile-actions {
  display: flex;
  gap: 15px;
}

.icon {
  margin-right: 5px;
}

/* 标签页 */
.profile-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
}

.tab-button {
  padding: 15px 25px;
  background: none;
  border: none;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.tab-button:hover {
  color: #3498db;
}

.tab-button.active {
  color: #3498db;
  font-weight: 500;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #3498db;
}

/* 标签页内容 */
.tab-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
}

.tab-header h3 {
  margin: 0;
  color: #333;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 16px;
}

/* 代码段网格 */
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

.snippet-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
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
}

.snippet-actions {
  display: flex;
  gap: 10px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  background-color: white;
  transition: all 0.3s;
}

.btn-sm:hover {
  opacity: 0.8;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-success {
  background-color: #28a745;
  color: white;
  border-color: #28a745;
}

/* 评论列表 */
.comments-list {
  padding: 20px 30px;
}

.comment-item {
  margin-bottom: 20px;
  padding: 20px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.comment-target a {
  color: #3498db;
  text-decoration: none;
}

.comment-target a:hover {
  text-decoration: underline;
}

.comment-content {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 15px;
}

.comment-actions {
  display: flex;
  gap: 10px;
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

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 500px;
  padding: 30px;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
}

.form-group {
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .profile-info {
    flex-direction: column;
    text-align: center;
  }
  
  .user-stats {
    justify-content: center;
  }
  
  .profile-tabs {
    overflow-x: auto;
  }
  
  .tab-button {
    padding: 15px 20px;
    white-space: nowrap;
  }
  
  .snippets-grid {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  
  .tab-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
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
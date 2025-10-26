<template>
  <div class="page-container">
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
      <div class="page-tabs">
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
            <SnippetCard 
              v-for="snippet in mySnippets" 
              :key="snippet.id"
              :cssnippet="snippet"
              :is-owner="true"
              :show-author="false"
              @edit="editSnippet(snippet.id)"
              @delete="confirmDelete(snippet)"
              @toggle-visibility="toggleVisibility(snippet)"
            />
          </div>
          
          <div v-else class="empty-state">
            <p>您还没有创建任何 CSS 代码段</p>
            <router-link to="/create" class="btn btn-primary">立即创建</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="mySnippets.length > 0">
            <Pagination 
              :current-page="mySnippetsPage"
              :total-pages="Math.ceil(mySnippetsTotal / pageSize)"
              @page-change="loadMySnippets"
            />
          </div>
        </div>
        
        <!-- 点赞的代码段 -->
        <div v-if="activeTab === 'liked-snippets'" class="liked-tab">
          <div class="tab-header">
            <h3>我点赞的 CSS 代码段</h3>
          </div>
          
          <div v-if="loading" class="loading">加载中...</div>
          
          <div v-else-if="likedSnippets.length > 0" class="snippets-grid">
            <SnippetCard 
              v-for="snippet in likedSnippets" 
              :key="snippet.id"
              :cssnippet="snippet"
              :is-owner="snippet.user_id === userStore.user?.id"
              @click="goToDetail(snippet.id)"
              @like="() => toggleLike(snippet)"
              @favorite="() => toggleFavorite(snippet)"
            />
          </div>
          
          <div v-else class="empty-state">
            <p>您还没有点赞任何 CSS 代码段</p>
            <router-link to="/" class="btn btn-outline">去浏览</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="likedSnippets.length > 0">
            <Pagination 
              :current-page="likedSnippetsPage"
              :total-pages="Math.ceil(likedSnippetsTotal / pageSize)"
              @page-change="loadLikedSnippets"
            />
          </div>
        </div>
        
        <!-- 收藏的代码段 -->
        <div v-if="activeTab === 'favorited-snippets'" class="favorited-tab">
          <div class="tab-header">
            <h3>我收藏的 CSS 代码段</h3>
          </div>
          
          <div v-if="loading" class="loading">加载中...</div>
          
          <div v-else-if="favoritedSnippets.length > 0" class="snippets-grid">
            <SnippetCard 
              v-for="snippet in favoritedSnippets" 
              :key="snippet.id"
              :cssnippet="snippet"
              :is-owner="snippet.user_id === userStore.user?.id"
              @click="goToDetail(snippet.id)"
              @like="() => toggleLike(snippet)"
              @favorite="() => toggleFavorite(snippet)"
            />
          </div>
          
          <div v-else class="empty-state">
            <p>您还没有收藏任何 CSS 代码段</p>
            <router-link to="/" class="btn btn-outline">去浏览</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="favoritedSnippets.length > 0">
            <Pagination 
              :current-page="favoritedSnippetsPage"
              :total-pages="Math.ceil(favoritedSnippetsTotal / pageSize)"
              @page-change="loadFavoritedSnippets"
            />
          </div>
        </div>
        
        <!-- 我的评论 -->
        <div v-if="activeTab === 'my-comments'" class="comments-tab">
          <div class="tab-header">
            <h3>我的评论</h3>
          </div>
          
          <div v-if="loading" class="loading">加载中...</div>
          
          <div v-else-if="myComments.length > 0" class="comments-list">
            <CommentItem
              v-for="comment in formattedComments"
              :key="comment.id"
              :comment="comment"
              :user-store="userStore"
              :replying-to="null"
              :initial-reply-content="''"
              @delete="confirmAndDeleteComment"
              @goto-detail="goToDetail"
            >
              <template #action-buttons>
                <button class="btn btn-sm btn-outline" @click="goToDetail(comment.cssnippet_id)">
                  查看代码段
                </button>
              </template>
            </CommentItem>
          </div>
          
          <div v-else class="empty-state">
            <p>您还没有发表任何评论</p>
            <router-link to="/" class="btn btn-outline">去浏览</router-link>
          </div>
          
          <!-- 分页 -->
          <div v-if="myComments.length > 0">
            <Pagination 
              :current-page="myCommentsPage"
              :total-pages="Math.ceil(myCommentsTotal / pageSize)"
              @page-change="loadMyComments"
            />
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
    
    <!-- 删除确认弹窗已替换为浏览器confirm函数 -->
    
    <!-- 删除确认弹窗 -->
    <DeleteConfirm
      :visible="showDeleteConfirm"
      title="确认删除评论"
      message="您确定要删除这条评论吗？此操作无法撤销。"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
      @overlay-click="handleCancelDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCSSnippetStore } from '../stores/cssnippet'
import SnippetCard from '../components/SnippetCard.vue'
import DeleteConfirm from '../components/DeleteConfirm.vue'
import CommentItem from '../components/CommentItem.vue'
import Pagination from '../components/Pagination.vue'
   
   const router = useRouter();
   const userStore = useUserStore()
  const cssnippetStore = useCSSnippetStore();
    
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
    const currentDeleteCommentId = ref(null)
    const deleteLoading = ref(false)
    
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
    
    // 错误信息
    const editProfileError = ref('');
    const changePasswordError = ref('');
    
    const switchTab = (tab) => {
      activeTab.value = tab
      
      // 切换标签时加载对应数据
      if (tab === 'my-snippets' && mySnippets.value.length === 0) {
        loadMySnippets(1)
      } else if (tab === 'liked-snippets' && likedSnippets.value.length === 0) {
        loadLikedSnippets(1)
      } else if (tab === 'favorited-snippets' && favoritedSnippets.value.length === 0) {
        loadFavoritedSnippets(1)
      } else if (tab === 'my-comments' && myComments.value.length === 0) {
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
        loading.value = true;
        myCommentsPage.value = page;
        const response = await userStore.getUserComments(page, pageSize.value);
        myComments.value = response.results;
        myCommentsTotal.value = response.total;
      } catch (err) {
        console.error('Failed to load user comments:', err);
      } finally {
        loading.value = false;
      }
    };
    
    const handleUpdateProfile = async () => {
        editProfileError.value = '';
        
        try {
          updatingProfile.value = true;
          await userStore.updateProfile({
            username: editProfileForm.username,
            bio: editProfileForm.bio
          });
          
          showEditProfile.value = false;
        } catch (err) {
          editProfileError.value = userStore.error || '更新失败，请稍后重试';
        } finally {
          updatingProfile.value = false;
        }
      };
    
    const handleChangePassword = async () => {
        changePasswordError.value = '';
        
        if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
          changePasswordError.value = '两次输入的新密码不一致';
          return;
        }
        
        try {
          changingPassword.value = true;
          await userStore.changePassword(
            changePasswordForm.currentPassword,
            changePasswordForm.newPassword
          );
          
          showChangePassword.value = false;
          // 清空表单
          changePasswordForm.currentPassword = '';
          changePasswordForm.newPassword = '';
          changePasswordForm.confirmPassword = '';
        } catch (err) {
          changePasswordError.value = userStore.error || '修改密码失败，请检查当前密码是否正确';
        } finally {
          changingPassword.value = false;
        }
      };
    
      const confirmDelete = async (snippet) => {
        if (confirm(`您确定要删除代码段「${snippet.title}」吗？此操作无法撤销。`)) {
          try {
            await cssnippetStore.deleteCssnippet(snippet.id);
            loadMySnippets(mySnippetsPage.value);
          } catch (err) {
            console.error('Failed to delete snippet:', err);
            alert('删除失败: ' + (err.message || '未知错误'));
          }
        }
      };

      // 删除相关函数已简化为confirmAndDeleteComment
      const toggleVisibility = async (snippet) => {
        try {
          await cssnippetStore.toggleVisibility(snippet.id);
          snippet.is_public = !snippet.is_public;
        } catch (err) {
          console.error('Failed to toggle visibility:', err);
        }
      };

      // 显示删除确认弹窗
      const confirmAndDeleteComment = (commentId) => {
        currentDeleteCommentId.value = commentId;
        showDeleteConfirm.value = true;
      };

      // 确认删除评论
      const handleConfirmDelete = async () => {
        if (!currentDeleteCommentId.value) return;
        
        deleteLoading.value = true;
        try {
          await cssnippetStore.deleteComment(currentDeleteCommentId.value);
          // 从列表中移除删除的评论
          myComments.value = myComments.value.filter(c => c.id !== currentDeleteCommentId.value);
          showDeleteConfirm.value = false;
          currentDeleteCommentId.value = null;
        } catch (err) {
          console.error('删除评论失败:', err);
          alert('删除失败: ' + (err.message || '未知错误'));
        } finally {
          deleteLoading.value = false;
        }
      };

      // 取消删除
      const handleCancelDelete = () => {
        showDeleteConfirm.value = false;
        currentDeleteCommentId.value = null;
      };
    
    const goToDetail = (id) => {
      router.push(`/detail/${id}`)
    }
    
    const editSnippet = (id) => {
  router.push(`/cssnippet/${id}/edit`)
    }
    
    // 移除了原有的getPreviewStyle方法，使用CssPreview组件代替
    
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

    // 格式化评论数据，使其符合CommentItem组件的需求
    const formattedComments = computed(() => {
      return myComments.value.map(comment => ({
        ...comment,
        // 添加username字段（个人中心评论显示自己的用户名）
        username: userStore.user?.username || '用户',
        // 确保有children字段
        children: []
      }))
    })
    
    onMounted(() => {
      if (userStore.isLoggedIn) {
        loadUserStats()
        loadMySnippets(1)
        
        // 填充编辑资料表单
        editProfileForm.username = userStore.user.username || ''
        editProfileForm.bio = userStore.user.bio || ''
      }
    })
    
    // 在<script setup>中不需要显式return，所有顶层变量和函数会自动暴露给模板
</script>

<style scoped>
/* 使用全局通用样式，保留特定页面的额外样式 */
.profile-header {
  background-color: rgba(16, 23, 42, 0.95);
  border-radius: 8px;
  margin-bottom: 20px;
}

.not-logged-in {
  text-align: center;
  padding: 60px 20px;
  color: #fff;
}

.not-logged-in h2 {
  margin-bottom: 15px;
}

.not-logged-in p {
  margin-bottom: 20px;
  color: #94a3b8;
}

.not-logged-in {
  text-align: center;
  padding: 60px 20px;
  background-color: rgba(16, 23, 42, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.not-logged-in h2 {
  margin-bottom: 15px;
  color: #38bdf8;
}

.not-logged-in p {
  margin-bottom: 25px;
  color: #64748b;
}

/* 个人信息卡片 */
.profile-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 30px;
  margin-bottom: 30px;
  background-color: rgba(16, 23, 42, 0.9);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
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
  border: 4px solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
}

.user-details h2 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #38bdf8;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.user-email {
  color: #64748b;
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
  color: #38bdf8;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.stat-label {
  font-size: 14px;
  color: #64748b;
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
  border: 1px solid rgba(56, 189, 248, 0.2);
  margin-bottom: 0;
  background-color: rgba(16, 23, 42, 0.9);
  border-radius: 8px 8px 0 0;
  padding: 0 20px;
}

.tab-button {
  padding: 15px 25px;
  background: none;
  border: none;
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.tab-button:hover {
  color: #38bdf8;
}

.tab-button.active {
  color: #38bdf8;
  font-weight: 500;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}

/* 标签页内容 */
.tab-content {
  background-color: rgba(16, 23, 42, 0.9);
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 10px rgba(56, 189, 248, 0.1);
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-top: none;
  margin-top: -1px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
}

.tab-header h3 {
  margin: 0;
  color: #38bdf8;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
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
  padding: 20px 30px;
}

.snippet-card {
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 8px;
  background-color: rgba(16, 23, 42, 0.9);
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.snippet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
}

.snippet-preview {
  width: 100%;
  min-height: 150px;
  background-color: rgba(26, 32, 44, 0.9);
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
}

.snippet-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.snippet-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.snippet-title {
  margin: 5px 0 10px;
  font-size: 18px;
  color: #38bdf8;
  line-height: 1.4;
  transition: all 0.3s;
}

.snippet-title:hover {
  color: #7dd3fc;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.snippet-description {
  color: #e2e8f0;
  font-size: 14px;
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
  color: #64748b;
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
  color: #64748b;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.snippet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.tag {
  background-color: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  transition: all 0.3s;
}

.tag:hover {
  background-color: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
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
  border: 1px solid rgba(56, 189, 248, 0.3);
  background-color: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}

.btn-sm:hover {
  background-color: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
  color: #7dd3fc;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
  cursor: pointer;
}

.snippet-actions {
  display: flex;
  gap: 10px;
  position: relative;
  z-index: 10;
}

.snippet-actions .btn {
  pointer-events: auto;
}

.btn-primary {
  background-color: #38bdf8;
  color: white;
  border-color: #38bdf8;
}

.btn-primary:hover {
  background-color: #0ea5e9;
  border-color: #0ea5e9;
  color: white;
}

.btn-danger {
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  border-color: rgba(239, 68, 68, 0.9);
}

.btn-danger:hover {
  background-color: #dc2626;
  border-color: #dc2626;
  color: white;
}

.btn-secondary {
  background-color: rgba(148, 163, 184, 0.9);
  color: white;
  border-color: rgba(148, 163, 184, 0.9);
}

.btn-secondary:hover {
  background-color: #64748b;
  border-color: #64748b;
  color: white;
}

.btn-success {
  background-color: rgba(34, 197, 94, 0.9);
  color: white;
  border-color: rgba(34, 197, 94, 0.9);
}

.btn-success:hover {
  background-color: #15803d;
  border-color: #15803d;
  color: white;
}

/* 评论列表 */
.comments-list {
  padding: 20px 30px;
}

/* 评论目标信息 */
.comment-target-info {
  margin-top: 15px;
  padding: 10px 15px;
  background-color: rgba(26, 32, 44, 0.9);
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.1);
  font-size: 14px;
}

.comment-target-info a {
  color: #38bdf8;
  text-decoration: none;
  transition: all 0.3s;
  font-weight: 500;
}

.comment-target-info a:hover {
  text-decoration: underline;
  color: #7dd3fc;
  text-shadow: 0 0 5px rgba(56, 189, 248, 0.3);
}

/* 调整CommentItem在Profile中的一些特定样式 */
.comments-list :deep(.comment-item) {
  position: relative;
}

.comments-list :deep(.comment-item .comment-header) {
  flex-wrap: wrap;
}

/* 确保查看代码段按钮在移动设备上也能正常显示 */
@media (max-width: 768px) {
  .comments-list {
    padding: 15px;
  }
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 30px;
  flex-wrap: nowrap;
}

.pagination-button {
  padding: 8px 16px;
  background-color: transparent;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  color: #38bdf8;
  width: 100px;
  text-align: center;
}

.pagination-button:hover:not(:disabled) {
  background-color: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.6);
  color: #7dd3fc;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(16, 23, 42, 0.7);
  border-color: rgba(56, 189, 248, 0.1);
}

.pagination-info {
  font-size: 14px;
  color: #64748b;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  width: 90%;
  max-width: 500px;
  padding: 30px;
  background-color: rgba(16, 23, 42, 0.95);
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(56, 189, 248, 0.1);
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #38bdf8;
  text-align: center;
  font-size: 20px;
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

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 4px;
  background-color: rgba(26, 32, 44, 0.9);
  color: #e2e8f0;
  font-size: 16px;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #e2e8f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
    padding: 20px;
  }
  
  .profile-info {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .user-stats {
    justify-content: center;
    gap: 20px;
  }
  
  .profile-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  /* 响应式样式覆盖 */
  .page-tabs {
    overflow-x: auto;
    padding: 0;
  }
  
  .tab-button {
    padding: 15px 20px;
    white-space: nowrap;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    padding: 15px;
    gap: 20px;
  }
  
  .tab-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
    padding: 15px;
  }
  
  .comment-section {
    padding: 15px;
  }
  
  .comment-form {
    padding: 15px;
  }
  
  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .pagination {
    flex-wrap: nowrap;
    gap: 10px;
    padding: 20px 15px;
    justify-content: center;
    max-width: 100%;
  }
  
  .pagination-button {
    width: 90px;
    font-size: 14px;
    padding: 8px 12px;
    flex: none;
  }
  
  .pagination-info {
    flex: 1;
    min-width: 120px;
    max-width: 150px;
  }
  
  /* 在中等窄屏上的优化 */
  @media (max-width: 600px) {
    .pagination {
      justify-content: center;
      gap: 8px;
    }
    
    .pagination-button {
      width: 85px;
      font-size: 13px;
      padding: 7px 10px;
    }
    
    .pagination-info {
      font-size: 13px;
      min-width: 100px;
      max-width: 130px;
    }
  }
  
  /* 极窄屏幕下的适配 */
  @media (max-width: 420px) {
    .pagination {
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .pagination-info {
      order: 2;
      width: 100%;
      margin-top: 8px;
      text-align: center;
      max-width: none;
    }
    
    .pagination-button {
      width: 85px;
      margin: 0 5px;
    }
  }
  
  .modal-content {
    width: 95%;
    padding: 20px;
  }
}
</style>
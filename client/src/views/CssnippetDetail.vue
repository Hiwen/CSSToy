<template>
  <div class="cssnippet-detail-container">
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="cssnippet" class="content-wrapper">
      <!-- 头部信息 -->
      <div class="detail-header">
        <h1>{{ cssnippet.title }}</h1>

        <div class="author-info">
          <img :src="getAvatar(cssnippet.user_id)" alt="作者头像" class="avatar">
          <div class="author-details">
            <span class="author-name">{{ cssnippet.username }}</span>
            <span class="publish-date">{{ formatDate(cssnippet.created_at) }}</span>
          </div>
        </div>

        <div class="tags-container">
          <span v-for="tag in cssnippet.tags" :key="tag.id" class="tag" @click.stop="handleTagClick(tag.name, $event)">
            {{ tag.name }}
          </span>
        </div>

        <div class="description">{{ cssnippet.description }}</div>

        <div class="action-buttons">
          <button class="btn btn-outline" @click.stop="toggleLike($event)" :class="{ 'active': cssnippet.isLiked }">
            <span class="icon">{{ cssnippet.isLiked ? '❤️' : '🤍' }}</span>
            <span>{{ cssnippet.likes_count }}</span>
          </button>

          <button class="btn btn-outline" @click.stop="toggleFavorite($event)" :class="{ 'active': cssnippet.isCollected }">
            <span class="icon">{{ cssnippet.isCollected ? '⭐' : '☆' }}</span>
            <span>{{ cssnippet.favorite_count || cssnippet.collections_count }}</span>
          </button>

          <button class="btn btn-outline" @click.stop="copyCode($event)">
            <span class="icon">📋</span>
            <span>{{ copySuccess ? '已复制' : '复制代码' }}</span>
          </button>

          <button class="btn btn-outline" @click.stop="shareCode($event)">
            <span class="icon">🔗</span>
            <span>分享</span>
          </button>

          <template v-if="isOwner">
            <button class="btn btn-primary" @click.stop="editCode($event)">
              <span class="icon">✏️</span>
              <span>编辑</span>
            </button>

            <button class="btn btn-danger" @click.stop="confirmDelete($event)">
              <span class="icon">🗑️</span>
              <span>删除</span>
            </button>
          </template>
        </div>
      </div>

      <!-- 实时预览 -->
      <div class="preview-section-wrapper">
        <div class="preview-section">
          <h3>实时预览</h3>
          <div class="preview-box">
            <div class="preview-element" v-html="previewHtml"></div>
          </div>
        </div>
      </div>
      
      <!-- 代码区域 -->
      <div class="code-preview-container">
        <div class="code-section">
          <h3>CSS 代码</h3>
          <pre><code class="language-css">{{ cssnippet.css_content }}</code></pre>
        </div>

        <div class="code-section">
          <h3>HTML 代码</h3>
          <pre><code class="language-html">{{ cssnippet.html_content || '无HTML内容' }}</code></pre>
        </div>
      </div>

      <!-- 评论区域 -->
      <div class="comments-section">
        <h3>评论 ({{ comments.length }})</h3>

        <!-- 评论表单 -->
        <div v-if="userStore.isLoggedIn" class="comment-form">
          <textarea v-model="newComment.content" placeholder="写下你的评论..." rows="3"></textarea>
          <button class="btn btn-primary" @click="submitComment" :disabled="!newComment.content.trim()">
            发表评论
          </button>
        </div>
        <div v-else class="login-prompt">
          <router-link to="/login" class="link">登录</router-link> 后发表评论
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <CommentItem
            v-for="comment in comments"
            :key="comment.id"
            :comment="comment"
            :user-store="userStore"
            :replying-to="replyingTo"
            :initial-reply-content="replyContent"
            @reply="handleReplyComment"
            @submit-reply="handleSubmitReply"
            @cancel-reply="cancelReply"
            @delete="handleDeleteComment"
          />
        </div>
      </div>

      <!-- 相关推荐 -->
      <div class="related-section">
        <h3>相关推荐</h3>
        <div class="related-list">
          <div v-for="snippet in relatedSnippets" :key="snippet.id" class="related-item">
            <router-link :to="`/detail/${snippet.id}`" class="related-link">
              <h4>{{ snippet.title }}</h4>
              <p class="related-author">{{ snippet.username }}</p>
              <div class="related-stats">
                <span>{{ snippet.likes_count }} 喜欢</span>
                <span>{{ snippet.view_count }} 浏览</span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-found">未找到代码段</div>

    <!-- 删除确认弹窗 -->
    <DeleteConfirm
      :visible="showDeleteConfirm"
      :title="deletingCommentId ? '确认删除评论' : '确认删除代码段'"
      :message="deletingCommentId ? '您确定要删除这条评论吗？此操作无法撤销。' : '您确定要删除这个 CSS 代码段吗？此操作无法撤销。'"
      :loading="deleteLoading"
      @confirm="confirmDeleteAction"
      @cancel="handleCancelDelete"
      @overlay-click="handleCancelDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCssnippetStore } from '../stores/cssnippet'
import { useUserStore } from '../stores/user'
import DeleteConfirm from '../components/DeleteConfirm.vue'
import CommentItem from '../components/CommentItem.vue'

const route = useRoute()
const router = useRouter()
const cssnippetStore = useCssnippetStore()
const userStore = useUserStore()

// 状态
const loading = ref(false)
const cssnippet = ref(null)
const comments = ref([])
const relatedSnippets = ref([])
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)
const deletingCommentId = ref(null)
const copySuccess = ref(false)

// 评论相关
const newComment = ref({ content: '' })
const replyingTo = ref(null)
const replyContent = ref('')

// 计算属性
const isOwner = computed(() => {
  if (!cssnippet.value || !userStore.user) return false
  return cssnippet.value.user_id === userStore.user.id
})

const previewHtml = computed(() => {
  if (!cssnippet.value || !cssnippet.value.html_content) {
    // 提供默认HTML片段，让CSS样式有更好的预览效果
    return '<div class="demo-box">示例元素</div>';
  }
  return cssnippet.value.html_content;
})

// 动态应用CSS样式到预览区域
watch(() => cssnippet.value?.css_content, (newCss) => {
  // 移除之前的样式
  const existingStyle = document.getElementById('preview-inline-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // 创建新的样式元素
    if (newCss) {
      const styleElement = document.createElement('style');
      styleElement.id = 'preview-inline-style';
      // 使用CSS选择器限制样式只应用于预览区域，同时应用到预览元素本身及其子元素
      styleElement.textContent = `.preview-element,
.preview-element * {
${newCss}
}`;
      document.head.appendChild(styleElement);
    }
}, { immediate: true })

// 组件卸载时清理样式
const cleanupStyle = () => {
  const existingStyle = document.getElementById('preview-inline-style');
  if (existingStyle) {
    existingStyle.remove();
  }
}

// 页面切换时清理样式
window.addEventListener('beforeunload', cleanupStyle);

// 组件销毁时清理
import('vue').then(({ onUnmounted }) => {
  onUnmounted(() => {
    cleanupStyle();
    window.removeEventListener('beforeunload', cleanupStyle);
  });
})

// 方法
onMounted(() => {
  loadCssnippetDetail()
})

const loadCssnippetDetail = async () => {
  const id = route.params.id
  try {
    loading.value = true
    const data = await cssnippetStore.getCssnippetDetail(id)
    cssnippet.value = data
    // 加载评论数据
    comments.value = await cssnippetStore.fetchComments(id)
    relatedSnippets.value = []
  } catch (err) {
    console.error('Failed to load cssnippet detail:', err)
  } finally {
    loading.value = false
  }
}

const toggleLike = async (event) => {
  // 确保事件被完全阻止
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    await cssnippetStore.toggleLike(cssnippet.value.id)
  } catch (err) {
    console.error('Toggle like failed:', err)
  }
}

const toggleFavorite = async (event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    await cssnippetStore.toggleCollect(cssnippet.value.id)
  } catch (err) {
    console.error('Toggle favorite failed:', err)
  }
}

const copyCode = async (event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  try {
    await navigator.clipboard.writeText(cssnippet.value.css_content)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Copy code failed:', err)
  }
}

const shareCode = async (event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Share code failed:', err)
  }
}

const editCode = (event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  router.push(`/cssnippet/${cssnippet.value.id}/edit`)
}

const confirmDelete = (event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  showDeleteConfirm.value = true
}

const handleCancelDelete = () => {
  showDeleteConfirm.value = false
  deletingCommentId.value = null
}

const confirmDeleteAction = async () => {
  try {
    deleteLoading.value = true
    if (deletingCommentId.value) {
      await cssnippetStore.deleteComment(deletingCommentId.value)
      // 从评论列表中移除
      comments.value = comments.value.filter(comment => comment.id !== deletingCommentId.value)
    } else {
      await cssnippetStore.delete(cssnippet.value.id)
      router.push('/')
      return
    }
    showDeleteConfirm.value = false
    deletingCommentId.value = null
  } catch (err) {
    console.error('Delete failed:', err)
  } finally {
    deleteLoading.value = false
  }
}

const submitComment = async () => {
  if (!newComment.value.content.trim()) return
  
  try {
    const comment = await cssnippetStore.addComment({
      cssnippet_id: cssnippet.value.id,
      content: newComment.value.content
    })
    comments.value.unshift(comment)
    newComment.value.content = ''
  } catch (err) {
    console.error('Submit comment failed:', err)
  }
}

const handleReplyComment = (comment) => {
  replyingTo.value = comment.id
  replyContent.value = ''
  nextTick(() => {
    const textarea = document.querySelector(`.reply-form textarea`)
    if (textarea) textarea.focus()
  })
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

const handleSubmitReply = async (parentId, content) => {
  if (!content.trim()) return
  
  try {
    const reply = await cssnippetStore.addComment({
      cssnippet_id: cssnippet.value.id,
      content: content,
      parent_id: parentId
    })
    
    // 将回复添加到父评论的children数组中
    const parentComment = comments.value.find(comment => comment.id === parentId)
    if (parentComment) {
      if (!parentComment.children) parentComment.children = []
      parentComment.children.push(reply)
    }
    
    replyingTo.value = null
    replyContent.value = ''
  } catch (err) {
    console.error('Submit reply failed:', err)
  }
}

const handleDeleteComment = (commentId) => {
  deletingCommentId.value = commentId
  showDeleteConfirm.value = true
}

const isCommentOwner = (comment) => {
  return userStore.user && userStore.user.id === comment.user_id
}

const handleTagClick = (tagName, event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  router.push(`/search?tag=${encodeURIComponent(tagName)}`)
}

const getAvatar = (userId) => {
  // 简单的头像生成逻辑，实际项目中可能需要调用API或使用更复杂的算法
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'default'}`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60 * 1000) return '刚刚'
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return `${minutes}分钟前`
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }
  
  // 小于30天
  if (diff < 30 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }
  
  // 格式化日期
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getUsernameById = (userId) => {
  // 这里应该从用户数据中获取用户名，暂时返回占位符
  return '用户'
}
</script>

<style scoped>
.cssnippet-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: transparent;
  min-height: 100vh;
}

.loading, .not-found {
  text-align: center;
  padding: 50px;
  color: #94a3b8;
}

.content-wrapper {
  background-color: rgba(16, 23, 42, 0.9);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.1);
  overflow: hidden;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

/* 头部信息 */
.detail-header {
  padding: 30px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
}

.detail-header h1 {
  margin: 0 0 20px 0;
  color: #38bdf8;
  font-size: 28px;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  border: 2px solid rgba(56, 189, 248, 0.3);
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #38bdf8;
  margin-bottom: 4px;
}

.publish-date {
  font-size: 14px;
  color: #64748b;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tag {
  background-color: rgba(56, 189, 248, 0.1);
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 14px;
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.tag:hover {
  background-color: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.description {
  margin-bottom: 20px;
  line-height: 1.6;
  color: #e2e8f0;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-outline {
  background-color: rgba(16, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #e0e0e0;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-outline:hover {
  background-color: rgba(56, 189, 248, 0.1);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.btn-outline.active {
  background-color: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
}

.btn-primary {
  background-color: #38bdf8;
  color: #050508;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-primary:hover {
  background-color: #60a5fa;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.5);
}

.btn-danger {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-danger:hover {
  background-color: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

/* 代码和预览区域 */
.code-preview-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 30px;
}

.preview-section-wrapper {
  padding: 0 30px 30px;
  position: relative;
  z-index: 1;
}

.code-section,
.preview-section {
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.code-section h3,
.preview-section h3 {
  margin-bottom: 15px;
  color: #38bdf8;
  font-size: 18px;
}

.code-section pre {
  background-color: rgba(16, 23, 42, 0.95);
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.code-section code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #e2e8f0;
}

.preview-box {
  border: 1px solid rgba(56, 189, 248, 0.3);
  background-color: rgba(26, 32, 44, 0.9);
  padding: 30px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.preview-element {
  background-color: white;
  min-width: 100px;
  min-height: 50px;
  position: relative;
  z-index: 1;
}

/* 评论区域 */
.comments-section {
  padding: 30px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.comments-section h3 {
  margin-bottom: 20px;
  color: #38bdf8;
  font-size: 18px;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  background-color: rgba(16, 23, 42, 0.9);
  color: #e0e0e0;
}

.comment-form button {
  margin-top: 10px;
  background-color: #38bdf8;
  color: #050508;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.comment-form button:hover:not(:disabled) {
  background-color: #60a5fa;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.5);
}

.comment-form button:disabled {
  background-color: #334155;
  cursor: not-allowed;
  box-shadow: none;
}

.login-prompt {
  margin-bottom: 30px;
  color: #64748b;
}

.login-prompt .link {
  color: #38bdf8;
  text-decoration: none;
}

.login-prompt .link:hover {
  text-decoration: underline;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  padding: var(--comment-padding);
  border-radius: var(--data-item-border-radius);
  border: var(--data-item-border);
  box-shadow: var(--data-item-shadow);
  transition: var(--transition);
}

.comment-item:hover {
  border-color: var(--data-item-border-hover);
  box-shadow: var(--data-item-shadow-hover);
  transform: translateY(-2px);
}

.comment-item.child {
  margin-left: var(--child-comment-margin-left);
  margin-top: var(--child-comment-margin-top);
  padding: var(--child-comment-padding);
  background-color: var(--child-comment-bg);
  border: var(--child-comment-border);
  box-shadow: var(--child-comment-shadow);
}

.comment-item.child:hover {
  border-color: var(--child-comment-border-hover);
  box-shadow: var(--child-comment-shadow-hover);
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.comment-info {
  flex: 1;
}

.comment-author {
  font-weight: 600;
  color: #38bdf8;
  margin-right: 10px;
}

.comment-time {
  font-size: 12px;
  color: #64748b;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-sm:hover {
  color: #38bdf8;
}

.text-danger {
  color: #ef4444;
}

.text-danger:hover {
  color: #f87171;
}

.comment-content {
  line-height: 1.6;
  color: #e2e8f0;
}

.comment-content .link {
  color: #38bdf8;
  text-decoration: none;
}

.comment-content .link:hover {
  text-decoration: underline;
}

.reply-form {
  margin-top: 15px;
}

.reply-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  background-color: rgba(16, 23, 42, 0.9);
  color: #e0e0e0;
}

.reply-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.reply-actions .btn-sm.btn-primary {
  background-color: #38bdf8;
  color: #050508;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
}

.reply-actions .btn-sm.btn-outline {
  border: 1px solid rgba(56, 189, 248, 0.5);
  padding: 4px 12px;
  border-radius: 4px;
  color: #38bdf8;
}

.child-comments {
  margin-top: 15px;
}

/* 相关推荐区域 */
.related-section {
  padding: 30px;
  border-top: 1px solid rgba(56, 189, 248, 0.2);
}

.related-section h3 {
  margin-bottom: 20px;
  color: #38bdf8;
  font-size: 18px;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.related-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.related-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.related-link {
  display: block;
  padding: 20px;
  text-decoration: none;
  color: inherit;
}

.related-link h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
  line-height: 1.4;
}

.related-author {
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
}

.related-stats {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .code-preview-container {
    grid-template-columns: 1fr;
  }
  
  .related-list {
    grid-template-columns: 1fr;
  }
  
  .comment-item.child {
    margin-left: 20px;
  }
}
</style>
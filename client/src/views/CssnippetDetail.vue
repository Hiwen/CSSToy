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
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <img :src="getAvatar(comment.user_id)" alt="评论者头像" class="avatar">
              <div class="comment-info">
                <span class="comment-author">{{ comment.username }}</span>
                <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
              </div>
              <div class="comment-actions">
                <button class="btn btn-sm" @click="replyToComment(comment)">
                  回复
                </button>
                <button v-if="isCommentOwner(comment)" class="btn btn-sm text-danger"
                  @click.stop="deleteComment(comment.id, $event)">
                  删除
                </button>
              </div>
            </div>

            <div class="comment-content">
              <span v-if="comment.parent_id">
                <a href="#" class="link">@{{ getUsernameById(comment.parent_user_id) }}</a>
              </span>
              {{ comment.content }}
            </div>

            <!-- 回复表单 -->
            <div v-if="replyingTo === comment.id" class="reply-form">
              <textarea v-model="replyContent" placeholder="回复 @{{ comment.username }}..." rows="2"></textarea>
              <div class="reply-actions">
                <button class="btn btn-sm btn-primary" @click="submitReply(comment.id)">
                  回复
                </button>
                <button class="btn btn-sm btn-outline" @click="cancelReply">
                  取消
                </button>
              </div>
            </div>

            <!-- 子评论 -->
            <div class="child-comments" v-if="comment.children && comment.children.length > 0">
              <div v-for="child in comment.children" :key="child.id" class="comment-item child">
                <div class="comment-header">
                  <img :src="getAvatar(child.user_id)" alt="回复者头像" class="avatar">
                  <div class="comment-info">
                    <span class="comment-author">{{ child.username }}</span>
                    <span class="comment-time">{{ formatDate(child.created_at) }}</span>
                  </div>
                  <div class="comment-actions">
                    <button class="btn btn-sm" @click="replyToComment(child)">
                      回复
                    </button>
                    <button v-if="isCommentOwner(child)" class="btn btn-sm text-danger"
                      @click.stop="deleteComment(child.id, $event)">
                      删除
                    </button>
                  </div>
                </div>

                <div class="comment-content">
                  <span>
                    <a href="#" class="link">@{{ getUsernameById(child.parent_user_id) }}</a>
                  </span>
                  {{ child.content }}
                </div>
              </div>
            </div>
          </div>
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
    if (cssnippet.value.isLiked) {
      await cssnippetStore.unlike(cssnippet.value.id)
      cssnippet.value.likes_count--
    } else {
      await cssnippetStore.like(cssnippet.value.id)
      cssnippet.value.likes_count++
    }
    cssnippet.value.isLiked = !cssnippet.value.isLiked
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
    if (cssnippet.value.isCollected) {
      await cssnippetStore.removeCollection(cssnippet.value.id)
      cssnippet.value.collections_count--
    } else {
      await cssnippetStore.addCollection(cssnippet.value.id)
      cssnippet.value.collections_count++
    }
    cssnippet.value.isCollected = !cssnippet.value.isCollected
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

const replyToComment = (comment) => {
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

const submitReply = async (parentId) => {
  if (!replyContent.value.trim()) return
  
  try {
    const reply = await cssnippetStore.addComment({
      cssnippet_id: cssnippet.value.id,
      content: replyContent.value,
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

const deleteComment = (commentId, event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
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
  background-color: #f5f5f5;
  min-height: 100vh;
}

.loading, .not-found {
  text-align: center;
  padding: 50px;
  color: #666;
}

.content-wrapper {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 头部信息 */
.detail-header {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.detail-header h1 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 28px;
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
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.publish-date {
  font-size: 14px;
  color: #999;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tag {
  background-color: #f0f0f0;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  transition: all 0.3s;
}

.tag:hover {
  background-color: #e0e0e0;
  color: #333;
}

.description {
  margin-bottom: 20px;
  line-height: 1.6;
  color: #555;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-outline {
  background-color: white;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-outline:hover {
  background-color: #f5f5f5;
}

.btn-outline.active {
  background-color: #e3f2fd;
  border-color: #2196f3;
  color: #2196f3;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-danger {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.btn-danger:hover {
  background-color: #d32f2f;
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
  color: #333;
}

.code-section pre {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
}

.code-section code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.preview-box {
  border: 1px solid #ddd;
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
  border-top: 1px solid #eee;
}

.comments-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

.comment-form button {
  margin-top: 10px;
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.comment-form button:hover:not(:disabled) {
  background-color: #1976d2;
}

.comment-form button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.login-prompt {
  margin-bottom: 30px;
  color: #666;
}

.login-prompt .link {
  color: #2196f3;
  text-decoration: none;
}

.login-prompt .link:hover {
  text-decoration: underline;
}

.comments-list {
  space-y: 20px;
}

.comment-item {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.comment-item.child {
  margin-left: 40px;
  padding: 15px;
  background-color: #f5f5f5;
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
  color: #333;
  margin-right: 10px;
}

.comment-time {
  font-size: 12px;
  color: #999;
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
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-sm:hover {
  color: #333;
}

.text-danger {
  color: #f44336;
}

.comment-content {
  line-height: 1.6;
  color: #333;
}

.comment-content .link {
  color: #2196f3;
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
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

.reply-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.reply-actions .btn-sm.btn-primary {
  background-color: #2196f3;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
}

.reply-actions .btn-sm.btn-outline {
  border: 1px solid #ddd;
  padding: 4px 12px;
  border-radius: 4px;
}

.child-comments {
  margin-top: 15px;
}

/* 相关推荐 */
.related-section {
  padding: 30px;
  border-top: 1px solid #eee;
}

.related-section h3 {
  margin-bottom: 20px;
  color: #333;
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
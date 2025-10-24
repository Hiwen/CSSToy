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
          <span v-for="tag in cssnippet.tags" :key="tag.id" class="tag" @click="handleTagClick(tag.name)">
            {{ tag.name }}
          </span>
        </div>

        <div class="description">{{ cssnippet.description }}</div>

        <div class="action-buttons">
          <button class="btn btn-outline" @click="toggleLike" :class="{ 'active': cssnippet.isLiked }">
            <span class="icon">{{ cssnippet.isLiked ? '❤️' : '🤍' }}</span>
            <span>{{ cssnippet.likes_count }}</span>
          </button>

          <button class="btn btn-outline" @click="toggleFavorite" :class="{ 'active': cssnippet.isCollected }">
            <span class="icon">{{ cssnippet.isCollected ? '⭐' : '☆' }}</span>
            <span>{{ cssnippet.collections_count }}</span>
          </button>

          <button class="btn btn-outline" @click="copyCode">
            <span class="icon">📋</span>
            <span>{{ copySuccess ? '已复制' : '复制代码' }}</span>
          </button>

          <button class="btn btn-outline" @click="shareCode">
            <span class="icon">🔗</span>
            <span>分享</span>
          </button>

          <template v-if="isOwner">
            <button class="btn btn-primary" @click="editCode">
              <span class="icon">✏️</span>
              <span>编辑</span>
            </button>

            <button class="btn btn-danger" @click="confirmDelete">
              <span class="icon">🗑️</span>
              <span>删除</span>
            </button>
          </template>
        </div>
      </div>

      <!-- 代码和预览区域 -->
      <div class="code-preview-container">
        <div class="code-section">
          <h3>CSS 代码</h3>
          <pre><code class="language-css">{{ cssnippet.css_content }}</code></pre>
        </div>

        <div class="preview-section">
          <h3>实时预览</h3>
          <div class="preview-box">
            <div class="preview-element" :style="cssCodeStyles"></div>
          </div>
        </div>
      </div>

      <!-- HTML 模板选择 -->
      <div class="html-template-section" v-if="htmlTemplates.length > 0">
        <h3>选择 HTML 模板</h3>
        <div class="templates-grid">
          <div v-for="template in htmlTemplates" :key="template.id" class="template-item"
            :class="{ 'active': selectedTemplate === template.id }" @click="selectTemplate(template.id)">
            <div class="template-preview" v-html="template.preview_html"></div>
            <span>{{ template.name }}</span>
          </div>
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
                  @click="deleteComment(comment.id)">
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
                      @click="deleteComment(child.id)">
                      删除
                    </button>
                  </div>
                </div>

                <div class="comment-content">
                  <a href="#" class="link">@{{ getUsernameById(child.parent_user_id) }}</a>
                  {{ child.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关推荐 -->
      <div class="related-section" v-if="relatedSnippets.length > 0">
        <h3>相关推荐</h3>
        <div class="related-snippets">
          <div v-for="snippet in relatedSnippets" :key="snippet.id" class="related-snippet-item"
            @click="goToDetail(snippet.id)">
            <div class="related-snippet-title">{{ snippet.title }}</div>
            <div class="related-snippet-meta">
              <span>{{ snippet.username }}</span>
              <span>❤️ {{ snippet.likes_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-found">未找到代码段</div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content card" @click.stop>
        <h3>确认删除</h3>
        <p>您确定要删除这个 CSS 代码段吗？此操作无法撤销。</p>
        <div class="modal-actions">
          <button class="btn btn-danger" @click="deleteCode">确认删除</button>
          <button class="btn btn-outline" @click="showDeleteConfirm = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCssnippetStore } from '../stores/cssnippet'
import { useUserStore } from '../stores/user'

export default {
  name: 'CssnippetDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const cssnippetStore = useCssnippetStore()
    const userStore = useUserStore()

    const cssnippet = ref(null)
    const loading = ref(true)
    const comments = ref([])
    const relatedSnippets = ref([])
    const htmlTemplates = ref([
      { id: 1, name: '按钮', preview_html: '<button>按钮</button>' },
      { id: 2, name: '卡片', preview_html: '<div class="card">卡片内容</div>' },
      { id: 3, name: '链接', preview_html: '<a href="#">链接</a>' },
      { id: 4, name: '输入框', preview_html: '<input type="text" placeholder="输入框">' }
    ])
    const selectedTemplate = ref(1)
    const copySuccess = ref(false)
    const showDeleteConfirm = ref(false)

    // 评论相关
    const newComment = ref({ content: '' })
    const replyingTo = ref(null)
    const replyContent = ref('')

    // 计算属性
    const isOwner = computed(() => {
      if (!cssnippet.value || !userStore.user) return false
      return cssnippet.value.user_id === userStore.user.id
    })

    const cssCodeStyles = computed(() => {
      if (!cssnippet.value) {
        return "";
      }

      return cssnippet.value.css_content;
    })

    // 方法
    const loadCssnippetDetail = async () => {
      const id = route.params.id
      try {
        loading.value = true
        const data = await cssnippetStore.getCssnippetDetail(id)
        cssnippet.value = data
        // 暂时清空评论和相关代码段，因为API不返回这些数据
        comments.value = []
        relatedSnippets.value = []
      } catch (err) {
        console.error('Failed to load cssnippet detail:', err)
      } finally {
        loading.value = false
      }
    }

    const toggleLike = async () => {
      if (!userStore.isLoggedIn) {
        router.push('/login')
        return
      }

      try {
        await cssnippetStore.toggleLike(cssnippet.value.id)
        // 更新本地状态
        cssnippet.value.isLiked = !cssnippet.value.isLiked
        cssnippet.value.likes_count += cssnippet.value.isLiked ? 1 : -1
      } catch (err) {
        console.error('Failed to toggle like:', err)
      }
    }

    const toggleFavorite = async () => {
      if (!userStore.isLoggedIn) {
        router.push('/login')
        return
      }

      try {
        await cssnippetStore.toggleCollect(cssnippet.value.id)
        // 更新本地状态
        cssnippet.value.isCollected = !cssnippet.value.isCollected
        cssnippet.value.collections_count += cssnippet.value.isCollected ? 1 : -1
      } catch (err) {
        console.error('Failed to toggle favorite:', err)
      }
    }

    const copyCode = async () => {
      try {
        await navigator.clipboard.writeText(cssnippet.value.css_content)
        copySuccess.value = true
        setTimeout(() => {
          copySuccess.value = false
        }, 2000)
      } catch (err) {
        console.error('Failed to copy code:', err)
      }
    }

    const shareCode = () => {
      const url = window.location.href
      // 这里可以实现分享功能，比如使用 Web Share API
      alert(`分享链接：${url}`)
    }

    const editCode = () => {
      router.push(`/edit/${cssnippet.value.id}`)
    }

    const confirmDelete = () => {
      showDeleteConfirm.value = true
    }

    const deleteCode = async () => {
      try {
        await cssnippetStore.deleteCssnippet(cssnippet.value.id)
        router.push('/')
      } catch (err) {
        console.error('Failed to delete cssnippet:', err)
      } finally {
        showDeleteConfirm.value = false
      }
    }

    const selectTemplate = (id) => {
      selectedTemplate.value = id
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
        console.error('Failed to submit comment:', err)
      }
    }

    const replyToComment = (comment) => {
      replyingTo.value = comment.id
      replyContent.value = ''
    }

    const submitReply = async (parentId) => {
      if (!replyContent.value.trim()) return

      try {
        const reply = await cssnippetStore.addComment({
          cssnippet_id: cssnippet.value.id,
          parent_id: parentId,
          content: replyContent.value
        })

        // 更新评论树
        const findAndAddReply = (commentsList) => {
          for (let comment of commentsList) {
            if (comment.id === parentId) {
              if (!comment.children) comment.children = []
              comment.children.push(reply)
              return true
            }
            if (comment.children && findAndAddReply(comment.children)) {
              return true
            }
          }
          return false
        }

        findAndAddReply(comments.value)
        cancelReply()
      } catch (err) {
        console.error('Failed to submit reply:', err)
      }
    }

    const cancelReply = () => {
      replyingTo.value = null
      replyContent.value = ''
    }

    const deleteComment = async (commentId) => {
      try {
        await cssnippetStore.deleteComment(commentId)
        // 从评论树中移除
        const removeComment = (commentsList) => {
          for (let i = 0; i < commentsList.length; i++) {
            if (commentsList[i].id === commentId) {
              commentsList.splice(i, 1)
              return true
            }
            if (commentsList[i].children && removeComment(commentsList[i].children)) {
              return true
            }
          }
          return false
        }

        removeComment(comments.value)
      } catch (err) {
        console.error('Failed to delete comment:', err)
      }
    }

    const isCommentOwner = (comment) => {
      if (!userStore.user) return false
      return comment.user_id === userStore.user.id
    }

    const handleTagClick = (tagName) => {
      router.push(`/search?q=${encodeURIComponent(tagName)}&type=tag`)
    }

    const goToDetail = (id) => {
      router.push(`/cssnippet/${id}`)
    }

    const getAvatar = (userId) => {
      // 简单的头像生成逻辑，实际项目中可能需要根据用户信息获取真实头像
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

    const getUsernameById = (userId) => {
      // 这里可以从已加载的评论中查找用户名，或者维护一个用户ID到用户名的映射
      const findUser = (commentsList) => {
        for (const comment of commentsList) {
          if (comment.user_id === userId) {
            return comment.username
          }
          if (comment.children) {
            const result = findUser(comment.children)
            if (result) return result
          }
        }
        return ''
      }
      return findUser(comments.value) || '用户'
    }

    // 组件挂载时加载数据
    onMounted(() => {
      loadCssnippetDetail()
    })

    return {
      cssnippet,
      loading,
      comments,
      relatedSnippets,
      htmlTemplates,
      selectedTemplate,
      copySuccess,
      showDeleteConfirm,
      newComment,
      replyingTo,
      replyContent,
      userStore,
      isOwner,
      cssCodeStyles,
      toggleLike,
      toggleFavorite,
      copyCode,
      shareCode,
      editCode,
      confirmDelete,
      deleteCode,
      selectTemplate,
      submitComment,
      replyToComment,
      submitReply,
      cancelReply,
      deleteComment,
      isCommentOwner,
      handleTagClick,
      goToDetail,
      getAvatar,
      formatDate,
      getUsernameById
    }
  }
}
</script>

<style scoped>
.cssnippet-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.not-found {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #777;
}

.content-wrapper {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 头部信息 */
.detail-header {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.detail-header h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #333;
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
  margin-right: 10px;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
  color: #333;
}

.publish-date {
  font-size: 14px;
  color: #777;
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

/* 代码和预览区域 */
.code-preview-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 30px;
}

.code-section,
.preview-section {
  border-radius: 8px;
  overflow: hidden;
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
}

.preview-element {
  background-color: white;
  min-width: 100px;
  min-height: 50px;
}

/* HTML 模板选择 */
.html-template-section {
  padding: 30px;
  border-top: 1px solid #eee;
}

.html-template-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.template-item {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #3498db;
}

.template-item.active {
  border-color: #3498db;
  background-color: #e3f2fd;
}

.template-preview {
  margin-bottom: 10px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 10px;
}

.login-prompt {
  padding: 20px;
  text-align: center;
  color: #777;
}

.comments-list {
  margin-top: 30px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.comment-item.child {
  padding-left: 40px;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.comment-info {
  margin-right: auto;
  margin-left: 10px;
}

.comment-author {
  font-weight: 500;
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
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
}

.btn-sm:hover {
  color: #3498db;
}

.comment-content {
  margin-left: 50px;
  line-height: 1.6;
  color: #333;
}

.reply-form {
  margin-left: 50px;
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.reply-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 10px;
}

.reply-actions {
  display: flex;
  gap: 10px;
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

.related-snippets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.related-snippet-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.related-snippet-item:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.related-snippet-title {
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.related-snippet-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #777;
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
  max-width: 400px;
  padding: 20px;
}

.modal-content h3 {
  margin-bottom: 15px;
}

.modal-content p {
  margin-bottom: 20px;
  color: #555;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .code-preview-container {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    justify-content: center;
  }

  .related-snippets {
    grid-template-columns: 1fr;
  }

  .detail-header h1 {
    font-size: 24px;
  }
}
</style>
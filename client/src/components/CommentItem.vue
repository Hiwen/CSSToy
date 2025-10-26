<template>
  <div class="comment-item">
    <div class="comment-header">
      <img :src="getAvatar(comment.user_id)" alt="评论者头像" class="avatar">
      <div class="comment-info">
        <span class="comment-author">{{ comment.username }}</span>
        <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
      </div>
      <div class="comment-actions">
        <button class="btn btn-sm" @click="handleReply">
          回复
        </button>
        <button v-if="isOwner(comment)" class="btn btn-sm text-danger"
          @click.stop="handleDelete">
          删除
        </button>
        <slot name="action-buttons"></slot>
      </div>
    </div>

    <div class="comment-content">
      <span v-if="comment.parent_id">
        <a href="#" class="link">@{{ getUsernameById(comment.parent_user_id) }}</a>
      </span>
      {{ comment.content }}
    </div>
    
    <!-- 显示评论目标信息（在个人中心页面） -->
    <div v-if="comment.cssnippet_title" class="comment-target-info">
      评论于：
      <a 
        :href="`#`" 
        @click.prevent="$emit('goto-detail', comment.cssnippet_id)"
      >
        {{ comment.cssnippet_title }}
      </a>
    </div>

    <!-- 回复表单 -->
    <div v-if="replyingTo === comment.id" class="reply-form">
      <textarea v-model="replyContent" placeholder="回复 @{{ comment.username }}..." rows="2"></textarea>
      <div class="reply-actions">
        <button class="btn btn-sm btn-primary" @click="handleSubmitReply">
          回复
        </button>
        <button class="btn btn-sm btn-outline" @click="cancelReply">
          取消
        </button>
      </div>
    </div>

    <!-- 子评论 -->
    <div class="child-comments" v-if="comment.children && comment.children.length > 0">
      <CommentItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :user-store="userStore"
        :replying-to="replyingTo"
        :initial-reply-content="''"
        @reply="handleReplyToChild"
        @submit-reply="handleSubmitReplyToChild"
        @cancel-reply="cancelReply"
        @delete="handleDeleteChild"
        @goto-detail="$emit('goto-detail', $event)"
        :class="'child'"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true
  },
  userStore: {
    type: Object,
    required: true
  },
  replyingTo: {
    type: [String, Number, null],
    default: null
  },
  initialReplyContent: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['reply', 'submit-reply', 'cancel-reply', 'delete', 'update:replyContent'])

// 本地回复内容
const replyContent = ref(props.initialReplyContent || '')

// 监听回复目标变化，清空回复内容
watch(() => props.replyingTo, (newVal) => {
  if (newVal !== props.comment.id) {
    replyContent.value = ''
  }
})

const isOwner = (comment) => {
  return props.userStore.isLoggedIn && comment.user_id === props.userStore.user.id
}

const getAvatar = (userId) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
}

const formatDate = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 30) return `${diffDays}天前`
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getUsernameById = (userId) => {
  // 这可能需要从父组件传递，或者从store中获取
  // 暂时返回一个占位符
  return '用户'
}

const handleReply = () => {
  emit('reply', props.comment)
}

const handleSubmitReply = () => {
  emit('submit-reply', props.comment.id, replyContent.value)
  replyContent.value = ''
}

const handleSubmitReplyToChild = (parentId, content) => {
  emit('submit-reply', parentId, content)
}

const handleReplyToChild = (childComment) => {
  emit('reply', childComment)
}

const cancelReply = () => {
  emit('cancel-reply')
}

const handleDelete = () => {
  emit('delete', props.comment.id)
}

const handleDeleteChild = (childId) => {
  emit('delete', childId)
}
</script>

<style scoped>
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
  margin-bottom: 15px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 15px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.comment-info {
  flex: 1;
}

.comment-author {
  font-weight: 500;
  color: #38bdf8;
  margin-right: 10px;
}

.comment-time {
  font-size: 14px;
  color: #64748b;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.comment-content {
  font-size: 16px;
  line-height: 1.6;
  color: #e2e8f0;
  margin-bottom: 15px;
  word-wrap: break-word;
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

.comment-content .link {
  color: #38bdf8;
  text-decoration: none;
  margin-right: 5px;
}

.comment-content .link:hover {
  text-decoration: underline;
  color: #7dd3fc;
}

.reply-form {
  margin-top: 15px;
  padding: 15px;
  background-color: rgba(26, 32, 44, 0.9);
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.reply-form textarea {
  width: 100%;
  min-height: 60px;
  padding: 10px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 10px;
  background-color: rgba(16, 23, 42, 0.9);
  color: #e2e8f0;
  font-family: inherit;
}

.reply-form textarea:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.reply-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.child-comments {
  margin-top: 15px;
}

@media (max-width: 768px) {
  .comment-item.child {
    margin-left: 20px;
  }
  
  .comment-header {
    flex-wrap: wrap;
  }
  
  .comment-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 10px;
  }
}
.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid rgba(56, 189, 248, 0.3);
  background-color: transparent;
  color: #38bdf8;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 4px;
}

.btn-sm:hover {
  background-color: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.6);
  color: #7dd3fc;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
}

.text-danger {
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.text-danger:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.6);
  color: #f87171;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.2);
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
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

.btn-outline {
  background-color: transparent;
  color: #64748b;
  border-color: rgba(100, 116, 139, 0.3);
}

.btn-outline:hover {
  background-color: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.6);
  color: #94a3b8;
}
</style>
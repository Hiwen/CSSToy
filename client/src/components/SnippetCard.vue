<template>
  <div class="cssnippet-card card" @click.self="handleClick">
    <CssPreview :cssnippet="cssnippet" class="cssnippet-preview" />
    <h3 class="cssnippet-title">{{ cssnippet.title }}</h3>
    <p v-if="cssnippet.description" class="cssnippet-description">{{ truncateDescription }}</p>
    
    <div v-if="showTags && cssnippet.tags" class="cssnippet-tags">
      <router-link 
        v-for="tag in cssnippet.tags.slice(0, maxTags)" 
        :key="tag.id" 
        :to="{ name: 'Tag', params: { name: tag.name } }"
        class="tag"
      >
        {{ tag.name }}
      </router-link>
      <span v-if="cssnippet.tags.length > maxTags" class="tag-more">+{{ cssnippet.tags.length - maxTags }}</span>
    </div>
    
    <div class="cssnippet-info">
      <div v-if="showAuthor" class="author-info">
        <img :src="avatarSrc" :alt="cssnippet.username || '用户'" class="avatar small">
        <span>{{ cssnippet.username || '未知用户' }}</span>
      </div>
      
      <div class="cssnippet-meta">
        <button class="meta-item btn-icon" @click.stop="onLike" :class="{ 'active': isLiked }">
          <span class="icon">{{ isLiked ? '❤️' : '🤍' }}</span>
          <span>{{ likesCount }}</span>
        </button>
        <button class="meta-item btn-icon" @click.stop="onFavorite" :class="{ 'active': isFavorited }">
          <span class="icon">{{ isFavorited ? '⭐' : '☆' }}</span>
          <span>{{ favoritesCount }}</span>
        </button>
        <span class="meta-item">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 4h14v9H1V4zm12 1H3v7h10V5z"/>
            <circle cx="5" cy="3" r="1"/>
            <circle cx="11" cy="3" r="1"/>
          </svg>
          {{ commentsCount || 0 }}
        </span>
      </div>
    </div>
    
    <!-- 作者操作按钮 - 仅在个人中心显示 -->
    <div v-if="isOwner" class="snippet-actions">
      <button class="btn btn-sm btn-primary" @click.stop="editSnippet">
        编辑
      </button>
      
      <button class="btn btn-sm btn-danger" @click.stop="confirmDelete">
        删除
      </button>
      
      <button 
        class="btn btn-sm" 
        :class="cssnippet.is_public ? 'btn-success' : 'btn-secondary'"
        @click.stop="toggleVisibility"
      >
        {{ cssnippet.is_public ? '私密' : '公开' }}
      </button>
    </div>
    
    <!-- 非作者查看按钮 -->
    <div v-else class="snippet-actions">
      <button class="btn btn-primary full-width" @click.stop="handleViewClick">
        查看详情
      </button>
    </div>
  </div>
  
  <!-- 删除确认弹窗 -->
  <DeleteConfirm
    :visible="showDeleteConfirm"
    title="确认删除代码段"
    :message="`您确定要删除代码段「${props.cssnippet.title}」吗？此操作无法撤销。`"
    :loading="deleteLoading"
    @confirm="handleConfirmDelete"
    @cancel="handleCancelDelete"
    @overlay-click="handleCancelDelete"
  />
</template>

<script setup>
import { computed, ref, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useCSSnippetStore } from '../stores/cssnippet'
import CssPreview from './CssPreview.vue'
import DeleteConfirm from './DeleteConfirm.vue'

const router = useRouter()
const cssnippetStore = useCSSnippetStore()
const { proxy } = getCurrentInstance()
const $notification = proxy?.$notification

// 删除确认相关状态
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)

// 定义组件属性
const props = defineProps({
  cssnippet: {
    type: Object,
    required: true
  },
  isOwner: {
    type: Boolean,
    default: false
  },
  showAuthor: {
    type: Boolean,
    default: true
  },
  showTags: {
    type: Boolean,
    default: true
  },
  maxTags: {
    type: Number,
    default: 3
  },
  maxDescriptionLength: {
    type: Number,
    default: 100
  }
})

// 定义事件
const emit = defineEmits(['click', 'view', 'refresh', 'favorite', 'like'])

const onFavorite = (event) => {
  emit('favorite', event)
}

const onLike = (event) => {
  emit('like', event)
}

// 计算属性
const truncateDescription = computed(() => {
  if (!props.cssnippet.description) return ''
  
  const desc = props.cssnippet.description.trim()
  if (desc.length <= props.maxDescriptionLength) return desc
  
  return desc.substring(0, props.maxDescriptionLength) + '...'
})

// 生成头像URL的函数
const getAvatar = (userId) => {
  if (!userId) return '/default-avatar.png'
  // 使用DiceBear API基于用户ID生成头像
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
}

const avatarSrc = computed(() => {
  // 优先使用用户ID生成头像，回退到原有的avatar字段或默认头像
  return getAvatar(props.cssnippet.user_id || props.cssnippet.userId) || props.cssnippet.avatar || '/default-avatar.png'
})

const likesCount = computed(() => {
  return props.cssnippet.likes_count || props.cssnippet.like_count || 0
})

const favoritesCount = computed(() => {
  return props.cssnippet.favorite_count || props.cssnippet.collections_count || 0
})

const commentsCount = computed(() => {
  return props.cssnippet.comments_count || 0
})

const isLiked = computed(() => {
  return props.cssnippet.isLiked || false
})

const isFavorited = computed(() => {
  return props.cssnippet.isCollected || false
})

const detailRoute = computed(() => {
  return { name: 'CSSnippetDetail', params: { id: props.cssnippet.id } }
})

// 方法
const handleClick = () => {
  if (!props.isOwner) {
    emit('click')
    router.push(detailRoute.value)
  }
}

const handleViewClick = () => {
  emit('click')
  router.push(detailRoute.value)
}

// 组件内部实现的操作函数
const editSnippet = () => {
  router.push(`/cssnippet/${props.cssnippet.id}/edit`)
}

const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
  deleteLoading.value = true
  try {
    await cssnippetStore.deleteCssnippet(props.cssnippet.id)
    // 通知父组件刷新列表
    emit('refresh')
    showDeleteConfirm.value = false
  } catch (err) {
    console.error('Failed to delete snippet:', err)
    alert('删除失败: ' + (err.message || '未知错误'))
    showDeleteConfirm.value = false
  } finally {
    deleteLoading.value = false
  }
}

const handleCancelDelete = () => {
  showDeleteConfirm.value = false
}

const toggleVisibility = async () => {
  try {
    await cssnippetStore.toggleVisibility(props.cssnippet.id)
    // Store中已更新状态，无需在这里重复更新
  } catch (err) {
    console.error('Failed to toggle visibility:', err)
    // 使用Notification组件替代alert，按照服务方法期望的参数格式调用
    $notification.error(
      '切换可见性失败: ' + (err.message || '未知错误'),
      '操作失败'
    )
  }
}
</script>

<style scoped>
.cssnippet-card {
  width: 100%;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cssnippet-preview {
  width: 100%;
  height: 150px;
  background-color: #f9f9f9;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.cssnippet-title {
  font-size: 18px;
  color: #333;
}

.cssnippet-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4; /* 稍微减小行高 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cssnippet-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px; 
}

.tag {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  text-decoration: none;
}

.tag-more {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.cssnippet-info {
  padding: 0px; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar.small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.cssnippet-meta {
  display: flex;
  gap: 15px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.meta-item:hover {
  background-color: #f0f0f0;
}

.meta-item.active {
  color: #3498db;
}

.snippet-actions {
  padding: 1px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.snippet-actions .btn {
  flex: 1;
  max-width: 120px;
  padding: 6px 10px;
  text-align: center;
}

.btn {
  /* 基础样式 */
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
  
  /* 统一尺寸和布局 */
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* 重置a标签特有样式 */
  text-decoration: none;
  color: inherit;
  font-family: inherit;
  font-weight: inherit;
  line-height: 1;
  white-space: nowrap;
  
  /* 确保一致的盒模型 */
  box-sizing: border-box;
}

.btn-sm {
  /* 基础样式 */
  padding: 6px 10px;
  font-size: 12px;
  
  /* 统一尺寸和布局 - 与普通按钮保持相同高度 */
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* 重置a标签特有样式 */
  text-decoration: none;
  color: inherit;
  font-family: inherit;
  font-weight: inherit;
  line-height: 1;
  white-space: nowrap;
  
  /* 确保一致的盒模型 */
  box-sizing: border-box;
}

.btn-primary {
  background-color: #38bdf8;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #0ea5e9;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.btn-outline:hover {
  background-color: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.6);
  color: #7dd3fc;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
}

.btn-danger {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.6);
  color: #f87171;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.2);
}

.btn-secondary {
  background-color: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.btn-secondary:hover {
  background-color: rgba(148, 163, 184, 0.2);
  border-color: rgba(148, 163, 184, 0.5);
  color: #cbd5e1;
}

.btn-success {
  background-color: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.btn-success:hover {
  background-color: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.5);
  color: #86efac;
}

.full-width {
  width: 100%;
}
</style>
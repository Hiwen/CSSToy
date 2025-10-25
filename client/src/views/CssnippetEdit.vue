<template>
  <div class="cssnippet-edit-container">
    <div class="edit-form card">
      <h2>{{ isEditMode ? '编辑 CSS 代码段' : '创建 CSS 代码段' }}</h2>
      
      <div v-if="error" class="form-error">{{ error }}</div>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="title">标题</label>
          <input 
            type="text" 
            id="title" 
            class="form-input" 
            v-model="form.title"
            placeholder="请输入代码段标题"
            required
          >
          <div v-if="errors.title" class="form-error">{{ errors.title }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="description">描述</label>
          <textarea 
            id="description" 
            class="form-input" 
            v-model="form.description"
            placeholder="请描述这个 CSS 代码段的功能和用途"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="cssCode">CSS 代码</label>
          <textarea 
            id="cssCode" 
            class="form-input code-editor" 
            v-model="form.cssCode"
            placeholder="请输入 CSS 代码"
            rows="10"
            required
            @input="updatePreview"
          ></textarea>
          <div v-if="errors.cssCode" class="form-error">{{ errors.cssCode }}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="htmlCode">HTML 代码</label>
          <textarea 
            id="htmlCode" 
            class="form-input code-editor" 
            v-model="form.htmlCode"
            placeholder="请输入 HTML 代码"
            rows="8"
            @input="updatePreview"
          ></textarea>
          <div class="template-buttons">
            <button type="button" class="btn btn-sm btn-outline" @click="insertHtmlTemplate('button')">按钮</button>
            <button type="button" class="btn btn-sm btn-outline" @click="insertHtmlTemplate('card')">卡片</button>
            <button type="button" class="btn btn-sm btn-outline" @click="insertHtmlTemplate('link')">链接</button>
            <button type="button" class="btn btn-sm btn-outline" @click="insertHtmlTemplate('input')">输入框</button>
            <button type="button" class="btn btn-sm btn-outline" @click="insertHtmlTemplate('text')">默认文本</button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="tags">标签</label>
          <input 
            type="text" 
            id="tags" 
            class="form-input" 
            v-model="tagInput"
            placeholder="输入标签，用逗号分隔（最多5个标签）"
            @keydown.enter.prevent="addTag"
          >
          
          <div class="tags-container">
            <span 
              v-for="tag in form.tags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
              <button type="button" class="tag-remove" @click="removeTag(tag)">×</button>
            </span>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label checkbox">
            <input type="checkbox" v-model="form.isPublic">
            <span>公开这个代码段（勾选后其他用户可以看到并搜索到）</span>
          </label>
        </div>
        
        <!-- 预览区域 -->
        <div class="preview-section">
          <h3>实时预览</h3>
          <div class="preview-box">
            <div 
              id="preview-element" 
              class="preview-element" 
              :style="previewStyles"
              ref="previewRef"
            >CSS 预览效果</div>
          </div>
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="loading"
          >
            {{ loading ? '保存中...' : '保存代码段' }}
          </button>
          
          <router-link to="/" class="btn btn-outline">
            取消
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCssnippetStore } from '../stores/cssnippet'
import { useUserStore } from '../stores/user'

export default {
  name: 'CssnippetEdit',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const cssnippetStore = useCssnippetStore()
    const userStore = useUserStore()
    
    const form = reactive({
      title: '',
      description: '',
      cssCode: '',
      htmlCode: '',
      tags: [],
      isPublic: true
    })
    
    const tagInput = ref('')
    const errors = reactive({})
    const loading = ref(false)
    const error = ref('')
    const previewStyles = ref({})
    const previewRef = ref(null)
    
    // 监听CSS代码变化，确保预览同步更新
    watch(() => form.cssCode, () => {
      updatePreview()
    })
    
    const isEditMode = computed(() => {
      return !!route.params.id
    })
    
    const validateForm = () => {
      let isValid = true
      errors.title = ''
      errors.cssCode = ''
      
      // 验证标题
      if (!form.title.trim()) {
        errors.title = '标题不能为空'
        isValid = false
      } else if (form.title.length > 100) {
        errors.title = '标题长度不能超过100个字符'
        isValid = false
      }
      
      // 验证CSS代码
      if (!form.cssCode.trim()) {
        errors.cssCode = 'CSS代码不能为空'
        isValid = false
      } else if (form.cssCode.length > 10000) {
        errors.cssCode = 'CSS代码长度不能超过10000个字符'
        isValid = false
      }
      
      // 验证标签数量
      if (form.tags.length > 5) {
        error.value = '标签数量不能超过5个'
        isValid = false
      }
      
      return isValid
    }
    
    const loadExistingCssnippet = async () => {
      const id = route.params.id
      if (!id) return
      
      try {
        loading.value = true
        const snippet = await cssnippetStore.fetchById(id)
        
        // 检查权限
        if (snippet.user_id !== userStore.user.id) {
          error.value = '您没有权限编辑这个代码段'
          return
        }
        
        // 填充表单
        form.title = snippet.title
        form.description = snippet.description
        form.cssCode = snippet.css_content
        form.htmlCode = snippet.html_content || ''
        form.tags = snippet.tags.map(tag => tag.name)
        form.isPublic = snippet.is_public
        
        // 更新预览
        updatePreview()
      } catch (err) {
        console.error('Failed to load cssnippet:', err)
        error.value = '加载代码段失败'
      } finally {
        loading.value = false
      }
    }
    
    const handleSubmit = async () => {
      // 清空之前的错误信息
      error.value = ''
      
      // 验证表单
      if (!validateForm()) {
        return
      }
      
      try {
        loading.value = true
        
        const payload = {
          title: form.title.trim(),
          description: form.description.trim(),
          cssContent: form.cssCode.trim(),
          htmlContent: form.htmlCode.trim(),
          tags: form.tags,
          isPublic: form.isPublic
        }
        
        if (isEditMode.value) {
          await cssnippetStore.update(route.params.id, payload)
          alert('保存成功！')
        } else {
          await cssnippetStore.create(payload)
          alert('创建成功！')
        }
        
        // 保存成功后跳转到主页
        router.push('/')
      } catch (err) {
        console.error('Failed to save cssnippet:', err)
        const errorMessage = cssnippetStore.error || '保存失败，请稍后重试'
        error.value = errorMessage
        alert(errorMessage)
      } finally {
        loading.value = false
      }
    }
    
    const addTag = () => {
      const tag = tagInput.value.trim()
      
      if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
        form.tags.push(tag)
        tagInput.value = ''
      }
    }
    
    const removeTag = (tag) => {
      const index = form.tags.indexOf(tag)
      if (index > -1) {
        form.tags.splice(index, 1)
      }
    }
    
    const updatePreview = () => {
      try {
        // 清除之前的错误样式
        previewStyles.value = {}
        
        // 直接通过DOM引用设置样式，这是最可靠的方法
        if (previewRef.value) {
          // 更新HTML内容
          if (form.htmlCode.trim()) {
            previewRef.value.innerHTML = form.htmlCode.trim()
          } else {
            previewRef.value.innerHTML = 'CSS 预览效果'
          }
          
          // 使用try-catch确保即使CSS语法错误也不会阻塞功能
          try {
            previewRef.value.style.cssText = form.cssCode
          } catch (cssError) {
            console.warn('CSS语法错误:', cssError)
            // 如果CSS语法错误，设置错误提示样式
            previewRef.value.style.cssText = 'background-color: #ffebee; color: #c62828; padding: 16px; border-radius: 4px;'
            previewRef.value.innerHTML = 'CSS语法错误'
          }
        }
      } catch (err) {
        console.error('预览更新失败:', err)
        // 作为最后的保障，使用响应式对象设置错误样式
        previewStyles.value = {
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '16px',
          borderRadius: '4px'
        }
      }
    }
    
    const insertHtmlTemplate = (type) => {
      const templates = {
        'button': '<button>按钮</button>',
        'card': '<div class="card">卡片内容</div>',
        'link': '<a href="#">链接</a>',
        'input': '<input type="text" placeholder="输入框">',
        'text': '<div>默认文本</div>'
      }
      form.htmlCode = templates[type] || ''
      updatePreview()
    }
    
    // 检查用户登录状态
    const checkLoginStatus = () => {
      if (!userStore.user) {
        error.value = '请先登录'
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      }
    }
    
    // 组件挂载时
    onMounted(() => {
      checkLoginStatus()
      if (isEditMode.value && userStore.user) {
        loadExistingCssnippet()
      } else {
        // 为新创建的代码段设置默认预览样式
        form.cssCode = `/* 请输入您的CSS代码 */\nbackground-color: #3498db;\ncolor: white;\npadding: 20px;\nborder-radius: 8px;\ntext-align: center;\nfont-size: 18px;`
        updatePreview()
      }
    })
    
    // 监听标签输入，支持逗号分隔
    watch(tagInput, (newValue) => {
      if (newValue.includes(',')) {
        const tags = newValue.split(',')
        const lastTag = tags.pop().trim()
        
        tags.forEach(tag => {
          const trimmedTag = tag.trim()
          if (trimmedTag && !form.tags.includes(trimmedTag) && form.tags.length < 5) {
            form.tags.push(trimmedTag)
          }
        })
        
        tagInput.value = lastTag
      }
    })
    
    return {
      form,
      tagInput,
      errors,
      loading,
      error,
      isEditMode,
      previewStyles,
      previewRef,
      handleSubmit,
      addTag,
      removeTag,
      updatePreview,
      insertHtmlTemplate
    }
  }
}
</script>

<style scoped>
.cssnippet-edit-container {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.edit-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.code-editor {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.template-buttons {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-buttons .btn {
  font-size: 12px;
  padding: 4px 12px;
}

.tags-container {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 14px;
}

.tag-remove {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 18px;
  cursor: pointer;
  margin-left: 5px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.tag-remove:hover {
  background-color: #1976d2;
  color: white;
}

.preview-section {
  margin: 30px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.preview-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.preview-box {
  background-color: #fafafa;
  padding: 40px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.preview-element {
  background-color: white;
  min-width: 150px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-word;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox input {
  width: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
  
  .preview-box {
    padding: 20px;
  }
}
</style>
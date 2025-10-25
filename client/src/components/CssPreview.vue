<template>
  <div class="css-preview-wrapper">
    <div v-html="previewHTML" class="preview-container"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 定义组件属性
const props = defineProps({
  cssnippet: {
    type: Object,
    required: true
  }
})

// 计算预览HTML内容
const previewHTML = computed(() => {
  const cssnippet = props.cssnippet
  // 获取CSS代码段的内容
  const css = cssnippet.css_content || cssnippet.css_code || ''
  const html = cssnippet.html_content
  
  // 创建唯一ID用于样式隔离
  const previewId = `preview-${cssnippet.id || Math.random().toString(36).substr(2, 9)}`
  
  // 转换CSS为可直接应用的格式
  let processedCss = css
  if (css) {
    // 移除可能存在的选择器和大括号，只保留样式声明
    processedCss = css.replace(/[^\{]+\{([^}]*)\}/g, '$1').trim()
    // 移除注释
    processedCss = processedCss.replace(/\/\*[^*]*\*\//g, '')
    // 清理多余的空白和分号
    processedCss = processedCss.replace(/;\s*;/g, ';').replace(/\s+/g, ' ').trim()
  }
  
  // 如果有html_content，直接使用它
  if (html && html.trim()) {
    return `
      <div class="preview-wrapper">
        <div id="${previewId}">
          ${html}
        </div>
        <style>
          #${previewId} {
            ${processedCss}
          }
          #${previewId} * {
            ${processedCss}
          }
        </style>
      </div>
    `
  } else {
    // 如果没有html_content，使用默认预览元素
    return `
      <div class="preview-wrapper">
        <div class="preview-element" style="${processedCss}">
          示例元素
        </div>
      </div>
    `
  }
})
</script>

<style scoped>
.css-preview-wrapper {
  width: 100%;
  height: 150px;
  overflow: hidden;
  background-color: #f9f9f9;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.preview-container {
  width: 100%;
  height: 100%;
}

.preview-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

/* 确保预览元素能够正常显示样式 */
.preview-element {
  min-width: 50px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #333;
}

/* 确保自定义HTML内容也居中显示 */
.preview-wrapper > div {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* 防止样式影响父元素 */
.preview-wrapper :deep(style) {
  display: block;
}
</style>
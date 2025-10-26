<template>
  <div class="pagination">
    <!-- 上一页按钮 -->
    <button 
      class="pagination-button" 
      :disabled="currentPage === 1"
      @click="emit('pageChange', currentPage - 1)"
    >
      上一页
    </button>
    
    <!-- 页码信息 -->
    <span class="pagination-info" v-if="showInfo">
      第 {{ currentPage }} 页，共 {{ totalPages }} 页
    </span>
    
    <!-- 页码按钮 (可选) -->
    <template v-if="showPageNumbers && totalPages > 1">
      <button 
        v-for="page in displayedPages" 
        :key="page"
        class="pagination-button"
        :class="{ active: currentPage === page }"
        @click="emit('pageChange', page)"
      >
        {{ page }}
      </button>
    </template>
    
    <!-- 下一页按钮 -->
    <button 
      class="pagination-button" 
      :disabled="currentPage >= totalPages"
      @click="emit('pageChange', currentPage + 1)"
    >
      下一页
    </button>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true,
      validator: (value) => value > 0
    },
    showInfo: {
      type: Boolean,
      default: true
    },
    showPageNumbers: {
      type: Boolean,
      default: false
    },
    maxVisiblePages: {
      type: Number,
      default: 5
    }
  },
  emits: ['pageChange'],
  // 确保组件名称正确，方便调试和检查
  setup(props, { emit }) {
    return {}
  },
  computed: {
    displayedPages() {
      if (!this.showPageNumbers || this.totalPages <= 1) return []
      
      const maxVisible = this.maxVisiblePages
      const halfMax = Math.floor(maxVisible / 2)
      const pages = []
      
      // 计算显示的页码范围
      let startPage = Math.max(1, this.currentPage - halfMax)
      let endPage = Math.min(this.totalPages, startPage + maxVisible - 1)
      
      // 调整起始页以确保显示足够的页码
      if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1)
      }
      
      // 生成页码数组
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      return pages
    }
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
  padding: 20px 0;
}

.pagination-button {
  padding: 8px 16px;
  background-color: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  color: #38bdf8;
}

.pagination-button:hover:not(:disabled) {
  background-color: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
  border-color: #38bdf8;
}

.pagination-button.active {
  background-color: rgba(56, 189, 248, 0.3);
  color: white;
  border-color: #38bdf8;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: rgba(56, 189, 248, 0.05);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.pagination-info {
  font-size: 14px;
  color: #38bdf8;
  min-width: 120px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
    padding: 15px 0;
  }
  
  .pagination-button {
    flex: 1;
    min-width: 80px;
  }
  
  .pagination-info {
    order: 2;
    width: 100%;
  }
}
</style>
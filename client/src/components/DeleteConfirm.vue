<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content card" @click.stop>
      <h3>{{ title || '确认删除' }}</h3>
      <p>{{ message || '您确定要删除此项吗？此操作无法撤销。' }}</p>
      
      <div class="modal-actions">
        <button 
          class="btn btn-outline" 
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText || '取消' }}
        </button>
        <button 
          class="btn btn-danger" 
          @click="handleDelete"
          :disabled="loading"
        >
          {{ loading ? '删除中...' : (deleteText || '删除') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeleteConfirm',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '确认删除'
    },
    message: {
      type: String,
      default: '您确定要删除此项吗？此操作无法撤销。'
    },
    deleteText: {
      type: String,
      default: '删除'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['confirm', 'cancel', 'overlay-click'],
  methods: {
    handleDelete() {
      this.$emit('confirm');
    },
    handleCancel() {
      this.$emit('cancel');
    },
    handleOverlayClick() {
      this.$emit('overlay-click');
    }
  }
};
</script>

<script setup>
// 此组件同时支持Options API和Composition API，以便兼容不同的使用场景
</script>

<style scoped>
/* 弹窗样式与项目中其他弹窗保持一致 */
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
  margin-bottom: 15px;
  color: #333;
}

.modal-content p {
  margin-bottom: 25px;
  color: #666;
  font-size: 16px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
  border: 2px solid #e74c3c;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
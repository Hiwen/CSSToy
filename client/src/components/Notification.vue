<template>
  <div v-if="visible" class="notification-overlay" @click="handleOverlayClick">
    <div class="notification-content card" :class="notificationType" @click.stop>
      <div class="notification-icon">
        <svg v-if="notificationType === 'success'" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <svg v-else-if="notificationType === 'error'" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        <svg v-else-if="notificationType === 'warning'" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </div>
      <div class="notification-body">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
      </div>
      <button v-if="!autoClose" class="notification-close" @click="handleClose">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <div v-if="autoClose" class="notification-progress" ref="progressBar"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 3000
  }
});

// 定义事件
const emit = defineEmits(['close', 'overlay-click']);

// 响应式数据
const timer = ref(null);
const progressBar = ref(null);

// 计算属性
const notificationType = computed(() => props.type);

// 方法
const handleClose = () => {
  clearAutoClose();
  emit('close');
};

const handleOverlayClick = () => {
  if (props.autoClose) return;
  emit('overlay-click');
};

const startAutoClose = () => {
  clearAutoClose();
  
  // 开始进度条动画
  nextTick(() => {
    if (progressBar.value) {
      progressBar.value.style.transition = `width ${props.duration}ms linear`;
      progressBar.value.style.width = '0%';
    }
  });
  
  // 设置自动关闭定时器
  timer.value = setTimeout(() => {
    emit('close');
  }, props.duration);
};

const clearAutoClose = () => {
  if (timer.value) {
    clearTimeout(timer.value);
    timer.value = null;
  }
};

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.autoClose) {
      startAutoClose();
    } else if (!newVal) {
      clearAutoClose();
    }
  }
);

// 组件卸载前清理
onUnmounted(() => {
  clearAutoClose();
});
</script>

<style scoped>
.notification-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.notification-content {
  width: 360px;
  min-height: 100px;
  padding: 25px;
  position: relative;
  display: flex;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  box-sizing: border-box;
}

.notification-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-body {
  flex: 1;
}

.notification-body h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.notification-body p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.notification-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
}

.notification-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  border-radius: 0 0 4px 4px;
  /* 确保初始宽度为100% */
  width: 100%;
}

/* 类型样式 */
.notification-content.success .notification-icon {
  background-color: #e8f5e9;
  color: #4caf50;
}

.notification-content.success h3 {
  color: #2e7d32;
}

.notification-content.success .notification-progress {
  background-color: #4caf50;
}

.notification-content.error .notification-icon {
  background-color: #ffebee;
  color: #f44336;
}

.notification-content.error h3 {
  color: #c62828;
}

.notification-content.error .notification-progress {
  background-color: #f44336;
}

.notification-content.warning .notification-icon {
  background-color: #fff3e0;
  color: #ff9800;
}

.notification-content.warning h3 {
  color: #e65100;
}

.notification-content.warning .notification-progress {
  background-color: #ff9800;
}

.notification-content.info .notification-icon {
  background-color: #e3f2fd;
  color: #2196f3;
}

.notification-content.info h3 {
  color: #1565c0;
}

.notification-content.info .notification-progress {
  background-color: #2196f3;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
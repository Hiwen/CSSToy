import { reactive, ref } from 'vue';

// 创建一个通知管理服务
class NotificationService {
  constructor() {
    // 使用Vue 3的响应式API
    this.notifications = reactive([]);
    this.currentNotification = ref(null);
    this.idCounter = 0;
  }

  // 生成唯一ID
  _generateId() {
    return ++this.idCounter;
  }

  // 创建通知
  _createNotification(options) {
    const id = this._generateId();
    const notification = reactive({
      id,
      visible: true,
      title: '',
      message: '',
      type: 'success',
      autoClose: true,
      duration: 3000,
      ...options
    });

    // 添加到通知列表
    this.notifications.push(notification);
    // 立即设置为当前通知
    this.currentNotification.value = notification;

    // 自动关闭处理
    if (notification.autoClose) {
      setTimeout(() => {
        this.hide(id);
      }, notification.duration);
    }

    return id;
  }

  // 显示通知
  show(options) {
    return this._createNotification(options);
  }

  // 显示成功通知
  success(message, title = '成功') {
    return this.show({
      title,
      message,
      type: 'success'
    });
  }

  // 显示错误通知
  error(message, title = '错误') {
    return this.show({
      title,
      message,
      type: 'error',
      autoClose: false // 错误通知默认不自动关闭
    });
  }

  // 显示警告通知
  warning(message, title = '警告') {
    return this.show({
      title,
      message,
      type: 'warning'
    });
  }

  // 显示信息通知
  info(message, title = '信息') {
    return this.show({
      title,
      message,
      type: 'info'
    });
  }

  // 隐藏通知
  hide(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.visible = false;
      // 延迟移除，等待动画完成
      setTimeout(() => {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index > -1) {
          this.notifications.splice(index, 1);
        }
        if (this.currentNotification.value && this.currentNotification.value.id === id) {
          this.currentNotification.value = this.notifications.length > 0 ? this.notifications[0] : null;
        }
      }, 300);
    }
  }

  // 隐藏所有通知
  hideAll() {
    this.notifications.forEach(notification => {
      this.hide(notification.id);
    });
  }

  // 获取当前通知（用于模板中使用）
  getCurrentNotification() {
    return this.currentNotification.value;
  }

  // 获取所有通知
  getAllNotifications() {
    return this.notifications;
  }
}

// 创建单例实例
const notificationService = new NotificationService();

// 导出Vue 3插件
export const NotificationPlugin = {
  install(app) {
    // 提供全局属性
    app.config.globalProperties.$notification = notificationService;
    // 提供依赖注入
    app.provide('notification', notificationService);
  }
};

// 添加调试方法，方便在控制台测试通知功能
notificationService.debug = function() {
  console.log('通知服务调试信息:');
  console.log('- 当前通知:', this.currentNotification.value);
  console.log('- 通知列表长度:', this.notifications.length);
  console.log('- 通知列表:', this.notifications);
  
  // 显示一个测试通知
  this.success('这是测试通知', '调试模式');
  
  // 1秒后再次检查通知状态
  setTimeout(() => {
    console.log('1秒后通知状态:');
    console.log('- 当前通知:', this.currentNotification.value);
    console.log('- 通知列表长度:', this.notifications.length);
  }, 1000);
};

export default notificationService;
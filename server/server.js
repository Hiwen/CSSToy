const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initDatabase } = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 根路径处理
app.get('/', (req, res) => {
  res.json({ message: 'CSSToy API Server' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库并启动服务器
initDatabase().then(() => {
  // 数据库初始化后再导入和使用路由
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/user');
  const cssnippetRoutes = require('./routes/cssnippet');
  const commentRoutes = require('./routes/comment');
  const tagRoutes = require('./routes/tag');
  
  // 使用路由
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/cssnippets', cssnippetRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/tags', tagRoutes);
  
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('启动服务器失败:', err);
  process.exit(1);
});
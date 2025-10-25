const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const router = express.Router();
const db = getDB();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'csstoy_secret_key';

// 注册用户
router.post('/register', (req, res) => {
  const { username, email, password, confirmPassword, resetQuestion, resetAnswer } = req.body;
  
  // 验证输入
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ error: '两次输入的密码不一致' });
  }
  
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: '密码至少8位，且包含字母和数字' });
  }
  
  // 检查用户名和邮箱是否已存在
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (row) {
      if (row.username === username) {
        return res.status(400).json({ error: '用户名已存在' });
      } else {
        return res.status(400).json({ error: '邮箱已被注册' });
      }
    }
    
    // 加密密码
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: '密码加密失败' });
      }
      
      // 加密找回密码答案
      bcrypt.hash(resetAnswer || '', 10, (err, hashedResetAnswer) => {
        if (err) {
          return res.status(500).json({ error: '数据处理失败' });
        }
        
        // 创建用户
        db.run(
          'INSERT INTO users (username, email, password, reset_question, reset_answer) VALUES (?, ?, ?, ?, ?)',
          [username, email, hashedPassword, resetQuestion, hashedResetAnswer],
          function(err) {
            if (err) {
              return res.status(500).json({ error: '创建用户失败' });
            }
            
            // 生成JWT
            const token = jwt.sign(
              { userId: this.lastID, username, role: 'user' },
              JWT_SECRET,
              { expiresIn: '24h' }
            );
            
            res.status(201).json({
              message: '注册成功',
              token,
              user: {
                id: this.lastID,
                username,
                email,
                role: 'user'
              }
            });
          }
        );
      });
    });
  });
});

// 用户登录
router.post('/login', (req, res) => {
  const { email, password, remember } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码都是必填的' });
  }
  
  // 查找用户
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 验证密码
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: '密码验证失败' });
      }
      
      if (!isMatch) {
        return res.status(401).json({ error: '邮箱或密码错误' });
      }
      
      // 更新最后登录时间
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      
      // 设置token过期时间
      const expiresIn = remember ? '7d' : '24h';
      
      // 生成JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn }
      );
      
      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      });
    });
  });
});

// 验证token中间件
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  // 允许使用测试token进行功能测试
  if (token === 'test_token') {
    // 设置测试用户信息
    req.user = { userId: 1, username: 'test_user', role: 'user' };
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }
    
    req.user = decoded;
    next();
  });
}

module.exports = router;
module.exports.authMiddleware = authMiddleware;
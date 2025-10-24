const express = require('express');
const bcrypt = require('bcrypt');
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');
const router = express.Router();
const db = getDB();

// 获取用户信息
router.get('/profile', authMiddleware, (req, res) => {
  db.get('SELECT id, username, email, avatar, created_at, last_login, role FROM users WHERE id = ?', 
    [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  });
});

// 更新用户信息
router.put('/profile', authMiddleware, (req, res) => {
  const { username, avatar } = req.body;
  
  // 检查用户名是否被占用
  if (username) {
    db.get('SELECT * FROM users WHERE username = ? AND id != ?', 
      [username, req.user.userId], (err, row) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      if (row) {
        return res.status(400).json({ error: '用户名已被占用' });
      }
      
      // 更新用户信息
      updateUserInfo();
    });
  } else {
    updateUserInfo();
  }
  
  function updateUserInfo() {
    const fields = [];
    const values = [];
    
    if (username) {
      fields.push('username = ?');
      values.push(username);
    }
    if (avatar) {
      fields.push('avatar = ?');
      values.push(avatar);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: '没有提供要更新的信息' });
    }
    
    values.push(req.user.userId);
    
    db.run(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          return res.status(500).json({ error: '更新用户信息失败' });
        }
        
        // 返回更新后的用户信息
        db.get('SELECT id, username, email, avatar, created_at, last_login, role FROM users WHERE id = ?', 
          [req.user.userId], (err, user) => {
          if (err) {
            return res.status(500).json({ error: '数据库错误' });
          }
          res.json(user);
        });
      }
    );
  }
});

// 修改密码
router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  
  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: '所有字段都是必填的' });
  }
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: '两次输入的新密码不一致' });
  }
  
  if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: '新密码至少8位，且包含字母和数字' });
  }
  
  // 获取当前用户信息
  db.get('SELECT password FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    // 验证旧密码
    bcrypt.compare(oldPassword, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: '密码验证失败' });
      }
      
      if (!isMatch) {
        return res.status(401).json({ error: '原密码错误' });
      }
      
      // 加密新密码
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: '密码加密失败' });
        }
        
        // 更新密码
        db.run('UPDATE users SET password = ? WHERE id = ?', 
          [hashedPassword, req.user.userId], (err) => {
          if (err) {
            return res.status(500).json({ error: '密码更新失败' });
          }
          res.json({ message: '密码修改成功' });
        });
      });
    });
  });
});

// 获取用户上传的CSS代码段
router.get('/my-cssnippets', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT c.*, u.username, u.avatar 
     FROM cssnippets c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.user_id = ? 
     ORDER BY c.created_at DESC 
     LIMIT ? OFFSET ?`,
    [req.user.userId, limit, offset],
    (err, cssnippets) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 获取总数
      db.get('SELECT COUNT(*) as total FROM cssnippets WHERE user_id = ?', 
        [req.user.userId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        res.json({
          cssnippets,
          pagination: {
            total: result.total,
            page,
            limit,
            pages: Math.ceil(result.total / limit)
          }
        });
      });
    }
  );
});

// 获取用户点赞的CSS代码段
router.get('/liked-cssnippets', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT c.*, u.username, u.avatar 
     FROM cssnippets c 
     JOIN users u ON c.user_id = u.id 
     JOIN likes l ON c.id = l.cssnippet_id 
     WHERE l.user_id = ? 
     ORDER BY l.created_at DESC 
     LIMIT ? OFFSET ?`,
    [req.user.userId, limit, offset],
    (err, cssnippets) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 获取总数
      db.get('SELECT COUNT(*) as total FROM likes WHERE user_id = ?', 
        [req.user.userId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        res.json({
          cssnippets,
          pagination: {
            total: result.total,
            page,
            limit,
            pages: Math.ceil(result.total / limit)
          }
        });
      });
    }
  );
});

// 获取用户收藏的CSS代码段
router.get('/collected-cssnippets', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT c.*, u.username, u.avatar 
     FROM cssnippets c 
     JOIN users u ON c.user_id = u.id 
     JOIN collections col ON c.id = col.cssnippet_id 
     WHERE col.user_id = ? 
     ORDER BY col.created_at DESC 
     LIMIT ? OFFSET ?`,
    [req.user.userId, limit, offset],
    (err, cssnippets) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 获取总数
      db.get('SELECT COUNT(*) as total FROM collections WHERE user_id = ?', 
        [req.user.userId], (err, result) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        res.json({
          cssnippets,
          pagination: {
            total: result.total,
            page,
            limit,
            pages: Math.ceil(result.total / limit)
          }
        });
      });
    }
  );
});

module.exports = router;
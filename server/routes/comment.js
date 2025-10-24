const express = require('express');
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');
const router = express.Router();
const db = getDB();

// 获取CSS代码段的评论列表
router.get('/cssnippet/:cssnippetId', (req, res) => {
  const { cssnippetId } = req.params;
  
  db.all(
    `SELECT c.*, u.username, u.avatar 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.cssnippet_id = ? 
     ORDER BY c.created_at ASC`,
    [cssnippetId],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 构建评论树
      const commentMap = new Map();
      const rootComments = [];
      
      // 第一次遍历，创建评论映射
      comments.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
      });
      
      // 第二次遍历，构建树结构
      comments.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });
      
      res.json(rootComments);
    }
  );
});

// 创建评论
router.post('/', authMiddleware, (req, res) => {
  const { cssnippetId, content, parentId } = req.body;
  
  if (!cssnippetId || !content) {
    return res.status(400).json({ error: '代码段ID和评论内容不能为空' });
  }
  
  if (content.length > 1000) {
    return res.status(400).json({ error: '评论内容不能超过1000字符' });
  }
  
  // 检查CSS代码段是否存在
  db.get('SELECT * FROM cssnippets WHERE id = ?', [cssnippetId], (err, cssnippet) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!cssnippet) {
      return res.status(404).json({ error: '代码段不存在' });
    }
    
    // 如果是回复，检查父评论是否存在
    if (parentId) {
      db.get('SELECT * FROM comments WHERE id = ? AND cssnippet_id = ?', 
        [parentId, cssnippetId], (err, parentComment) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        if (!parentComment) {
          return res.status(404).json({ error: '父评论不存在' });
        }
        
        createComment(parentId);
      });
    } else {
      createComment(null);
    }
    
    function createComment(parent_id) {
      // 开启事务
      db.run('BEGIN TRANSACTION');
      
      // 创建评论
      db.run(
        'INSERT INTO comments (user_id, cssnippet_id, content, parent_id) VALUES (?, ?, ?, ?)',
        [req.user.userId, cssnippetId, content, parent_id],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '创建评论失败' });
          }
          
          const commentId = this.lastID;
          
          // 更新评论数
          db.run(
            'UPDATE cssnippets SET comments_count = comments_count + 1 WHERE id = ?',
            [cssnippetId],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '更新评论数失败' });
              }
              
              db.run('COMMIT');
              
              // 返回创建的评论信息
              db.get(
                `SELECT c.*, u.username, u.avatar 
                 FROM comments c 
                 JOIN users u ON c.user_id = u.id 
                 WHERE c.id = ?`,
                [commentId],
                (err, comment) => {
                  if (err) {
                    return res.status(500).json({ error: '数据库错误' });
                  }
                  comment.replies = [];
                  res.status(201).json(comment);
                }
              );
            }
          );
        }
      );
    }
  });
});

// 删除评论
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // 获取评论信息
  db.get('SELECT * FROM comments WHERE id = ?', [id], (err, comment) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }
    
    // 检查是否是评论作者或管理员
    if (comment.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权删除此评论' });
    }
    
    // 删除评论（会级联删除回复）
    db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: '删除评论失败' });
      }
      
      // 更新评论数（简化处理，实际应该计算删除的评论数量）
      db.run(
        'UPDATE cssnippets SET comments_count = MAX(0, comments_count - 1) WHERE id = ?',
        [comment.cssnippet_id]
      );
      
      res.json({ message: '删除成功' });
    });
  });
});

module.exports = router;
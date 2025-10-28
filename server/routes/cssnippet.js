const express = require('express');
const { getDB } = require('../db');
const { authMiddleware } = require('./auth');
const router = express.Router();
const db = getDB();

// 安全过滤CSS代码的函数
function filterCSS(css) {
  // 移除危险的CSS属性和值
  return css
    .replace(/expression\([^)]*\)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/@import[^;]*;/gi, '')
    .replace(/url\(['"]?data:[^)]*['"]?\)/gi, '')
    .trim();
}

// 获取热门CSS代码段
router.get('/popular', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  
  // 计算综合得分：点赞数×0.5 + 收藏数×0.3 + 评论数×0.2
  db.all(
    `SELECT c.*, u.username, u.avatar 
     FROM cssnippets c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.created_at >= datetime('now', '-7 days') 
     ORDER BY (c.likes_count * 0.5 + c.collections_count * 0.3 + c.comments_count * 0.2) DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    async (err, cssnippets) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 将每个代码段的status字段转换为is_public字段
      cssnippets.forEach(cssnippet => {
        cssnippet.is_public = cssnippet.status === 'active';
      });
      
      // 如果用户已登录，为每个代码段添加点赞和收藏状态
        if (req.headers.authorization) {
          try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'csstoy_secret_key');
            
            // 先将每个代码段的status字段转换为is_public字段
            cssnippets.forEach(cssnippet => {
              cssnippet.is_public = cssnippet.status === 'active';
            });
            
            // 使用Promise.all并发检查所有代码段的状态
            await Promise.all(cssnippets.map(cssnippet => {
            return new Promise((resolve) => {
              // 检查点赞状态
              db.get('SELECT * FROM likes WHERE user_id = ? AND cssnippet_id = ?', 
                [decoded.userId, cssnippet.id], (err, like) => {
                cssnippet.isLiked = !!like;
                
                // 检查收藏状态
                db.get('SELECT * FROM collections WHERE user_id = ? AND cssnippet_id = ?', 
                  [decoded.userId, cssnippet.id], (err, collection) => {
                  cssnippet.isCollected = !!collection;
                  resolve();
                });
              });
            });
          }));
        } catch (e) {
          // token无效，继续返回基本信息
          console.log('无效的token，不设置点赞和收藏状态');
        }
      }
      
      // 获取总数
      db.get('SELECT COUNT(*) as total FROM cssnippets WHERE created_at >= datetime(\'now\', \'-7 days\')', 
        (err, result) => {
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

// 获取最新CSS代码段
router.get('/latest', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT c.*, u.username, u.avatar 
     FROM cssnippets c 
     JOIN users u ON c.user_id = u.id 
     ORDER BY c.created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    async (err, cssnippets) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 将每个代码段的status字段转换为is_public字段
      cssnippets.forEach(cssnippet => {
        cssnippet.is_public = cssnippet.status === 'active';
      });
      
      // 如果用户已登录，为每个代码段添加点赞和收藏状态
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'csstoy_secret_key');
          
          // 使用Promise.all并发检查所有代码段的状态
          await Promise.all(cssnippets.map(cssnippet => {
            return new Promise((resolve) => {
              // 检查点赞状态
              db.get('SELECT * FROM likes WHERE user_id = ? AND cssnippet_id = ?', 
                [decoded.userId, cssnippet.id], (err, like) => {
                cssnippet.isLiked = !!like;
                
                // 检查收藏状态
                db.get('SELECT * FROM collections WHERE user_id = ? AND cssnippet_id = ?', 
                  [decoded.userId, cssnippet.id], (err, collection) => {
                  cssnippet.isCollected = !!collection;
                  resolve();
                });
              });
            });
          }));
        } catch (e) {
          // token无效，继续返回基本信息
          console.log('无效的token，不设置点赞和收藏状态');
        }
      }
      
      // 获取总数
      db.get('SELECT COUNT(*) as total FROM cssnippets', (err, result) => {
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

// 搜索代码段
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit) || 10;
  
  if (!query.trim()) {
    return res.json([]);
  }
  
  // 搜索标题、描述和标签中包含查询字符串的代码段
  const searchQuery = `
    SELECT DISTINCT c.*, u.username, u.avatar 
    FROM cssnippets c 
    JOIN users u ON c.user_id = u.id
    LEFT JOIN cssnippet_tags ct ON c.id = ct.cssnippet_id
    LEFT JOIN tags t ON ct.tag_id = t.id
    WHERE (c.title LIKE ? OR c.description LIKE ? OR t.name LIKE ?)
    ORDER BY (c.likes_count * 0.5 + c.collections_count * 0.3 + c.comments_count * 0.2) DESC
    LIMIT ?
  `;
  
  const searchParam = `%${query}%`;
  
  db.all(searchQuery, [searchParam, searchParam, searchParam, limit], async (err, cssnippets) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    // 如果用户已登录，为每个代码段添加点赞和收藏状态
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'csstoy_secret_key');
        
        // 先将每个代码段的status字段转换为is_public字段
        cssnippets.forEach(cssnippet => {
          cssnippet.is_public = cssnippet.status === 'active';
        });
        
        // 使用Promise.all并发检查所有代码段的状态
        await Promise.all(cssnippets.map(cssnippet => {
          return new Promise((resolve) => {
            // 检查点赞状态
            db.get('SELECT * FROM likes WHERE user_id = ? AND cssnippet_id = ?', 
              [decoded.userId, cssnippet.id], (err, like) => {
              cssnippet.isLiked = !!like;
              
              // 检查收藏状态
              db.get('SELECT * FROM collections WHERE user_id = ? AND cssnippet_id = ?', 
                [decoded.userId, cssnippet.id], (err, collection) => {
                cssnippet.isCollected = !!collection;
                resolve();
              });
            });
          });
        }));
      } catch (e) {
        // token无效，继续返回基本信息
        console.log('无效的token，不设置点赞和收藏状态');
      }
    }
    
    // 为每个结果获取标签
    await Promise.all(cssnippets.map(cssnippet => {
      return new Promise((resolve) => {
        db.all(
          `SELECT t.id, t.name 
           FROM tags t 
           JOIN cssnippet_tags ct ON t.id = ct.tag_id 
           WHERE ct.cssnippet_id = ?`,
          [cssnippet.id],
          (err, tags) => {
            if (!err) {
              cssnippet.tags = tags;
            }
            resolve();
          }
        );
      });
    }));
    
    res.json(cssnippets);
  });
});

// 获取CSS代码段详情
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // 获取CSS代码段信息
  db.get(
    `SELECT c.*, u.username, u.avatar 
     FROM cssnippets c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.id = ?`,
    [id],
    (err, cssnippet) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      if (!cssnippet) {
        return res.status(404).json({ error: 'CSS代码段不存在' });
      }
      
      // 将status字段转换为is_public字段，保持与前端一致
      cssnippet.is_public = cssnippet.status === 'active';
      
      // 获取标签
      db.all(
        `SELECT t.id, t.name 
         FROM tags t 
         JOIN cssnippet_tags ct ON t.id = ct.tag_id 
         WHERE ct.cssnippet_id = ?`,
        [id],
        (err, tags) => {
          if (err) {
            return res.status(500).json({ error: '数据库错误' });
          }
          
          cssnippet.tags = tags;
          
          // 如果用户已登录，检查是否点赞和收藏
          if (req.headers.authorization) {
            try {
              const token = req.headers.authorization.split(' ')[1];
              const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'csstoy_secret_key');
              
              // 检查点赞状态
              db.get('SELECT * FROM likes WHERE user_id = ? AND cssnippet_id = ?', 
                [decoded.userId, id], (err, like) => {
                if (err) {
                  return res.status(500).json({ error: '数据库错误' });
                }
                
                cssnippet.isLiked = !!like;
                
                // 检查收藏状态
                db.get('SELECT * FROM collections WHERE user_id = ? AND cssnippet_id = ?', 
                  [decoded.userId, id], (err, collection) => {
                  if (err) {
                    return res.status(500).json({ error: '数据库错误' });
                  }
                  
                  cssnippet.isCollected = !!collection;
                  res.json(cssnippet);
                });
              });
            } catch (e) {
              // token无效，只返回基本信息
              res.json(cssnippet);
            }
          } else {
            res.json(cssnippet);
          }
        }
      );
    }
  );
});

// 创建CSS代码段
router.post('/', authMiddleware, (req, res) => {
  // 同时支持cssCode和cssContent参数，优先使用cssContent（前端实际发送的参数名）
  const { title, description, cssCode, cssContent, htmlContent, isPublic, tags } = req.body;
  const cssContentToUse = cssContent || cssCode;
  
  // 记录详细的错误信息以便调试
  console.log('创建CSS代码段请求数据:', { title, description: description?.substring(0, 50) + '...', cssContentLength: cssContentToUse?.length, htmlContentLength: htmlContent?.length, isPublic, tags: tags?.length || 0 });
  console.log('用户信息:', req.user);
  
  if (!title || !cssContentToUse) {
    return res.status(400).json({ error: '标题和CSS内容不能为空' });
  }
  
  if (cssContentToUse.length > 10000) {
    return res.status(400).json({ error: 'CSS内容不能超过10000字符' });
  }
  
  if (htmlContent && htmlContent.length > 5000) {
    return res.status(400).json({ error: 'HTML内容不能超过5000字符' });
  }
  
  // 过滤CSS代码
  const filteredCSS = filterCSS(cssContentToUse);
  
  try {
    db.run(
      'INSERT INTO cssnippets (title, description, css_content, html_content, user_id) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', filteredCSS, htmlContent || '', req.user.userId],
      function(err) {
        if (err) {
          console.error('创建CSS代码段数据库错误:', err.message);
          return res.status(500).json({ error: '创建CSS代码段失败', details: err.message });
        }
        
        const cssnippetId = this.lastID;
        console.log('成功创建CSS代码段，ID:', cssnippetId);
        
        // 保存版本
        db.run(
          'INSERT INTO cssnippet_versions (cssnippet_id, css_content, html_content) VALUES (?, ?, ?)',
          [cssnippetId, filteredCSS, htmlContent || '']
        );
        
        // 处理标签
        if (tags && tags.length > 0) {
          handleTags(cssnippetId, tags, () => {
            res.status(201).json({ message: '创建成功', id: cssnippetId });
          });
        } else {
          res.status(201).json({ message: '创建成功', id: cssnippetId });
        }
      }
    );
  } catch (error) {
    console.error('创建CSS代码段异常:', error);
    res.status(500).json({ error: '创建CSS代码段时发生异常', details: error.message });
  }
});

// 更新CSS代码段
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, description, cssContent, htmlContent, tags } = req.body;
  
  // 检查是否是代码段所有者
  db.get('SELECT * FROM cssnippets WHERE id = ? AND user_id = ?', 
    [id, req.user.userId], (err, cssnippet) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!cssnippet) {
      return res.status(403).json({ error: '无权修改此代码段' });
    }
    
    if (!title || !cssContent) {
      return res.status(400).json({ error: '标题和CSS内容不能为空' });
    }
    
    if (cssContent.length > 10000) {
      return res.status(400).json({ error: 'CSS内容不能超过10000字符' });
    }
    
    if (htmlContent && htmlContent.length > 5000) {
      return res.status(400).json({ error: 'HTML内容不能超过5000字符' });
    }
    
    // 过滤CSS代码
    const filteredCSS = filterCSS(cssContent);
    
    // 更新代码段
    db.run(
      'UPDATE cssnippets SET title = ?, description = ?, css_content = ?, html_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description || '', filteredCSS, htmlContent || '', id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: '更新失败' });
        }
        
        // 保存新版本
        db.run(
          'INSERT INTO cssnippet_versions (cssnippet_id, css_content, html_content) VALUES (?, ?, ?)',
          [id, filteredCSS, htmlContent || '']
        );
        
        // 更新标签
        if (tags !== undefined) {
          // 删除旧标签关联
          db.run('DELETE FROM cssnippet_tags WHERE cssnippet_id = ?', [id], () => {
            handleTags(id, tags || [], () => {
              res.json({ message: '更新成功' });
            });
          });
        } else {
          res.json({ message: '更新成功' });
        }
      }
    );
  });
});

// 切换代码段可见性
router.patch('/:id/visibility', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  console.log(`接收到切换代码段可见性请求，ID: ${id}，用户ID: ${userId}`);
  
  // 检查是否是代码段所有者
  db.get('SELECT * FROM cssnippets WHERE id = ? AND user_id = ?', 
    [id, userId], (err, cssnippet) => {
    if (err) {
      console.error('查询代码段时出错:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!cssnippet) {
      console.log(`用户 ${userId} 无权修改代码段 ${id}`);
      return res.status(403).json({ error: '无权修改此代码段' });
    }
    
    console.log(`找到代码段，当前状态: ${cssnippet.status}`);
    // 使用status列实现可见性切换：'active'表示公开，'private'表示私密
    const newStatus = cssnippet.status === 'active' ? 'private' : 'active';
    const isPublic = newStatus === 'active';
    
    // 更新数据库
    db.run(
      'UPDATE cssnippets SET status = ? WHERE id = ?',
      [newStatus, id],
      function(err) {
        if (err) {
          console.error('更新可见性时出错:', err);
          return res.status(500).json({ error: '更新可见性失败', details: err.message });
        }
        
        console.log(`代码段 ${id} 可见性更新成功，状态从 ${cssnippet.status} 变为 ${newStatus}，影响行数: ${this.changes}`);
        res.json({ 
          message: '可见性更新成功', 
          isPublic: isPublic 
        });
      }
    );
  });
});

// 删除CSS代码段
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // 检查是否是代码段所有者或管理员
  db.get('SELECT * FROM cssnippets WHERE id = ?', [id], (err, cssnippet) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!cssnippet) {
      return res.status(404).json({ error: '代码段不存在' });
    }
    
    if (cssnippet.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: '无权删除此代码段' });
    }
    
    // 删除代码段（级联删除相关数据）
    db.run('DELETE FROM cssnippets WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: '删除失败' });
      }
      res.json({ message: '删除成功' });
    });
  });
});

// 点赞
router.post('/:id/like', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // 检查代码段是否存在
  db.get('SELECT * FROM cssnippets WHERE id = ?', [id], (err, cssnippet) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!cssnippet) {
      return res.status(404).json({ error: '代码段不存在' });
    }
    
    // 检查是否已点赞
    db.get('SELECT * FROM likes WHERE user_id = ? AND cssnippet_id = ?', 
      [req.user.userId, id], (err, like) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (like) {
        return res.status(400).json({ error: '已经点过赞了' });
      }
      
      // 开启事务
      db.run('BEGIN TRANSACTION');
      
      // 添加点赞记录
      db.run(
        'INSERT INTO likes (user_id, cssnippet_id) VALUES (?, ?)',
        [req.user.userId, id],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '点赞失败' });
          }
          
          // 更新点赞数
          db.run(
            'UPDATE cssnippets SET likes_count = likes_count + 1 WHERE id = ?',
            [id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '更新点赞数失败' });
              }
              
              db.run('COMMIT');
              res.json({ message: '点赞成功' });
            }
          );
        }
      );
    });
  });
});

// 取消点赞
router.delete('/:id/like', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // 开启事务
  db.run('BEGIN TRANSACTION');
  
  // 删除点赞记录
  db.run(
    'DELETE FROM likes WHERE user_id = ? AND cssnippet_id = ?',
    [req.user.userId, id],
    function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: '取消点赞失败' });
      }
      
      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: '未点赞' });
      }
      
      // 更新点赞数
      db.run(
        'UPDATE cssnippets SET likes_count = MAX(0, likes_count - 1) WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '更新点赞数失败' });
          }
          
          db.run('COMMIT');
          res.json({ message: '取消点赞成功' });
        }
      );
    }
  );
});

// 收藏
router.post('/:id/collect', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // 检查代码段是否存在
  db.get('SELECT * FROM cssnippets WHERE id = ?', [id], (err, cssnippet) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (!cssnippet) {
      return res.status(404).json({ error: '代码段不存在' });
    }
    
    // 检查是否已收藏
    db.get('SELECT * FROM collections WHERE user_id = ? AND cssnippet_id = ?', 
      [req.user.userId, id], (err, collection) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (collection) {
        return res.status(400).json({ error: '已经收藏过了' });
      }
      
      // 开启事务
      db.run('BEGIN TRANSACTION');
      
      // 添加收藏记录
      db.run(
        'INSERT INTO collections (user_id, cssnippet_id) VALUES (?, ?)',
        [req.user.userId, id],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '收藏失败' });
          }
          
          // 更新收藏数
          db.run(
            'UPDATE cssnippets SET collections_count = collections_count + 1 WHERE id = ?',
            [id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '更新收藏数失败' });
              }
              
              db.run('COMMIT');
              res.json({ message: '收藏成功' });
            }
          );
        }
      );
    });
  });
});

// 取消收藏
router.delete('/:id/collect', authMiddleware, (req, res) => {
  const { id } = req.params;
  
  // 开启事务
  db.run('BEGIN TRANSACTION');
  
  // 删除收藏记录
  db.run(
    'DELETE FROM collections WHERE user_id = ? AND cssnippet_id = ?',
    [req.user.userId, id],
    function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: '取消收藏失败' });
      }
      
      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: '未收藏' });
      }
      
      // 更新收藏数
      db.run(
        'UPDATE cssnippets SET collections_count = MAX(0, collections_count - 1) WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '更新收藏数失败' });
          }
          
          db.run('COMMIT');
          res.json({ message: '取消收藏成功' });
        }
      );
    }
  );
});

// 获取版本历史
router.get('/:id/versions', (req, res) => {
  const { id } = req.params;
  
  db.all(
    'SELECT * FROM cssnippet_versions WHERE cssnippet_id = ? ORDER BY created_at DESC',
    [id],
    (err, versions) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json(versions);
    }
  );
});

// 处理标签的辅助函数
function handleTags(cssnippetId, tags, callback) {
  let tagIndex = 0;
  
  function processNextTag() {
    if (tagIndex >= tags.length) {
      callback();
      return;
    }
    
    const tagName = tags[tagIndex].trim();
    if (tagName) {
      // 查找或创建标签
      db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err, tag) => {
        if (err) {
          console.error('处理标签时出错:', err);
          tagIndex++;
          processNextTag();
          return;
        }
        
        if (tag) {
          // 更新使用次数
          db.run('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [tag.id]);
          // 添加关联
          db.run('INSERT OR IGNORE INTO cssnippet_tags (cssnippet_id, tag_id) VALUES (?, ?)', 
            [cssnippetId, tag.id]);
        } else {
          // 创建新标签
          db.run('INSERT INTO tags (name, usage_count) VALUES (?, 1)', [tagName], function(err) {
            if (!err) {
              db.run('INSERT INTO cssnippet_tags (cssnippet_id, tag_id) VALUES (?, ?)', 
                [cssnippetId, this.lastID]);
            }
          });
        }
        
        tagIndex++;
        processNextTag();
      });
    } else {
      tagIndex++;
      processNextTag();
    }
  }
  
  processNextTag();
}

module.exports = router;
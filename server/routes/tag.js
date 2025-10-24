const express = require('express');
const { getDB } = require('../db');
const router = express.Router();
const db = getDB();

// 获取热门标签
router.get('/popular', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  
  db.all(
    'SELECT * FROM tags ORDER BY usage_count DESC LIMIT ?',
    [limit],
    (err, tags) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json(tags);
    }
  );
});

// 根据标签搜索CSS代码段
router.get('/:tagName/cssnippets', (req, res) => {
  const { tagName } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT c.*, u.username, u.avatar 
     FROM cssnippets c 
     JOIN users u ON c.user_id = u.id 
     JOIN cssnippet_tags ct ON c.id = ct.cssnippet_id 
     JOIN tags t ON ct.tag_id = t.id 
     WHERE t.name = ? 
     ORDER BY c.created_at DESC 
     LIMIT ? OFFSET ?`,
    [tagName, limit, offset],
    (err, cssnippets) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 获取总数
      db.get(
        `SELECT COUNT(*) as total 
         FROM cssnippets c 
         JOIN cssnippet_tags ct ON c.id = ct.cssnippet_id 
         JOIN tags t ON ct.tag_id = t.id 
         WHERE t.name = ?`,
        [tagName],
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
        }
      );
    }
  );
});

// 搜索标签（自动补全）
router.get('/search', (req, res) => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit) || 10;
  
  if (!q) {
    return res.json([]);
  }
  
  db.all(
    'SELECT * FROM tags WHERE name LIKE ? ORDER BY usage_count DESC LIMIT ?',
    [`${q}%`, limit],
    (err, tags) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json(tags);
    }
  );
});

module.exports = router;
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, 'csstoy.db');
let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
        reject(err);
      } else {
        console.log('成功连接到SQLite数据库');
        // 创建数据表
        createTables().then(() => {
          resolve(db);
        }).catch(reject);
      }
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const queries = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT 'default.png',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        role TEXT DEFAULT 'user',
        reset_question TEXT,
        reset_answer TEXT
      );`,
      
      // CSS代码段表
      `CREATE TABLE IF NOT EXISTS cssnippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        css_content TEXT NOT NULL,
        html_content TEXT,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        likes_count INTEGER DEFAULT 0,
        collections_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
      );`,
      
      // 标签表
      `CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        usage_count INTEGER DEFAULT 0
      );`,
      
      // CSS-标签关联表
      `CREATE TABLE IF NOT EXISTS cssnippet_tags (
        cssnippet_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (cssnippet_id, tag_id),
        FOREIGN KEY (cssnippet_id) REFERENCES cssnippets(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );`,
      
      // 点赞表
      `CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        cssnippet_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, cssnippet_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (cssnippet_id) REFERENCES cssnippets(id) ON DELETE CASCADE
      );`,
      
      // 收藏表
      `CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        cssnippet_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, cssnippet_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (cssnippet_id) REFERENCES cssnippets(id) ON DELETE CASCADE
      );`,
      
      // 评论表
      `CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        cssnippet_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        parent_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (cssnippet_id) REFERENCES cssnippets(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      );`,
      
      // 代码版本表
      `CREATE TABLE IF NOT EXISTS cssnippet_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cssnippet_id INTEGER NOT NULL,
        css_content TEXT NOT NULL,
        html_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cssnippet_id) REFERENCES cssnippets(id) ON DELETE CASCADE
      );`
    ];

    let queryIndex = 0;
    
    function executeNextQuery() {
      if (queryIndex >= queries.length) {
        resolve();
        return;
      }

      db.run(queries[queryIndex], (err) => {
        if (err) {
          console.error(`创建表时出错 (${queryIndex + 1}):`, err.message);
          reject(err);
        } else {
          queryIndex++;
          executeNextQuery();
        }
      });
    }

    executeNextQuery();
  });
}

function getDB() {
  return db;
}

module.exports = {
  initDatabase,
  getDB
};
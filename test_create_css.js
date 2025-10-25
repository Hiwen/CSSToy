const http = require('http');

const postData = JSON.stringify({
  "title": "测试标题",
  "description": "测试描述",
  "cssContent": "/* 测试CSS代码 */\nbackground-color: #f00;\ncolor: white;",
  "tags": [],
  "isPublic": true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cssnippets',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer test_token' // 这里使用测试token
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`响应: ${chunk}`);
  });
  res.on('end', () => {
    console.log('响应结束');
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

// 写入数据
req.write(postData);
req.end();
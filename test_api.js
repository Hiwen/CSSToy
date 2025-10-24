const http = require('http');
const fs = require('fs');

// API基础URL
const API_BASE = 'http://localhost:3000/api';

// HTTP请求函数
function httpRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试数据
const testData = {
  title: '居中',
  description: '居中',
  cssCode: '/* 请输入您的CSS代码 */\nbackground-color: #3498db;\ncolor: white;\npadding: 20px;\nborder-radius: 8px;\ntext-align: center;\nfont-size: 18px;',
  tags: [],
  isPublic: true
};

async function testCreateCssnippet() {
  console.log('测试创建CSS代码段API...');
  console.log('测试数据:', JSON.stringify(testData, null, 2));
  
  try {
    // 首先尝试登录获取token（使用默认的测试账号，如果不存在会失败）
    let token = null;
    try {
      console.log('尝试登录...');
      const loginResponse = await httpRequest('POST', '/auth/login', {
        email: 'test@example.com',
        password: 'Test1234',
        remember: true
      });
      
      console.log('登录响应状态码:', loginResponse.statusCode);
      console.log('登录响应数据:', loginResponse.data);
      
      if (loginResponse.statusCode === 200 && loginResponse.data.token) {
        token = loginResponse.data.token;
        console.log('登录成功，获取到token');
      } else {
        throw new Error('登录失败');
      }
    } catch (loginError) {
      console.log('登录失败，尝试注册新用户...');
      // 尝试注册新用户
      try {
        const registerResponse = await httpRequest('POST', '/auth/register', {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test1234',
          confirmPassword: 'Test1234',
          resetQuestion: 'What is your favorite color?',
          resetAnswer: 'blue'
        });
        
        console.log('注册响应状态码:', registerResponse.statusCode);
        console.log('注册响应数据:', registerResponse.data);
        
        if (registerResponse.statusCode === 201 && registerResponse.data.token) {
          token = registerResponse.data.token;
          console.log('注册成功，获取到token');
        } else {
          throw new Error('注册失败');
        }
      } catch (registerError) {
        console.error('注册失败:', registerError.message);
        return;
      }
    }
    
    // 测试创建CSS代码段
    console.log('尝试创建CSS代码段...');
    const response = await httpRequest('POST', '/cssnippets', testData, {
      Authorization: `Bearer ${token}`
    });
    
    console.log('创建响应状态码:', response.statusCode);
    console.log('创建响应数据:', response.data);
    
    if (response.statusCode === 201) {
      console.log('创建成功!');
    } else {
      console.error('创建失败:', response.data);
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 运行测试
testCreateCssnippet();
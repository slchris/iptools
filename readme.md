# IP Tools 🌍

一个简洁高效的IP地址查询工具，支持Web界面和命令行查询，部署在Cloudflare Workers上，完全免费。

## ✨ 功能特点

- 🚀 **零成本部署** - 基于Cloudflare Workers，享受免费额度
- 🌐 **双模式支持** - Web界面 + 命令行curl查询
- 📍 **地理位置信息** - 显示国家、城市、ISP等详细信息
- 📱 **响应式设计** - 完美适配桌面端和移动端
- ⚡ **全球加速** - 借助Cloudflare CDN网络
- 🎨 **现代化UI** - 参考ip.skk.moe的美观设计

## 🚀 快速使用

### 命令行查询

```bash
# 获取当前IP地址
curl https://your-domain.com

# 获取详细JSON信息
curl https://your-domain.com/api/ip
```

### Web界面

直接在浏览器中访问：`https://your-domain.com`

## 📦 部署指南

### 准备工作

1. 注册 [Cloudflare](https://cloudflare.com) 账户
2. 安装 Node.js (推荐v18+)
3. 安装Wrangler CLI

### 安装依赖

```bash
npm install
# 或者
npm install -g wrangler
```

### 本地开发

```bash
# 启动本地开发服务器
npm run dev
# 或者
wrangler dev
```

### 部署到Cloudflare Workers

```bash
# 登录Cloudflare账户
wrangler login

# 部署到生产环境
npm run deploy
# 或者
wrangler deploy
```

### 自定义域名配置

1. 在Cloudflare Dashboard中添加你的域名
2. 修改 `wrangler.toml` 文件中的路由配置：

```toml
[env.production]
routes = [
  { pattern = "ip.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

3. 重新部署：`wrangler deploy`

## 📁 项目结构

```
iptools/
├── index.js          # Cloudflare Worker主文件
├── package.json      # 项目配置
├── wrangler.toml     # Cloudflare Workers配置
├── .gitignore        # Git忽略文件
└── README.md         # 项目文档
```

## 🔧 API接口

### 获取IP地址（纯文本）
- **URL**: `/`
- **方法**: GET
- **User-Agent**: curl, wget等命令行工具
- **响应**: 纯文本IP地址

### 获取详细信息（JSON）
- **URL**: `/api/ip`
- **方法**: GET  
- **响应**: JSON格式的详细信息

```json
{
  "ip": "103.117.102.186",
  "timestamp": "2024-10-24T10:30:00.000Z",
  "country": "CN", 
  "region": "Beijing",
  "city": "Beijing",
  "timezone": "Asia/Shanghai",
  "asn": 4134,
  "asOrganization": "Chinanet"
}
```

## 🎨 自定义配置

### 修改样式

编辑 `index.js` 文件中的CSS样式部分，可以自定义：
- 颜色主题
- 字体样式  
- 布局排版
- 响应式断点

### 添加功能

Worker代码支持扩展：
- 添加更多IP信息API
- 集成第三方地理位置服务
- 添加访问统计功能
- 实现IP黑名单过滤

## 🔒 安全特性

- **无日志记录** - 不存储用户IP或访问记录
- **HTTPS加密** - 所有请求通过SSL/TLS加密
- **CORS支持** - 支持跨域请求访问API
- **请求限制** - Cloudflare自带DDoS防护

## 💡 使用场景

- 检查本机公网IP地址
- 网络调试和故障排查
- 服务器脚本中获取IP信息
- 地理位置相关的应用开发
- 网络安全分析工具

## 📊 性能优势

- **响应速度** < 100ms（全球平均）
- **可用性** > 99.9%（Cloudflare SLA保证）
- **免费额度** 100,000次/天（足够个人使用）
- **全球节点** 覆盖200+城市

## 🤝 贡献指南

欢迎提交Issue和Pull Request：

1. Fork本项目
2. 创建特性分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)

## 🔗 相关链接

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)
- [参考项目 ip.skk.moe](https://ip.skk.moe/)

---

**享受免费的IP查询服务！** 🎉

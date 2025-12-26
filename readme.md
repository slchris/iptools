# IP Tools

一个简洁的 IP 地址查询工具，支持 Web 界面和命令行查询，部署在 Cloudflare Workers 上。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/slchris/iptools)

## 功能

- 支持 Web 界面和 curl 命令行查询
- 显示 IP 地址、地理位置、运营商等信息
- 响应式设计，支持 IPv6 完整显示
- 基于 Cloudflare Workers，全球加速

## 使用

### 命令行

```bash
# 获取 IP 地址
curl https://ip.plz.ac

# 跟随重定向
curl -L ip.plz.ac

# 获取 JSON 格式详细信息
curl https://ip.plz.ac/api/ip
```

> Cloudflare 会自动将 HTTP 重定向到 HTTPS，因此直接 `curl ip.plz.ac` 只会看到 301 重定向。请使用 `https://` 前缀或添加 `-L` 参数。

### Web 界面

浏览器访问 `https://ip.plz.ac`

## 部署

### 一键部署

点击上方按钮，按提示操作即可部署到你的 Cloudflare 账户。

### 手动部署

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 登录并部署
wrangler login
npm run deploy
```

### 自定义域名

修改 `wrangler.toml`：

```toml
routes = [
  { pattern = "ip.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## API

### GET /

返回纯文本 IP 地址（curl 等命令行工具）或 Web 页面（浏览器）。

### GET /api/ip

返回 JSON 格式详细信息：

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

## 项目结构

```
iptools/
├── index.js          # Worker 主文件
├── package.json      # 项目配置
├── wrangler.toml     # Cloudflare 配置
├── tests/            # 单元测试
└── .github/workflows # CI/CD
```

## License

MIT

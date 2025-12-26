// Cloudflare Worker for IP Tools
// 支持Web界面和curl命令查询IP地址

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     request.headers.get('X-Real-IP') || 
                     '127.0.0.1';

    // 检测用户代理，判断是否为命令行工具
    const userAgent = request.headers.get('User-Agent') || '';
    const isCurl = userAgent.includes('curl') || 
                   userAgent.includes('wget') || 
                   userAgent.includes('HTTPie') ||
                   request.headers.get('Accept')?.includes('text/plain');
    
    // 对于curl等命令行工具，即使是HTTP请求也直接返回IP（为了用户体验）
    // 对于浏览器访问，强制重定向到HTTPS（本地开发环境除外）
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol === 'http:' && !isCurl && !isLocalhost) {
      const httpsUrl = url.toString().replace('http:', 'https:');
      return Response.redirect(httpsUrl, 301);
    }

    // 获取IP地理位置信息（使用Cloudflare的CF对象，如果可用）
    const getLocationInfo = () => {
      const cf = request.cf;
      if (cf) {
        return {
          country: cf.country,
          region: cf.region,
          city: cf.city,
          timezone: cf.timezone,
          asn: cf.asn,
          asOrganization: cf.asOrganization
        };
      }
      return {};
    };

    // 处理不同的路径
    if (url.pathname === '/api/ip' || url.pathname === '/ip') {
      // API端点，返回JSON格式的详细信息
      const locationInfo = getLocationInfo();
      const response = {
        ip: clientIP,
        timestamp: new Date().toISOString(),
        userAgent: userAgent,
        ...locationInfo
      };
      
      return new Response(JSON.stringify(response, null, 2) + '\n', {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // 如果是curl等命令行工具，直接返回IP
    if (isCurl) {
      return new Response(clientIP + '\n', {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // 默认返回Web页面
    const gaId = env.GA_ID || '';
    const html = getWebPage(clientIP, getLocationInfo(), gaId);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
};

// 生成Web页面HTML
function getWebPage(ip, locationInfo, gaId = '') {
  const location = [locationInfo.city, locationInfo.region, locationInfo.country].filter(Boolean).join(', ');
  const isp = locationInfo.asOrganization || '';
  const asn = locationInfo.asn ? `AS${locationInfo.asn}` : '';
  const timezone = locationInfo.timezone || '';
  
  // Google Analytics 代码（仅在配置了 GA_ID 时启用）
  const gaScript = gaId ? `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    </script>` : '';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IP Tools - IP地址查询</title>${gaScript}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            padding: 2rem 1rem;
            color: #333;
        }
        .container {
            max-width: 640px;
            margin: 0 auto;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: #111;
        }
        .card {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .card-title {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #888;
            margin-bottom: 0.75rem;
        }
        .ip {
            font-size: clamp(1.1rem, 4vw, 1.75rem);
            font-weight: 600;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            color: #111;
            word-break: break-all;
            cursor: pointer;
            padding: 0.5rem;
            margin: -0.5rem;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .ip:hover { background: #f5f5f5; }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .info-item {
            font-size: 0.9rem;
        }
        .info-label {
            font-size: 0.75rem;
            color: #888;
            margin-bottom: 0.25rem;
        }
        .info-value {
            color: #333;
            word-break: break-all;
        }
        .section-title {
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
        }
        .code-block {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 0.875rem 1rem;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 0.85rem;
            margin-bottom: 0.75rem;
            overflow-x: auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }
        .code-block code {
            flex: 1;
        }
        .copy-btn {
            background: transparent;
            border: 1px solid #555;
            color: #aaa;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.75rem;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .copy-btn:hover {
            background: #333;
            color: #fff;
            border-color: #666;
        }
        .note {
            font-size: 0.8rem;
            color: #666;
            margin-top: 1rem;
            padding: 0.75rem;
            background: #fafafa;
            border-radius: 4px;
            border-left: 3px solid #ddd;
        }
        .note code {
            background: #eee;
            padding: 0.1rem 0.3rem;
            border-radius: 3px;
            font-size: 0.8rem;
        }
        .footer {
            text-align: center;
            font-size: 0.8rem;
            color: #999;
            margin-top: 2rem;
        }
        .footer a {
            color: #666;
            text-decoration: none;
        }
        .footer a:hover { text-decoration: underline; }
        .toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: #fff;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 0.9rem;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }
        .toast.show { opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>IP Tools</h1>
        
        <div class="card">
            <div class="card-title">您的 IP 地址</div>
            <div class="ip" onclick="copy('${ip}')" title="点击复制">${ip}</div>
            
            ${location || isp || asn || timezone ? `
            <div class="info-grid">
                ${location ? `<div class="info-item"><div class="info-label">位置</div><div class="info-value">${location}</div></div>` : ''}
                ${isp ? `<div class="info-item"><div class="info-label">运营商</div><div class="info-value">${isp}</div></div>` : ''}
                ${asn ? `<div class="info-item"><div class="info-label">ASN</div><div class="info-value">${asn}</div></div>` : ''}
                ${timezone ? `<div class="info-item"><div class="info-label">时区</div><div class="info-value">${timezone}</div></div>` : ''}
            </div>
            ` : ''}
        </div>
        
        <div class="card">
            <div class="section-title">命令行使用</div>
            
            <div class="code-block">
                <code>curl https://ip.plz.ac</code>
                <button class="copy-btn" onclick="copy('curl https://ip.plz.ac')">复制</button>
            </div>
            
            <div class="code-block">
                <code>curl -L ip.plz.ac</code>
                <button class="copy-btn" onclick="copy('curl -L ip.plz.ac')">复制</button>
            </div>
            
            <div class="note">
                <strong>提示：</strong>Cloudflare 会自动将 HTTP 重定向到 HTTPS，因此直接使用 <code>curl ip.plz.ac</code> 无法获取结果。请使用 <code>https://</code> 前缀，或添加 <code>-L</code> 参数让 curl 跟随重定向。
            </div>
        </div>
        
        <div class="card">
            <div class="section-title">API 接口</div>
            
            <div class="code-block">
                <code>curl https://ip.plz.ac/api/ip</code>
                <button class="copy-btn" onclick="copy('curl https://ip.plz.ac/api/ip')">复制</button>
            </div>
            
            <div class="note">
                返回 JSON 格式的详细信息，包含 IP 地址、地理位置、运营商等数据。
            </div>
        </div>
        
        <div class="footer">
            Powered by <a href="https://workers.cloudflare.com" target="_blank">Cloudflare Workers</a>
        </div>
    </div>
    
    <div class="toast" id="toast">已复制</div>
    
    <script>
        function copy(text) {
            navigator.clipboard.writeText(text).then(() => {
                const t = document.getElementById('toast');
                t.classList.add('show');
                setTimeout(() => t.classList.remove('show'), 1500);
            });
        }
    </script>
</body>
</html>`;
}
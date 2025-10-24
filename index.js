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
    // 对于浏览器访问，强制重定向到HTTPS
    if (url.protocol === 'http:' && !isCurl) {
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
      
      return new Response(JSON.stringify(response, null, 2), {
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
    const html = getWebPage(clientIP, getLocationInfo());
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  }
};

// 生成Web页面HTML
function getWebPage(ip, locationInfo) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IP Tools - IP地址查询工具</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        
        .title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
        
        .ip-display {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 1.8rem;
            font-weight: 600;
            color: #495057;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .ip-display:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .info-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            text-align: left;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 0.5rem;
        }
        
        .info-value {
            color: #6c757d;
            font-family: monospace;
        }
        
        .usage-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #e9ecef;
        }
        
        .usage-title {
            font-weight: 600;
            margin-bottom: 1rem;
            color: #495057;
        }
        
        .code-block {
            background: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            margin: 0.5rem 0;
            text-align: left;
            overflow-x: auto;
        }
        
        .copy-btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-top: 0.5rem;
            transition: all 0.3s ease;
        }
        
        .copy-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 1.5rem;
                margin: 1rem;
            }
            
            .title {
                font-size: 2rem;
            }
            
            .ip-display {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">IP Tools</h1>
        <p class="subtitle">你的IP地址查询工具</p>
        
        <div class="ip-display" onclick="copyToClipboard('${ip}')" title="点击复制IP地址">
            ${ip}
        </div>
        
        ${locationInfo.country ? `
        <div class="info-grid">
            ${locationInfo.country ? `<div class="info-item"><div class="info-label">国家/地区</div><div class="info-value">${locationInfo.country}</div></div>` : ''}
            ${locationInfo.region ? `<div class="info-item"><div class="info-label">省/州</div><div class="info-value">${locationInfo.region}</div></div>` : ''}
            ${locationInfo.city ? `<div class="info-item"><div class="info-label">城市</div><div class="info-value">${locationInfo.city}</div></div>` : ''}
            ${locationInfo.timezone ? `<div class="info-item"><div class="info-label">时区</div><div class="info-value">${locationInfo.timezone}</div></div>` : ''}
            ${locationInfo.asn ? `<div class="info-item"><div class="info-label">ASN</div><div class="info-value">${locationInfo.asn}</div></div>` : ''}
            ${locationInfo.asOrganization ? `<div class="info-item"><div class="info-label">ISP</div><div class="info-value">${locationInfo.asOrganization}</div></div>` : ''}
        </div>
        ` : ''}
        
        <div class="usage-section">
            <div class="usage-title">命令行使用方法</div>
            <div class="code-block">curl ${new URL(globalThis.location || 'https://ip.plz.ac').origin}</div>
            <button class="copy-btn" onclick="copyToClipboard('curl ${new URL(globalThis.location || 'https://ip.plz.ac').origin}')">复制命令</button>
            
            <div style="margin-top: 1rem;">
                <div class="usage-title">API接口</div>
                <div class="code-block">curl ${new URL(globalThis.location || 'https://ip.plz.ac').origin}/api/ip</div>
                <button class="copy-btn" onclick="copyToClipboard('curl ${new URL(globalThis.location || 'https://ip.plz.ac').origin}/api/ip')">复制命令</button>
            </div>
        </div>
    </div>

    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(function() {
                // 显示复制成功的提示
                const originalTitle = document.title;
                document.title = '已复制到剪贴板！';
                setTimeout(() => {
                    document.title = originalTitle;
                }, 2000);
            }).catch(function(err) {
                console.error('复制失败: ', err);
            });
        }
        
        // 自动更新时间戳
        setInterval(() => {
            const now = new Date().toLocaleString('zh-CN');
            console.log('当前时间:', now);
        }, 60000);
    </script>
</body>
</html>`;
}
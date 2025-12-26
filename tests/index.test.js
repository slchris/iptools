import { describe, it, expect } from 'vitest';

// 模拟 request 对象
const createMockRequest = (options = {}) => {
  const {
    url = 'https://example.com/',
    headers = {},
    cf = null
  } = options;

  const headerMap = new Map(Object.entries({
    'CF-Connecting-IP': '1.2.3.4',
    'User-Agent': 'Mozilla/5.0',
    ...headers
  }));

  return {
    url,
    headers: {
      get: (key) => headerMap.get(key) || null
    },
    cf
  };
};

// 动态导入 worker
const importWorker = async () => {
  const module = await import('../index.js');
  return module.default;
};

describe('IP Tools Worker', () => {
  describe('IP Detection', () => {
    it('should return client IP from CF-Connecting-IP header', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        url: 'https://example.com/api/ip',
        headers: { 'CF-Connecting-IP': '192.168.1.1' }
      });

      const response = await worker.fetch(request, {}, {});
      const data = await response.json();

      expect(data.ip).toBe('192.168.1.1');
    });

    it('should return IP as plain text for curl requests', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        headers: { 
          'CF-Connecting-IP': '10.0.0.1',
          'User-Agent': 'curl/7.68.0' 
        }
      });

      const response = await worker.fetch(request, {}, {});
      const text = await response.text();

      expect(text.trim()).toBe('10.0.0.1');
      expect(response.headers.get('Content-Type')).toBe('text/plain');
    });

    it('should return IP as plain text for wget requests', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        headers: { 
          'CF-Connecting-IP': '10.0.0.2',
          'User-Agent': 'wget/1.21' 
        }
      });

      const response = await worker.fetch(request, {}, {});
      const text = await response.text();

      expect(text.trim()).toBe('10.0.0.2');
    });
  });

  describe('API Endpoint', () => {
    it('should return JSON for /api/ip endpoint', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        url: 'https://example.com/api/ip',
        headers: { 'CF-Connecting-IP': '8.8.8.8' }
      });

      const response = await worker.fetch(request, {}, {});
      const data = await response.json();

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(data).toHaveProperty('ip');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('userAgent');
    });

    it('should include location info when cf object is present', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        url: 'https://example.com/api/ip',
        cf: {
          country: 'US',
          region: 'California',
          city: 'San Francisco',
          timezone: 'America/Los_Angeles',
          asn: 13335,
          asOrganization: 'Cloudflare'
        }
      });

      const response = await worker.fetch(request, {}, {});
      const data = await response.json();

      expect(data.country).toBe('US');
      expect(data.city).toBe('San Francisco');
    });
  });

  describe('Web Page', () => {
    it('should return HTML for browser requests', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        url: 'https://example.com/'
      });

      const response = await worker.fetch(request, {}, {});
      const html = await response.text();

      expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('IP Tools');
    });
  });

  describe('HTTPS Redirect', () => {
    it('should redirect HTTP to HTTPS for browser requests', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        url: 'http://example.com/'
      });

      const response = await worker.fetch(request, {}, {});

      expect(response.status).toBe(301);
    });

    it('should not redirect HTTP for curl requests', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        url: 'http://example.com/',
        headers: { 'User-Agent': 'curl/7.68.0' }
      });

      const response = await worker.fetch(request, {}, {});

      expect(response.status).not.toBe(301);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers in API response', async () => {
      const worker = await importWorker();
      const request = createMockRequest({
        url: 'https://example.com/api/ip'
      });

      const response = await worker.fetch(request, {}, {});

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});

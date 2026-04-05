#!/usr/bin/env node

/**
 * ZKTeco HTTP gateway (LAN bridge)
 *
 * Purpose:
 * - Many ZKTeco devices only support plain HTTP and cannot follow 301 redirects to HTTPS.
 * - Render (and most hosts) redirect http:// -> https://.
 * - Run this gateway on a machine inside the same LAN as the device.
 * - Configure the device to point to: http://<gateway-ip>:<port>/iclock
 * - The gateway forwards requests to the HTTPS backend:
 *     https://amoudums-backend.onrender.com/iclock
 *
 * Usage:
 *   node scripts/zk-http-gateway.js --port 8080 --target https://amoudums-backend.onrender.com
 *
 * Environment:
 *   PORT=8080
 *   TARGET_BASE_URL=https://amoudums-backend.onrender.com
 */

const http = require('http');
const https = require('https');

function parseArgs(argv) {
  const args = { port: undefined, target: undefined };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--port') {
      args.port = argv[i + 1];
      i++;
      continue;
    }
    if (a === '--target') {
      args.target = argv[i + 1];
      i++;
      continue;
    }
  }
  return args;
}

function pickTargetBaseUrl(argTarget) {
  const raw = String(process.env.TARGET_BASE_URL || argTarget || 'https://amoudums-backend.onrender.com').trim();
  if (!raw) throw new Error('TARGET_BASE_URL is empty');

  // Normalize: we want just the origin, no trailing slash.
  const u = new URL(raw);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error(`Unsupported TARGET_BASE_URL protocol: ${u.protocol}`);
  }
  u.pathname = '';
  u.search = '';
  u.hash = '';
  return u.toString().replace(/\/$/, '');
}

function pickPort(argPort) {
  const raw = String(process.env.PORT || argPort || '8080').trim();
  const port = Number(raw);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port: ${raw}`);
  }
  return port;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const targetBaseUrl = pickTargetBaseUrl(args.target);
  const port = pickPort(args.port);

  const server = http.createServer(async (req, res) => {
    try {
      // Basic health for humans.
      if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, targetBaseUrl }));
        return;
      }

      const originalUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      if (!originalUrl.pathname.startsWith('/iclock/')) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const forwardUrl = new URL(originalUrl.pathname + originalUrl.search, targetBaseUrl);
      const isHttps = forwardUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const body = await readBody(req);

      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;

      headers['x-forwarded-proto'] = 'http';
      headers['x-forwarded-host'] = String(req.headers.host || '');

      if (body.length > 0) {
        headers['content-length'] = String(body.length);
      } else {
        delete headers['content-length'];
      }

      const started = Date.now();
      const proxyReq = client.request(
        forwardUrl,
        {
          method: req.method,
          headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          proxyRes.pipe(res);

          proxyRes.on('end', () => {
            const ms = Date.now() - started;
            const status = proxyRes.statusCode || 0;
            console.log(`[gateway] ${req.method} ${originalUrl.pathname} -> ${status} (${ms}ms)`);
          });
        }
      );

      proxyReq.on('error', (e) => {
        console.error('[gateway] Forward error:', e && e.message ? e.message : e);
        res.writeHead(502, { 'content-type': 'text/plain' });
        res.end('Bad gateway');
      });

      if (body.length > 0) proxyReq.write(body);
      proxyReq.end();
    } catch (e) {
      console.error('[gateway] Handler error:', e && e.message ? e.message : e);
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end('Internal error');
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[gateway] Listening on http://0.0.0.0:${port}`);
    console.log(`[gateway] Forwarding /iclock/* to ${targetBaseUrl}/iclock/*`);
    console.log(`[gateway] Tip: set device server to http://<this-pc-ip>:${port}/iclock`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

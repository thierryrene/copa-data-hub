#!/usr/bin/env node
// Servidor estático com fallback SPA + rewrite para /champions.
// Inclui proxy /api/football/* → api.football-data.org para contornar CORS em dev.
// Em produção usar Vercel Functions para o mesmo proxy.

'use strict';

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const PORT = Number.parseInt(process.argv[2], 10) || 3000;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function safeResolve(relativePath) {
  const resolved = path.resolve(ROOT, '.' + relativePath);
  if (!resolved.startsWith(ROOT)) return null;
  return resolved;
}

function serveFile(filePath, req, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function proxyFootballApi(req, res) {
  const parsed = url.parse(req.url);
  // Remove o prefixo /api/football e repassa o resto para a API externa
  const apiPath = parsed.pathname.replace('/api/football', '') + (parsed.search || '');
  const token = parsed.query
    ? new URLSearchParams(parsed.search).get('_token')
    : null;

  // Extrai o token da query string sem expô-lo ao browser no path real
  const cleanSearch = parsed.search
    ? '?' + parsed.search.slice(1).replace(/&?_token=[^&]*/g, '').replace(/^\&/, '')
    : '';
  const cleanPath = parsed.pathname.replace('/api/football', '') + cleanSearch;

  const options = {
    hostname: 'api.football-data.org',
    port: 443,
    path: cleanPath,
    method: 'GET',
    headers: {
      'X-Auth-Token': token || ''
    }
  };

  const proxy = https.request(options, (apiRes) => {
    res.writeHead(apiRes.statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    apiRes.pipe(res);
  });

  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error: não foi possível alcançar a API.' }));
  });

  proxy.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || '/');

  if (pathname.startsWith('/api/football/')) {
    proxyFootballApi(req, res);
    return;
  }

  if (pathname === '/') {
    serveFile(path.join(ROOT, 'index.html'), req, res);
    return;
  }

  if (pathname === '/champions' || pathname.startsWith('/champions/')) {
    serveFile(path.join(ROOT, 'champions.html'), req, res);
    return;
  }

  const target = safeResolve(pathname);
  if (!target) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  fs.stat(target, (err, stats) => {
    if (!err && stats.isFile()) {
      serveFile(target, req, res);
      return;
    }

    const hasExtension = path.extname(pathname) !== '';
    if (hasExtension) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    serveFile(path.join(ROOT, 'index.html'), req, res);
  });
});

server.listen(PORT, () => {
  console.log(`CopaDataHub dev server rodando em http://127.0.0.1:${PORT}`);
  console.log('Fallback SPA ativo para paths sem extensão. Rota /champions → champions.html.');
  console.log('Ctrl+C para sair.');
});
